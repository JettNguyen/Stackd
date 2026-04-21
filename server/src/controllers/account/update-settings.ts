import { type RequestHandler } from 'express'
import Account from '../../models/Account'

const updateSettings: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const { publicProfile } = req.body

    if (typeof publicProfile !== 'boolean') {
      return next({ statusCode: 400, message: 'publicProfile must be a boolean.' })
    }

    await Account.updateOne({ _id: uid }, { publicProfile })

    res.status(200).json({ message: 'Settings updated.' })
  } catch (error) {
    next(error)
  }
}

export default updateSettings
