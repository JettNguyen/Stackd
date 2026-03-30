import { type RequestHandler } from 'express'
import jwt from '../utils/jwt'

const checkOptionalBearerToken: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return next()
    }

    const auth = jwt.verifyToken(token)

    if (!auth) {
      return next({
        statusCode: 401,
        message: 'Invalid token',
      })
    }

    req.auth = typeof auth === 'string' ? JSON.parse(auth) : auth

    next()
  } catch (error) {
    next({
      statusCode: 401,
      message: 'Invalid token',
    })
  }
}

export default checkOptionalBearerToken