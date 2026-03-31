import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'

const join: RequestHandler = async (req, res, next) => {
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

    if (existingMembership) {
      return next({
        statusCode: 200,
        message: 'You are already a member of this class',
        role: existingMembership.role,
      })
    }

    if (selectedClass.visibility !== 'public') {
      return next({
        statusCode: 403,
        message: 'This class is private',
      })
    }

    selectedClass.users.push({
      account: uid,
      role: 'viewer',
    })

    await selectedClass.save()

    return next({
      statusCode: 200,
      message: 'Joined class successfully',
      role: 'viewer',
    })
  } catch (error) {
    next(error)
  }
}

export default join
