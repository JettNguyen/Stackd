import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import checkOptionalBearerToken from '../middlewares/check-optional-bearer-token'
import errorHandler from '../middlewares/error-handler'
import view from '../controllers/class/view-class'
import create from '../controllers/class/create-class'
import update from '../controllers/class/update-class'
import join from '../controllers/class/join-class'
import leave from '../controllers/class/leave-class'
import addClassMember from '../controllers/class/add-class-member'
import removeClassMember from '../controllers/class/remove-class-member'
import updateClassVisibility from '../controllers/class/update-class-visibility'
import deleteClass from '../controllers/class/delete-class'

// initialize router
const router = express.Router()

// GET at path: http://localhost:8080/class/view
// user can see a class if it is public or if user is authenticated
router.get('/view', [checkOptionalBearerToken], view, errorHandler)

// POST at path: http://localhost:8080/class/create
router.post('/create', [checkBearerToken], create, errorHandler)

// PATCH at path: http://localhost:8080/class/update
router.patch('/update', [checkBearerToken], update, errorHandler)

// POST at path: http://localhost:8080/class/join
router.post('/join', [checkBearerToken], join, errorHandler)

// POST at path: http://localhost:8080/class/leave
router.post('/leave', [checkBearerToken], leave, errorHandler)

// POST at path: http://localhost:8080/class/member/add
router.post('/member/add', [checkBearerToken], addClassMember, errorHandler)

// POST at path: http://localhost:8080/class/member/remove
router.post('/member/remove', [checkBearerToken], removeClassMember, errorHandler)

// PATCH at path: http://localhost:8080/class/visibility
router.patch('/visibility', [checkBearerToken], updateClassVisibility, errorHandler)

// DELETE at path: http://localhost:8080/class/delete
router.delete('/delete', [checkBearerToken], deleteClass, errorHandler)

export default router
