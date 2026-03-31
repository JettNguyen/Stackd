import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Card from '../../models/Card'
import UserCardProgress from '../../models/UserCardProgress'
import mongoose from 'mongoose'

// update visibility of stack
const updateVisibility: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const { visibility } = req.body

    if (!visibility) {
      res.status(400).json({
        message: 'Visibility is required'
      })
      return
    }

    const selectedStack = await Stack.findById(stackId)

    if (!selectedStack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    // check if user is authorized to change visibility (must be owner)
    let role: string | null = null
    if (uid) {
      const userEntry = selectedStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === uid.toString();
      })
      if (userEntry) role = userEntry.role
    }

    if (role !== 'owner') {
      res.status(403).json({
        message: 'You do not have permission to change visibility of this stack'
      })
      return
    }

    if (selectedStack.visibility === visibility) {
      res.status(400).json({
        message: 'Stack visibility is already set to the requested value'
      })
      return
    }

    selectedStack.visibility = visibility
    await selectedStack.save()

    res.status(200).json({
      message: 'Stack visibility updated!',
      stack: selectedStack
    })

  } catch (error) {
    next(error)
  }
}

// update name of stack
const updateName: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const { name } = req.body

    if (!name) {
      res.status(400).json({
        message: 'Name is required'
      })
      return
    }

    const selectedStack = await Stack.findById(stackId)

    if (!selectedStack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    // check if user is authorized to change name (must be owner)
    let role: string | null = null
    if (uid) {
      const userEntry = selectedStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === uid.toString();
      })
      if (userEntry) role = userEntry.role
    }

    if (role !== 'owner') {
      res.status(403).json({
        message: 'You do not have permission to change name of this stack'
      })
      return
    }

    selectedStack.name = name
    await selectedStack.save()

    res.status(200).json({
      message: 'Stack name updated!',
      stack: selectedStack
    })

  } catch (error) {
    next(error)
  }
}

// update progress of a card in a stack
const updateCardProgress: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const cardId = req.params.cardId
    const { status } = req.body

    if (!status || !['learning', 'review', 'mastered'].includes(status)) {
      res.status(400).json({
        message: 'Valid status is required'
      })
      return
    }

    if (!uid) {
      res.status(401).json({
        message: 'You must be logged in to update progress'
      })
      return
    }

    const selectedStack = await Stack.findById(stackId)

    if (!selectedStack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    // check if user can view the stack
    let role: string | null = null
    const userEntry = selectedStack.users.find((u: any) => {
      const accountId = u.account._id || u.account;
      return accountId && accountId.toString() === uid.toString();
    })
    if (userEntry) role = userEntry.role

    if (selectedStack.visibility !== 'public' && !role) {
      res.status(403).json({
        message: 'You do not have permission to access this stack'
      })
      return
    }

    const card = await Card.findOne({ _id: cardId, stack: stackId })
    if (!card) {
      res.status(404).json({
        message: 'Card not found in this stack'
      })
      return
    }

    let progress = await UserCardProgress.findOne({
      account: uid,
      card: cardId,
      stack: stackId
    })

    if (progress) {
      progress.status = status
      await progress.save()
    } else {
      progress = await UserCardProgress.create({
        account: new mongoose.Types.ObjectId(uid.toString()),
        card: new mongoose.Types.ObjectId(cardId),
        stack: new mongoose.Types.ObjectId(stackId),
        status
      })
    }

    res.status(200).json({
      message: 'Card progress updated!',
      progress
    })

  } catch (error) {
    next(error)
  }
}

export { updateVisibility, updateName, updateCardProgress }
