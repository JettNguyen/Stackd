import express from 'express'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/class/view-class'

// initialize router
const router = express.Router()

// GET at path: http://localhost:8080/class/view
// user can see a class if it is public or if user is authenticated
router.get('/view', [checkOptionalBearerToken], view, errorHandler)

export default router
