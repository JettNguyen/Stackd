import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import jwt from '../../utils/jwt'
import crypt from '../../utils/crypt'
import Account from '../../models/Account'

const register: RequestHandler = async (req, res, next) => {
  try {
    const validationError = await joi.validate(
      {
        email: joi.instance.string().trim().email().required(),
        username: joi.instance.string().required(),
        password: joi.instance.string().min(8).required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const email = String(req.body.email || '').trim().toLowerCase()
    const username = String(req.body.username || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email.endsWith('@ufl.edu')) {
      return next({
        statusCode: 400,
        message: 'Email must end with @ufl.edu',
      })
    }

    // Verify account username as unique
    const foundUsername = await Account.findOne({ username })

    if (foundUsername) {
      return next({
        statusCode: 400,
        message: 'An account already exists with that "username"',
      })
    }

    const foundEmail = await Account.findOne({ email })

    if (foundEmail) {
      return next({
        statusCode: 400,
        message: 'An account already exists with that "email"',
      })
    }

    // Encrypt password
    const hash = await crypt.hash(password)

    // Create account
    const account = new Account({ email, username, password: hash })
    await account.save()

    // Generate access token
    const token = jwt.signToken({ uid: account._id })

    // Exclude password from response
    const { password: _, ...data } = account.toObject()

    res.status(201).json({
      message: 'Succesfully registered',
      data,
      token,
    })
  } catch (error) {
    next(error)
  }
}

export default register
