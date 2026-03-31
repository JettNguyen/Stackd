import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'

const create: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        name: joi.instance.string().trim().min(1).max(100).required(),
      },
      req.body
    )

    if (validationError) return next(validationError)

    const { name } = req.body

    const newClass = await Class.create({
      name: name.trim(),
      visibility: 'private',
      users: [{ account: uid, role: 'owner' }],
    })

    res.status(201).json({
      message: 'Class created successfully',
      data: {
        _id: newClass._id,
        name: newClass.name,
      },
    })
  } catch (error) {
    next(error)
  }
}

export default create
