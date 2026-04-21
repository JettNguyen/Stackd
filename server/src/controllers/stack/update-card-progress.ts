import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Card from '../../models/Card'
import UserCardProgress from '../../models/UserCardProgress'

const updateCardProgress: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    if (!uid) {
      return next({ statusCode: 401, message: 'Authentication required' })
    }

    const { cardId, stackId, status } = req.body

    if (!cardId || !stackId) {
      return next({ statusCode: 400, message: 'cardId and stackId are required' })
    }

    const validStatuses = ['learning', 'review', 'mastered']
    if (!validStatuses.includes(status)) {
      return next({ statusCode: 400, message: 'Invalid status value' })
    }

    // Verify the card belongs to the stack and the user has access
    const card = await Card.findOne({ _id: cardId, stack: stackId }).lean()
    if (!card) {
      return next({ statusCode: 404, message: 'Card not found in stack' })
    }

    const stack = await Stack.findById(stackId).lean()
    if (!stack) {
      return next({ statusCode: 404, message: 'Stack not found' })
    }

    const userEntry = stack.users?.find((u: any) => u.account.toString() === uid.toString())
    if (!userEntry && stack.visibility !== 'public') {
      return next({ statusCode: 403, message: 'You do not have permission to update this stack' })
    }

    await UserCardProgress.findOneAndUpdate(
      { account: uid, card: cardId, stack: stackId },
      { status },
      { upsert: true, new: true }
    )

    return next({ statusCode: 200, message: 'Progress updated' })
  } catch (error) {
    next(error)
  }
}

export default updateCardProgress
