import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Account from '../../models/Account'
import Class from '../../models/Class'

const addClassMember: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        classId: joi.instance.string().required(),
        username: joi.instance.string().trim().min(1).required(),
        role: joi.instance.string().valid('viewer', 'editor').optional().default('viewer'),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const classId = String(req.body.classId || '')
    const username = String(req.body.username || '').trim().toLowerCase()
    const role = (req.body.role || 'viewer') as 'viewer' | 'editor'

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
        message: 'Only the class owner can add members',
      })
    }

    const account = await Account.findOne({ username })

    if (!account) {
      return next({
        statusCode: 404,
        message: 'Could not find user',
      })
    }

    const existingMember = selectedClass.users.find(
      (user) => user.account.toString() === account._id.toString()
    )

    if (existingMember) {
      existingMember.role = role
    } else {
      selectedClass.users.push({
        account: account._id,
        role,
      })
    }

    await selectedClass.save()

    return next({
      statusCode: 200,
      message: existingMember ? 'Member role updated' : 'Member added',
      member: {
        accountId: account._id,
        username: account.username,
        role,
      },
    })
  } catch (error) {
    next(error)
  }
}

export default addClassMember
