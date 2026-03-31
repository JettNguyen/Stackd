import express from 'express'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/class/view-class'
import create from '../controllers/class/create-class'
import deleteClass from '../controllers/class/delete-class'
import addStack from '../controllers/class/add-stack'

const router = express.Router()

router.get('/view', [checkOptionalBearerToken], view, errorHandler)
router.post('/create', [checkBearerToken], create, errorHandler)
router.post('/delete', [checkBearerToken], deleteClass, errorHandler)
router.post('/add-stack', [checkBearerToken], addStack, errorHandler)

export default router
