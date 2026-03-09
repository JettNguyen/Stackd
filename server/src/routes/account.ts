import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import user from '../controllers/accounts/user'

// initialize router
const router = express.Router()

// GET at path: http://localhost:8080/account/user
router.get('/user', [checkBearerToken], user, errorHandler)

export default router
