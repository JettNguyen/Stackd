import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/stack/view-stack'
import create from '../controllers/stack/create-stack'

// initialize router
const router = express.Router()

// GET at path: http://localhost:8080/stack/view
// user can see a class if it is public or if user is authenticated
router.get('/view', [checkOptionalBearerToken], view, errorHandler)

// POST at path: http://localhost:8080/stack/create
router.post('/create', [checkBearerToken], create, errorHandler)

export default router
