import { type RequestHandler } from 'express'
import crypto from 'crypto'
import joi from '../../utils/joi'
import Account from '../../models/Account'
import PasswordResetToken from '../../models/PasswordResetToken'
import { sendPasswordResetEmail } from '../../utils/email'
import { APP_URL } from '../../constants'

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000

const hashResetToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex')

const requestPasswordReset: RequestHandler = async (req, res, next) => {
  try {
    const validationError = await joi.validate(
      { email: joi.instance.string().email().required() },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const email = String(req.body.email || '').trim().toLowerCase()

    const account = await Account.findOne({ email }).select('_id email')
    if (!account) {
      res.status(404).json({
        message: 'No account was found with that email address.',
      })
      return
    }

    await PasswordResetToken.deleteMany({ accountId: account._id })

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashResetToken(rawToken)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS)

    await PasswordResetToken.create({ accountId: account._id, tokenHash, expiresAt })

    const resetUrl = `${APP_URL}/#/?token=${rawToken}`
    await sendPasswordResetEmail(email, resetUrl)

    res.status(200).json({
      message: `Reset link sent to ${email}. Check your inbox and junk/spam folder.`,
    })
    return
  } catch (error) {
    next(error)
  }
}

export default requestPasswordReset
