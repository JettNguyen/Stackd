import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import getClassById from '../controllers/class/get'
import { createClass, addUser, addStack } from '../controllers/class/post'
import { updateVisibility, updateName } from '../controllers/class/patch'
// import update from '../controllers/class/update'
// import deleteClass from '..controllers/class/delete'

// initialize router
const router = express.Router()

//http://localhost:8080/classes/
// GET /classes/:id
router.get('/:id', checkBearerToken, getClassById)

// POST /classes - create class
router.post('', checkBearerToken, createClass)

// POST /classes/:id/users - add user to class
router.post('/:id/users', checkBearerToken, addUser)

// POST /classes/:id/stacks - link existing stack to class
router.post('/:id/stacks', checkBearerToken, addStack)

// PATCH /classes/:id/visibility - update class visibility
router.patch('/:id/visibility', checkBearerToken, updateVisibility)

// PATCH /classes/:id/name - update class name
router.patch('/:id/name', checkBearerToken, updateName)

// DELETE /classes/:id/stacks/:stackId - remove stack from class
//router.delete('/:id/stacks/:stackId', checkBearerToken, removeStack)

// DELETE /classes/:id/users/:userId - remove user from class
//router.delete('/:id/users/:userId', checkBearerToken, removeUser)

// DELETE /classes/:id delete class
//router.delete('/:id', checkBearerToken, deleteClass)

export default router
