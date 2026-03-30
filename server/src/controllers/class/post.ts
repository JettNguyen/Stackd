import { type RequestHandler } from 'express'
import mongoose from 'mongoose'
import Stack from '../../models/Stack'
import Class from '../../models/Class'


// create a new class
const createClass: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const { name, stackIds } = req.body

    if (!name) {
      res.status(400).json({
        message: 'Class name is required'
      })
      return
    }

    const newClass = await Class.create({
      name,
      users: [
        {
          account: uid,
          role: "owner"
        }
      ],
      visibility: "public",
    })

    if (stackIds && Array.isArray(stackIds)) {
      const stacks = await Stack.find({ _id: { $in: stackIds } })

      for (const stack of stacks) {
        if (!stack.class) {
          stack.class = newClass._id
          await stack.save()
        }
      }
    }

    res.status(201).json({
      message: 'Class Created!',
      class: newClass
    })

  } catch (error) {
    next(error)
  }
}

// add users to class
const validRoles = ['viewer', 'editor', 'owner'] as const
type ClassRole = (typeof validRoles)[number]

const addUser: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const cid = req.params.id
    const { users } = req.body

    if (!users || !Array.isArray(users) || users.length === 0) {
      res.status(400).json({
        message: 'users array is required and must not be empty'
      })
      return
    }

    const selectedClass = await Class.findById(cid)

    if (!selectedClass) {
      res.status(404).json({
        message: 'Class not found'
      })
      return
    }

    // check if user is owner vs public joiner
    let role: ClassRole | null = null
    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account._id.toString() === uid.toString()
      )
      if (userEntry && validRoles.includes(userEntry.role)) {
        role = userEntry.role
      }
    }

    const isOwner = role === 'owner'

    if (!isOwner && selectedClass.visibility !== 'public') {
      res.status(403).json({
        message: 'You do not have permission to add users to this class'
      })
      return
    }

    // non-owner in public class can only join self as viewer
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

    for (const entry of callerOnlyUsers) {
      if (!entry || typeof entry !== 'object') continue

      let accountId = ''
      let requestedRole: ClassRole = 'viewer'

      // Accept payload entries like { accountId: 'id', role: 'viewer' }
      if ('accountId' in entry || 'userId' in entry || 'id' in entry || 'account' in entry) {
        accountId = (entry.accountId || entry.userId || entry.id || entry.account || '').toString()
        if ('role' in entry && typeof entry.role === 'string' && validRoles.includes(entry.role as ClassRole)) {
          requestedRole = entry.role as ClassRole
        }
      } else {
        // Accept payload entries like { 'USER_ID': 'viewer' }
        const keys = Object.keys(entry)
        if (keys.length === 1 && typeof (entry as any)[keys[0]] === 'string') {
          accountId = keys[0]
          const candidateRole = (entry as any)[keys[0]] as string
          if (validRoles.includes(candidateRole as ClassRole)) {
            requestedRole = candidateRole as ClassRole
          }
        }
      }

      if (!accountId) continue

      const accountObjectId = new mongoose.Types.ObjectId(accountId)
      const existing = selectedClass.users.find((u: any) => u.account.toString() === accountId)

      if (existing) {
        if (existing.role !== requestedRole) {
          existing.role = requestedRole
          updatedUsers.push(accountId)
        } else {
          unchangedUsers.push(accountId)
        }
      } else {
        selectedClass.users.push({
          account: accountObjectId,
          role: requestedRole
        })
        addedUsers.push(accountId)
      }
    }

    if (addedUsers.length === 0 && updatedUsers.length === 0) {
      res.status(200).json({
        message: 'No users added or updated; all users already have requested roles',
        unchangedUsers
      })
      return
    }

    await selectedClass.save()

    res.status(200).json({
      message: `${addedUsers.length} user(s) added, ${updatedUsers.length} user(s) role(s) updated`,
      addedUsers,
      updatedUsers,
      unchangedUsers,
      class: selectedClass
    })

  } catch (error) {
    next(error)
  }
}

export { createClass, addUser }
