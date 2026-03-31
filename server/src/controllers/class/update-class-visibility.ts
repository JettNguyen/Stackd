import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'

const updateClassVisibility: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        classId: joi.instance.string().required(),
        visibility: joi.instance.string().valid('public', 'private').required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const classId = String(req.body.classId || '')
    const visibility = req.body.visibility as 'public' | 'private'

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

    if (!membership || membership.role !== 'owner') {
      return next({
        statusCode: 403,
        message: 'Only the class owner can change class visibility',
      })
    }

    selectedClass.visibility = visibility
    await selectedClass.save()

    return next({
      statusCode: 200,
      message: 'Class visibility updated successfully',
      visibility: selectedClass.visibility,
    })
  } catch (error) {
    next(error)
  }
}

export default updateClassVisibility
