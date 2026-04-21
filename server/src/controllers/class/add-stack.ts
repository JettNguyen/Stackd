import { type RequestHandler } from 'express'
import Class from '../../models/Class'
import Stack from '../../models/Stack'

const addStack: RequestHandler = async (req, res, next) => {
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
      return next({ statusCode: 403, message: 'You do not have permission to add stacks to this class' })
    }

    const stack = await Stack.findById(stackId)

    if (!stack) {
      return next({ statusCode: 404, message: 'Stack not found' })
    }

    const isStackOwner = stack.users.some(u => String(u.account) === uid && u.role === 'owner')

    if (!isStackOwner) {
      return next({ statusCode: 403, message: 'You do not own that stack' })
    }

    stack.class = classId
    await stack.save()

    res.status(200).json({ message: 'Stack added to class' })
  } catch (error) {
    next(error)
  }
}

export default addStack
