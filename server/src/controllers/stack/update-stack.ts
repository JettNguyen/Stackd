import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Stack from '../../models/Stack'
import Card from '../../models/Card'
import Class from '../../models/Class'

const update: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    const validationError = await joi.validate(
      {
        stackId: joi.instance.string().required(),
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

    const { stackId, name, classId, cards } = req.body

    const stack = await Stack.findOne({
      _id: stackId,
      'users.account': uid,
      'users.role': 'owner',
    })

    if (!stack) {
      return next({
        statusCode: 404,
        message: 'Stack not found',
      })
    }

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

    stack.name = name.trim()
    stack.class = classId || undefined
    await stack.save()

    await Card.deleteMany({ stack: stack._id })

    const cardDocs = (cards || [])
      .filter((card: any) => card.term?.trim() || card.definition?.trim())
      .map((card: any) => ({
        stack: stack._id,
        front: card.term?.trim() || '',
        back: card.definition?.trim() || '',
      }))

    if (cardDocs.length > 0) {
      await Card.insertMany(cardDocs)
    }

    res.status(200).json({
      message: 'Stack updated successfully',
      data: {
        _id: stack._id,
        name: stack.name,
      },
    })
  } catch (error) {
    next(error)
  }
}

export default update