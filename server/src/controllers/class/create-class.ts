import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'
import Stack from '../../models/Stack'

const create: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        name: joi.instance.string().trim().min(1).max(100).required(),
        visibility: joi.instance.string().valid('public', 'private').optional().default('private'),
        stackIds: joi.instance.array().items(joi.instance.string()).optional().default([]),
      },
      req.body
    )

    if (validationError) {
      return next(validationError)
    }

    const name = String(req.body.name || '').trim()
    const visibility = (req.body.visibility || 'private') as 'public' | 'private'
    const stackIds = Array.isArray(req.body.stackIds) ? req.body.stackIds : []

    const createdClass = await Class.create({
      name,
      visibility,
      users: [{ account: uid, role: 'owner' }],
    })

    let linkedStacks = 0

    if (stackIds.length > 0) {
      const updateResult = await Stack.updateMany(
        {
          _id: { $in: stackIds },
          'users.account': uid,
        },
        {
          $set: { class: createdClass._id },
        }
      )

      linkedStacks = updateResult.modifiedCount || 0
    }

    return next({
      statusCode: 201,
      message: 'Class created successfully',
      data: {
        _id: createdClass._id,
        name: createdClass.name,
        visibility: createdClass.visibility,
        linkedStacks,
      },
    })
  } catch (error) {
    next(error)
  }
}

export default create
