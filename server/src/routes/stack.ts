import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/stacks/view'

// initialize router
const router = express.Router()

// GET at path: http://localhost:8080/stack/view
// user can see a class if it is public or if user is authenticated
router.get('/view', [checkBearerToken], view, errorHandler)

export default router
