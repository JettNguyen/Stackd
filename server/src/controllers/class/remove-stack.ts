import { type RequestHandler } from 'express'
import Class from '../../models/Class'
import Stack from '../../models/Stack'

const removeStack: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const { classId, stackId } = req.body

    if (!classId || !stackId) {
      return next({ statusCode: 400, message: 'Missing classId or stackId' })
    }

    const classDoc = await Class.findById(classId)

    if (!classDoc) {
      return next({ statusCode: 404, message: 'Class not found' })
    }

    const userEntry = classDoc.users.find(u => String(u.account) === uid)

    if (!userEntry || (userEntry.role !== 'owner' && userEntry.role !== 'editor')) {
      return next({ statusCode: 403, message: 'You do not have permission to remove stacks from this class' })
    }

    const stack = await Stack.findById(stackId)

    if (!stack) {
      return next({ statusCode: 404, message: 'Stack not found' })
    }

    // Only allow removal if the stack is currently attached to this class
    if (!stack.class || String(stack.class) !== String(classId)) {
      return next({ statusCode: 400, message: 'Stack is not part of this class' })
    }

    // Allow class owners/editors to remove a stack from the class
    // We don't delete the stack here; we simply disassociate it from the class
    stack.class = undefined
    await stack.save()

    res.status(200).json({ message: 'Stack removed from class' })
  } catch (error) {
    next(error)
  }
}

export default removeStack
