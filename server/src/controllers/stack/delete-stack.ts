import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Card from '../../models/Card'

const deleteStack: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const { stackId } = req.body

    if (!stackId) {
      return next({ statusCode: 400, message: 'Missing stackId' })
    }

    const stack = await Stack.findById(stackId)

    if (!stack) {
      return next({ statusCode: 404, message: 'Stack not found' })
    }

    const isOwner = stack.users.some(u => String(u.account) === uid && u.role === 'owner')

    if (!isOwner) {
      return next({ statusCode: 403, message: 'Only the owner can delete this stack' })
    }

    await Card.deleteMany({ stack: stackId })
    await stack.deleteOne()

    res.status(200).json({ message: 'Stack deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export default deleteStack
