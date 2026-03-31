import { type RequestHandler } from 'express'
import Class from '../../models/Class'

const deleteClass: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const { classId } = req.body

    if (!classId) {
      return next({ statusCode: 400, message: 'Missing classId' })
    }

    const classDoc = await Class.findById(classId)

    if (!classDoc) {
      return next({ statusCode: 404, message: 'Class not found' })
    }

    const isOwner = classDoc.users.some(u => String(u.account) === uid && u.role === 'owner')

    if (!isOwner) {
      return next({ statusCode: 403, message: 'Only the owner can delete this class' })
    }

    await classDoc.deleteOne()

    res.status(200).json({ message: 'Class deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export default deleteClass
