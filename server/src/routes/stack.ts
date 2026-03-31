import express from 'express'
import checkBearerToken from '../middlewares/check-bearer-token'
import errorHandler from '../middlewares/error-handler'
import getStackById from '../controllers/stack/get'
import { createStack, addUser, addCard } from '../controllers/stack/post'
import { updateVisibility, updateName, updateCardProgress } from '../controllers/stack/patch'
import { removeCard, removeUser, deleteStack } from '../controllers/stack/delete'

// initialize router
const router = express.Router()

// GET /stacks/:id
router.get('/:id', [checkBearerToken], getStackById, errorHandler)

// POST /stacks
router.post('/', [checkBearerToken], createStack, errorHandler)

// POST /stacks/:id/users
router.post('/:id/users', [checkBearerToken], addUser, errorHandler)

// POST /stacks/:id/cards
router.post('/:id/cards', [checkBearerToken], addCard, errorHandler)

// PATCH /stacks/:id/visibility
router.patch('/:id/visibility', [checkBearerToken], updateVisibility, errorHandler)

// PATCH /stacks/:id/name
router.patch('/:id/name', [checkBearerToken], updateName, errorHandler)

// PATCH /stacks/:id/cards/:cardId/progress
router.patch('/:id/cards/:cardId/progress', [checkBearerToken], updateCardProgress, errorHandler)

// DELETE /stacks/:id/cards/:cardId
router.delete('/:id/cards/:cardId', [checkBearerToken], removeCard, errorHandler)

// DELETE /stacks/:id/users
router.delete('/:id/users', [checkBearerToken], removeUser, errorHandler)

// DELETE /stacks/:id
router.delete('/:id', [checkBearerToken], deleteStack, errorHandler)

export default router
