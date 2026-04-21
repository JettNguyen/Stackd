import express from 'express'
import multer from 'multer'
import checkBearerToken from '../middlewares/check-bearer-token'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/stack/view-stack'
import create from '../controllers/stack/create-stack'
import update from '../controllers/stack/update-stack'
import deleteStack from '../controllers/stack/delete-stack'
import generateStack from '../controllers/stack/generate-stack'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

router.get('/view', [checkOptionalBearerToken], view, errorHandler)
router.post('/create', [checkBearerToken], create, errorHandler)
router.post('/update', [checkBearerToken], update, errorHandler)
router.post('/delete', [checkBearerToken], deleteStack, errorHandler)
router.post('/generate', [checkBearerToken, upload.array('files', 10)], generateStack, errorHandler)

export default router
