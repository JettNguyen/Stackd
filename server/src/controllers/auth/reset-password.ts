import { type RequestHandler } from 'express'
import crypto from 'crypto'
import joi from '../../utils/joi'
import Account from '../../models/Account'
import PasswordResetToken from '../../models/PasswordResetToken'
import crypt from '../../utils/crypt'

const hashResetToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex')

const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const validationError = await joi.validate(
      {
        token: joi.instance.string().required(),
        password: joi.instance.string().min(6).required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const rawToken = String(req.body.token || '')
    const newPassword = String(req.body.password || '')

    const tokenHash = hashResetToken(rawToken)
    const record = await PasswordResetToken.findOne({ tokenHash })

    if (!record || record.expiresAt < new Date()) {
      if (record) await PasswordResetToken.deleteOne({ _id: record._id })
      return next({ statusCode: 400, message: 'Reset link is invalid or has expired.' })
    }

    const newHash = await crypt.hash(newPassword)
    const updated = await Account.findByIdAndUpdate(record.accountId, { password: newHash })
    if (!updated) {
      await PasswordResetToken.deleteMany({ accountId: record.accountId })
      return next({ statusCode: 404, message: 'Account no longer exists.' })
    }

    await PasswordResetToken.deleteMany({ accountId: record.accountId })

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' })
  } catch (error) {
    next(error)
  }
}

export default resetPassword
