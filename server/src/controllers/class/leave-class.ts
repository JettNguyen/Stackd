import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'

const leave: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        classId: joi.instance.string().required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const classId = String(req.body.classId || '')
    const selectedClass = await Class.findById(classId)

    if (!selectedClass) {
      return next({
        statusCode: 404,
        message: 'Could not find class',
      })
    }

    const existingMembership = selectedClass.users.find(
      (user) => user.account.toString() === uid?.toString()
    )

    if (!existingMembership) {
      return next({
        statusCode: 400,
        message: 'You are not a member of this class',
      })
    }

    if (existingMembership.role === 'owner') {
      return next({
        statusCode: 400,
        message: 'Owners cannot leave the class. Transfer ownership or delete the class.',
      })
    }

    selectedClass.users = selectedClass.users.filter(
      (user) => user.account.toString() !== uid?.toString()
    )

    await selectedClass.save()

    return next({
      statusCode: 200,
      message: 'Left class successfully',
    })
  } catch (error) {
    next(error)
  }
}

export default leave
