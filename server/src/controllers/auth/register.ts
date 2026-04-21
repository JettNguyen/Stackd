import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import jwt from '../../utils/jwt'
import crypt from '../../utils/crypt'
import Account from '../../models/Account'

const register: RequestHandler = async (req, res, next) => {
  try {
    const validationError = await joi.validate(
      {
        username: joi.instance.string().required(),
        password: joi.instance.string().required(),
        email: joi.instance.string().email().required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const username = String(req.body.username || '').trim().toLowerCase()
    const password = String(req.body.password || '')
    const email = String(req.body.email || '').trim().toLowerCase()

    const foundUsername = await Account.findOne({ username })

    if (foundUsername) {
      return next({
        statusCode: 400,
        message: 'An account already exists with that username',
      })
    }

    const foundEmail = await Account.findOne({ email })

    if (foundEmail) {
      return next({
        statusCode: 400,
        message: 'An account already exists with that email',
      })
    }

    const hash = await crypt.hash(password)
    const account = new Account({ username, password: hash, email })
    await account.save()

    const token = jwt.signToken({ uid: account._id, username: account.username })
    const { password: _, ...data } = account.toObject()

    res.status(201).json({
      message: 'Successfully registered',
      data,
      token,
    })
  } catch (error) {
    next(error)
  }
}

export default register
