import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Class from '../../models/Class'
import Card from '../../models/Card'
import UserCardProgress from '../../models/UserCardProgress'

const view: RequestHandler = async (req, res, next) => {
  try {
    const { stack: stackId } = req.query

    const selectedStack = await Stack.findById(stackId)
      .select('_id name class createdAt updatedAt')
      .lean()

    if (!selectedStack) {
      return next({
        statusCode: 404,
        message: 'Could not find stack'
      })
    }

    const selectedClass = await Class.findById(selectedStack.class).lean()
    const selectedCards = await Card.find({stack: selectedStack._id}).lean()

    if (!selectedClass) {
      return next({
        statusCode: 404,
        message: 'Could not find class'
      })
    }

    let role: string | null = null
    const { uid } = req.auth || {}

    let userProgressMap: Record<string, 'learning' | 'review' | 'mastered'> = {}

    const cardsWithStatus = selectedCards.map(card => ({
        ...card,
        status: userProgressMap[card._id.toString()] || "learning"  // learning is default if no progress
    }))

    if (uid) {
    const userProgress = await UserCardProgress.find({
        account: uid,
        stack: selectedStack._id,
        card: { $in: selectedCards.map(c => c._id) }
    }).lean()

    userProgressMap = userProgress.reduce((acc, progress) => {
        acc[progress.card.toString()] = progress.status
        return acc
    }, {} as Record<string, 'learning' | 'review' | 'mastered'>)
    }

    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account.toString() === uid.toString()
      )

      if (userEntry) {
        role = userEntry.role
      }
    }

    // Authorization check
    if (selectedClass.visibility !== 'public' && !role) {
      return next({
        statusCode: 403,
        message: 'You do not have permission to view this stack'
      })
    }

    return next({
      message: '',
      statusCode: 200,
      stack: selectedStack,
      className: selectedClass.name,
      cards: cardsWithStatus,
      role: role
    })

  } catch (error) {
    next(error)
  }
}

export default view