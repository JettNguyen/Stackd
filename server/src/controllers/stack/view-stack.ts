import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Class from '../../models/Class'
import Card from '../../models/Card'
import UserCardProgress from '../../models/UserCardProgress'

const view: RequestHandler = async (req, res, next) => {
  try {
    const { stack: stackId } = req.query

    if (!stackId) {
      return next({
        statusCode: 400,
        message: 'Stack id required'
      })
    }

    // Get stack
    const selectedStack = await Stack.findById(stackId)
      .select('_id name class users visibility createdAt updatedAt')
      .lean()

    if (!selectedStack) {
      return next({
        statusCode: 404,
        message: 'Could not find stack'
      })
    }

    // Get class (optional)
    let selectedClass: any = null

    if (selectedStack.class) {
      selectedClass = await Class.findById(selectedStack.class)
        .select('_id name visibility')
        .lean()
    }

    // Get cards
    const selectedCards = await Card.find({
      stack: selectedStack._id
    }).lean()

    const { uid } = req.auth || {}

    let role: string | null = null

    // Determine role from stack users
    if (uid && selectedStack.users) {
      const userEntry = selectedStack.users.find(
        (u: any) => u.account.toString() === uid.toString()
      )

      if (userEntry) {
        role = userEntry.role
      }
    }

    // Stack-level authorization
    if (selectedStack.visibility !== 'public' && !role) {
      return next({
        statusCode: 403,
        message: 'You do not have permission to view this stack'
      })
    }

    // Class-level authorization (only if class exists)
    if (selectedClass && selectedClass.visibility !== 'public' && !role) {
      return next({
        statusCode: 403,
        message: 'You do not have permission to view this stack'
      })
    }

    // Build progress map
    let userProgressMap: Record<string, 'learning' | 'review' | 'mastered'> = {}

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

    // Attach progress to cards
    const cardsWithStatus = selectedCards.map(card => ({
      ...card,
      status: userProgressMap[card._id.toString()] || 'learning'
    }))

    // Owner gets user list
    if (role === 'owner') {
      const stackWithUsers = await Stack.findById(stackId)
        .populate('users.account', 'username')

      if (stackWithUsers) {
        const users = stackWithUsers.users.map(u => ({
          accountId: (u.account as any)._id,
          username: (u.account as any).username,
          role: u.role
        }))

        return next({
          message: 'Stack found',
          statusCode: 200,
          stack: selectedStack,
          className: selectedClass?.name ?? null,
          cards: cardsWithStatus,
          role: role,
          users: users
        })
      }
    }

    // Normal response
    return next({
      message: 'Stack found',
      statusCode: 200,
      stack: selectedStack,
      className: selectedClass?.name ?? null,
      cards: cardsWithStatus,
      role: role
    })

  } catch (error) {
    next(error)
  }
}

export default view