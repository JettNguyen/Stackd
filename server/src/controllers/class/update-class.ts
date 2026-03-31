import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'

const update: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        classId: joi.instance.string().required(),
        name: joi.instance.string().trim().min(1).max(100).required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const classId = String(req.body.classId || '')
    const name = String(req.body.name || '').trim()

    const selectedClass = await Class.findById(classId)

    if (!selectedClass) {
      return next({
        statusCode: 404,
        message: 'Could not find class',
      })
    }

    const membership = selectedClass.users.find(
      (user) => user.account.toString() === uid?.toString()
    )

    if (!membership || (membership.role !== 'owner' && membership.role !== 'editor')) {
      return next({
        statusCode: 403,
        message: 'You do not have permission to edit this class',
      })
    }

    selectedClass.name = name
    await selectedClass.save()

    return next({
      statusCode: 200,
      message: 'Class updated successfully',
      data: {
        _id: selectedClass._id,
        name: selectedClass.name,
      },
    })
  } catch (error) {
    next(error)
  }
}

export default update
