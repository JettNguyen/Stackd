import { type RequestHandler } from 'express'
import jwt from '../../utils/jwt'
import Account from '../../models/Account'

const loginWithToken: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    // Get account from DB, password is not verified because we're already token-authorized at this point
    const account = await Account.findOne({ _id: uid }).select('-password')

    if (!account) {
      return next({
        statusCode: 400,
        message: 'Session expired. Please sign in again.',
      })
    }

    // Generate access token
    const token = jwt.signToken({ uid: account._id, username: account.username })

    res.status(200).json({
      message: 'Successfully got account',
      data: account,
      token,
    })
  } catch (error) {
    next(error)
  }
}

export default loginWithToken
