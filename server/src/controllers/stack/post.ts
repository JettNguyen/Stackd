import { type RequestHandler } from 'express'
import mongoose from 'mongoose'
import Stack from '../../models/Stack'
import Account from '../../models/Account'
import Card from '../../models/Card'

// create a new stack
const createStack: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const { name } = req.body

    if (!name) {
      res.status(400).json({
        message: 'Stack name is required'
      })
      return
    }

    const newStack = await Stack.create({
      name,
      users: [
        {
          account: uid,
          role: 'owner'
        }
      ],
      visibility: 'public',
    })

    res.status(201).json({
      message: 'Stack Created!',
      stack: newStack
    })

  } catch (error) {
    next(error)
  }
}

const validRoles = ['viewer', 'editor', 'owner'] as const
type StackRole = (typeof validRoles)[number]

// add users to stack
const addUser: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const { users } = req.body

    if (!users || !Array.isArray(users) || users.length === 0) {
      res.status(400).json({
        message: 'users array is required and must not be empty'
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

    const freshStack = await Stack.findById(stackId)
    if (!freshStack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    freshStack.users = freshStack.users.filter((u: any) => u.account !== null)

    let role: StackRole | null = null
    if (uid) {
      const userEntry = freshStack.users.find((u: any) => {
        const accountId = u.account._id || u.account;
        return accountId && accountId.toString() === uid.toString();
      })
      if (userEntry && validRoles.includes(userEntry.role as StackRole)) {
        role = userEntry.role as StackRole
      }
    }

    const isOwner = role === 'owner'

    if (!isOwner && freshStack.visibility !== 'public') {
      res.status(403).json({
        message: 'You do not have permission to add users to this stack'
      })
      return
    }

    let callerOnlyUsers = users
    if (!isOwner) {
      const uidString = uid?.toString() || ''
      callerOnlyUsers = users
        .map((entry: any) => {
          if (!entry || typeof entry !== 'object') return null
          const accountCandidate = (entry.accountId || entry.userId || entry.id || entry.account || '').toString()
          if (accountCandidate !== uidString) return null
          return { accountId: uidString, role: 'viewer' }
        })
        .filter((entry: any) => entry !== null)

      if (callerOnlyUsers.length === 0 && uidString) {
        callerOnlyUsers = [{ accountId: uidString, role: 'viewer' }]
      }
    }

    const addedUsers: string[] = []
    const updatedUsers: string[] = []
    const unchangedUsers: string[] = []
    const invalidUsers: string[] = []

    for (const entry of callerOnlyUsers) {
      if (!entry || typeof entry !== 'object') continue

      let accountId = ''
      let requestedRole: StackRole = 'viewer'

      if ('accountId' in entry || 'userId' in entry || 'id' in entry || 'account' in entry) {
        accountId = (entry.accountId || entry.userId || entry.id || entry.account || '').toString()
        if ('role' in entry && typeof entry.role === 'string' && validRoles.includes(entry.role as StackRole)) {
          requestedRole = entry.role as StackRole
        }
      } else {
        const keys = Object.keys(entry)
        if (keys.length === 1 && typeof (entry as any)[keys[0]] === 'string') {
          accountId = keys[0]
          const candidateRole = (entry as any)[keys[0]] as string
          if (validRoles.includes(candidateRole as StackRole)) {
            requestedRole = candidateRole as StackRole
          }
        }
      }

      if (!accountId) continue

      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        invalidUsers.push(accountId)
        continue
      }

      const accountExists = await Account.findById(accountId)
      if (!accountExists) {
        invalidUsers.push(accountId)
        continue
      }

      const accountObjectId = new mongoose.Types.ObjectId(accountId)
      const existing = freshStack.users.find((u: any) => u.account.toString() === accountId)

      if (existing) {
        if (existing.role !== requestedRole) {
          existing.role = requestedRole
          updatedUsers.push(accountId)
        } else {
          unchangedUsers.push(accountId)
        }
      } else {
        freshStack.users.push({
          account: accountObjectId,
          role: requestedRole
        })
        addedUsers.push(accountId)
      }
    }

    if (addedUsers.length === 0 && updatedUsers.length === 0) {
      res.status(200).json({
        message: 'No users added or updated; all users already have requested roles',
        unchangedUsers,
        invalidUsers
      })
      return
    }

    await freshStack.save()

    const refreshedStack = await Stack.findById(stackId).populate('users.account', 'username')

    res.status(200).json({
      message: `${addedUsers.length} user(s) added, ${updatedUsers.length} user(s) role(s) updated`,
      addedUsers,
      updatedUsers,
      unchangedUsers,
      ...(invalidUsers.length > 0 && { invalidUsers }),
      stack: refreshedStack
    })

  } catch (error) {
    next(error)
  }
}

// add card to stack
const addCard: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const stackId = req.params.id
    const { front, back } = req.body

    if (!front || !back) {
      res.status(400).json({
        message: 'front and back are required for the card'
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
        message: 'You do not have permission to add cards to this stack'
      })
      return
    }

    const newCard = await Card.create({
      stack: new mongoose.Types.ObjectId(stackId),
      front,
      back
    })

    res.status(201).json({
      message: 'Card added to stack!',
      card: newCard
    })

  } catch (error) {
    next(error)
  }
}

export { createStack, addUser, addCard }
