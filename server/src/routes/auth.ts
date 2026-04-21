import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import register from '../controllers/auth/register'
import login from '../controllers/auth/login'
import loginWithToken from '../controllers/auth/login-with-token'
import requestPasswordReset from '../controllers/auth/request-password-reset'
import resetPassword from '../controllers/auth/reset-password'

// initialize router
const router = express.Router()

// POST at route: http://localhost:8080/auth/register
router.post('/register', register, errorHandler)

// POST at path: http://localhost:8080/auth/login
router.post('/login', login, errorHandler)

// GET at path: http://localhost:8080/auth/login
router.get('/login', [checkBearerToken], loginWithToken, errorHandler)

// POST at path: http://localhost:8080/auth/request-password-reset
router.post('/request-password-reset', requestPasswordReset, errorHandler)

// POST at path: http://localhost:8080/auth/reset-password
router.post('/reset-password', resetPassword, errorHandler)

export default router
