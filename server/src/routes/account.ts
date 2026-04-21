import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import errorHandler from '../middlewares/error-handler'
import user from '../controllers/account/user'
import updateSettings from '../controllers/account/update-settings'
import viewProfile from '../controllers/account/view-profile'

// initialize router
const router = express.Router()

// GET at path: http://localhost:8080/account/user
router.get('/user', [checkBearerToken], user, errorHandler)

// GET at path: http://localhost:8080/account/profile/:username
router.get('/profile/:username', [checkOptionalBearerToken], viewProfile, errorHandler)

// PATCH at path: http://localhost:8080/account/settings
router.patch('/settings', [checkBearerToken], updateSettings, errorHandler)

export default router
