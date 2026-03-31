import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/stack/view-stack'
import create from '../controllers/stack/create-stack'
import deleteStack from '../controllers/stack/delete-stack'

const router = express.Router()

router.get('/view', [checkOptionalBearerToken], view, errorHandler)
router.post('/create', [checkBearerToken], create, errorHandler)
router.post('/delete', [checkBearerToken], deleteStack, errorHandler)

export default router
