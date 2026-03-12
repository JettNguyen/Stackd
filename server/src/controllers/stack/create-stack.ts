import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Stack from '../../models/Stack'
import Card from '../../models/Card'
import Class from '../../models/Class'

const create: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        name: joi.instance.string().trim().min(1).max(100).required(),
        classId: joi.instance.string().optional().allow('', null),
        cards: joi.instance
          .array()
          .items(
            joi.instance.object({
              term: joi.instance.string().allow('').default(''),
              definition: joi.instance.string().allow('').default(''),
            })
          )
          .optional()
          .default([]),
      },
      req.body
    )

    if (validationError) return next(validationError)

    const { name, classId, cards } = req.body

    if (classId) {
      const cls = await Class.findOne({
        _id: classId,
        'users.account': uid,
      })

      if (!cls) {
        return next({
          statusCode: 403,
          message: 'You are not a member of that class',
        })
      }
    }

    const stack = await Stack.create({
      name: name.trim(),
      ...(classId ? { class: classId } : {}),
      visibility: 'private',
      users: [{ account: uid, role: 'owner' }],
    })

    const cardDocs = (cards || [])
      .filter((c: any) => c.term?.trim() || c.definition?.trim())
      .map((c: any) => ({
        stack: stack._id,
        front: c.term?.trim() || '',
        back: c.definition?.trim() || '',
      }))

    if (cardDocs.length > 0) {
      await Card.insertMany(cardDocs)
    }

    res.status(201).json({
      message: 'Stack created successfully',
      data: {
        _id: stack._id,
        name: stack.name,
      },
    })
  } catch (error) {
    next(error)
  }
}

export default create
