import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'

const removeClassMember: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        classId: joi.instance.string().required(),
        accountId: joi.instance.string().required(),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const classId = String(req.body.classId || '')
    const accountId = String(req.body.accountId || '')

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
        message: 'Only the class owner can remove members',
      })
    }

    const targetMember = selectedClass.users.find(
      (user) => user.account.toString() === accountId
    )

    if (!targetMember) {
      return next({
        statusCode: 404,
        message: 'Could not find class member',
      })
    }

    if (targetMember.role === 'owner') {
      return next({
        statusCode: 400,
        message: 'Cannot remove class owner',
      })
    }

    selectedClass.users = selectedClass.users.filter(
      (user) => user.account.toString() !== accountId
    )

    await selectedClass.save()

    return next({
      statusCode: 200,
      message: 'Member removed',
    })
  } catch (error) {
    next(error)
  }
}

export default removeClassMember
