import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import getClassById from '../controllers/class/get'
import { createClass, addUser, updateVisibility } from '../controllers/class/post'
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

// POST /classes/:id/visibility - update class visibility
router.post('/:id/visibility', checkBearerToken, updateVisibility)

// POST /classes/:id/name - update class name
//router.post('/:id/name', checkBearerToken, updateName)

// POST /classes/:id/stacks - create new stack in class
//router.post('/:id/stacks', checkBearerToken, createStack)

// POST /classes/:id/stack-links - link existing stack
//router.post('/:id/stack-links', checkBearerToken, addStack)



// DELETE /classes/:id/stacks/:stackId - remove stack from class
//router.delete('/:id/stacks/:stackId', checkBearerToken, removeStack)

// DELETE /classes/:id/users/:userId - remove user from class
//router.delete('/:id/users/:userId', checkBearerToken, removeUser)

// DELETE /classes/:id delete class
//router.delete('/:id', checkBearerToken, deleteClass)

export default router
