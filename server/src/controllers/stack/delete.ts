import { type RequestHandler } from 'express'
import mongoose from 'mongoose'
import Stack from '../../models/Stack'
import Card from '../../models/Card'
import UserCardProgress from '../../models/UserCardProgress'

const validRoles = ['viewer', 'editor', 'owner'] as const
type StackRole = (typeof validRoles)[number]

// remove card from stack
const removeCard: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const cardId = req.params.cardId

    if (!cardId) {
      res.status(400).json({
        message: 'cardId is required'
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

    // check if user is authorized to remove cards (must be owner or editor)
    let role: StackRole | null = null
    if (uid) {
      const userEntry = selectedStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === uid.toString();
      })
      if (userEntry && validRoles.includes(userEntry.role as StackRole)) {
        role = userEntry.role as StackRole
      }
    }

    if (role !== 'owner' && role !== 'editor') {
      res.status(403).json({
        message: 'You do not have permission to remove cards from this stack'
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

    await Card.findByIdAndDelete(cardId)
    await UserCardProgress.deleteMany({ card: cardId })

    res.status(200).json({
      message: 'Card removed entirely from stack!'
    })

  } catch (error) {
    next(error)
  }
}

// delete stack
const deleteStack: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id

    const selectedStack = await Stack.findById(stackId)

    if (!selectedStack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    // check if user is authorized to delete stack (must be owner)
    let role: StackRole | null = null
    if (uid) {
      const userEntry = selectedStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === uid.toString();
      })
      if (userEntry && validRoles.includes(userEntry.role as StackRole)) {
        role = userEntry.role as StackRole
      }
    }

    if (role !== 'owner') {
      res.status(403).json({
        message: 'You do not have permission to delete this stack'
      })
      return
    }

    // Delete all cards and progress linked to the stack first
    await UserCardProgress.deleteMany({ stack: stackId })
    await Card.deleteMany({ stack: stackId })

    // Finally delete stack
    await Stack.findByIdAndDelete(stackId)

    res.status(200).json({
      message: 'Stack deleted successfully!'
    })

  } catch (error) {
    next(error)
  }
}

// remove users from stack
const removeUser: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const { users, userIds, transferOwnershipTo } = req.body

    const selectedStack = await Stack.findById(stackId)

    if (!selectedStack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    // check user role
    let role: StackRole | null = null
    if (uid) {
      const userEntry = selectedStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === uid.toString();
      })
      if (userEntry && validRoles.includes(userEntry.role as StackRole)) {
        role = userEntry.role as StackRole
      }
    }

    const isOwner = role === 'owner'
    const uidString = uid?.toString() || ''

    let usersToRemove: string[] = []
    let isRemovingOthers = false

    const userIdsToRemove = users || userIds
    if (userIdsToRemove && Array.isArray(userIdsToRemove) && userIdsToRemove.length > 0) {
      // Owner removing specific users
      if (!isOwner) {
        res.status(403).json({
          message: 'You do not have permission to remove users from this stack'
        })
        return
      }
      usersToRemove = userIdsToRemove.map(id => id.toString())
      isRemovingOthers = true
    } else {
      // User leaving themselves
      if (!uidString) {
        res.status(401).json({
          message: 'Authentication required'
        })
        return
      }

      usersToRemove = [uidString]
      isRemovingOthers = false
    }

    // If owner is being removed, require ownership transfer
    if (isOwner && usersToRemove.includes(uidString)) {
      if (!transferOwnershipTo) {
        res.status(400).json({
          message: 'As the owner, you must specify transferOwnershipTo when leaving the stack'
        })
        return
      }

      const newOwnerEntry = selectedStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === transferOwnershipTo.toString();
      })

      if (!newOwnerEntry) {
        res.status(400).json({
          message: 'Specified user to transfer ownership to is not in the stack'
        })
        return
      }

      // Update new owner's role directly using findOneAndUpdate to seamlessly handle nested arrays
      await Stack.findOneAndUpdate(
        { _id: stackId, 'users.account': transferOwnershipTo },
        {
          $set: {
            'users.$.role': 'owner'
          }
        }
      )
    }

    // Filter out users that exist in the stack
    const existingUsers = selectedStack.users.filter((u: any) => {
      const accountId = u.account._id || u.account;
      return accountId && usersToRemove.includes(accountId.toString());
    })

    if (existingUsers.length === 0) {
      res.status(400).json({
        message: 'No specified users found in the stack'
      })
      return
    }

    await Stack.findByIdAndUpdate(
      stackId,
      {
        $pull: {
          users: {
            account: {
              $in: usersToRemove.map(id => new mongoose.Types.ObjectId(id))
            }
          }
        }
      },
      { new: true }
    )

    // Also remove the user's progress since they left the stack
    await UserCardProgress.deleteMany({
      stack: stackId,
      account: { $in: usersToRemove.map(id => new mongoose.Types.ObjectId(id)) }
    })

    const updatedStack = await Stack.findById(stackId)

    res.status(200).json({
      message: `${existingUsers.length} user(s) removed from stack`,
      removedUsers: existingUsers.map(u => ({
        accountId: (u.account as any)._id || u.account,
        role: u.role
      })),
      stack: updatedStack
    })

  } catch (error) {
    next(error)
  }
}

export { removeCard, deleteStack, removeUser }
