import { type RequestHandler } from 'express'
import mongoose from 'mongoose'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

const validRoles = ['viewer', 'editor', 'owner'] as const
type ClassRole = (typeof validRoles)[number]

// remove stack from class
const removeStack: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const cid = req.params.id
    const { stackId } = req.body

    if (!stackId) {
      res.status(400).json({
        message: 'stackId is required'
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

    // check if user is authorized to remove stacks (must be owner or editor)
    let role: ClassRole | null = null
    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account._id.toString() === uid.toString()
      )
      if (userEntry && validRoles.includes(userEntry.role)) {
        role = userEntry.role
      }
    }

    if (role !== 'owner' && role !== 'editor') {
      res.status(403).json({
        message: 'You do not have permission to remove stacks from this class'
      })
      return
    }

    const stack = await Stack.findById(stackId)

    if (!stack) {
      res.status(404).json({
        message: 'Stack not found'
      })
      return
    }

    if (!stack.class || stack.class.toString() !== cid) {
      res.status(400).json({
        message: 'Stack is not in this class'
      })
      return
    }

    stack.class = null
    await stack.save()

    res.status(200).json({
      message: 'Stack removed from class!',
      stack
    })

  } catch (error) {
    next(error)
  }
}

// delete class
const deleteClass: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const cid = req.params.id

    const selectedClass = await Class.findById(cid)

    if (!selectedClass) {
      res.status(404).json({
        message: 'Class not found'
      })
      return
    }

    // check if user is authorized to delete class (must be owner)
    let role: ClassRole | null = null
    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account._id.toString() === uid.toString()
      )
      if (userEntry && validRoles.includes(userEntry.role)) {
        role = userEntry.role
      }
    }

    if (role !== 'owner') {
      res.status(403).json({
        message: 'You do not have permission to delete this class'
      })
      return
    }

    // Remove class reference from all stacks
    await Stack.updateMany(
      { class: new mongoose.Types.ObjectId(cid) },
      { $unset: { class: 1 } }
    )

    await Class.findByIdAndDelete(cid)

    res.status(200).json({
      message: 'Class deleted successfully!'
    })

  } catch (error) {
    next(error)
  }
}

// remove users from class
const removeUser: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const cid = req.params.id
    const { users, userIds, transferOwnershipTo } = req.body

    const selectedClass = await Class.findById(cid)

    if (!selectedClass) {
      res.status(404).json({
        message: 'Class not found'
      })
      return
    }

    // check user role
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
    const uidString = uid?.toString() || ''

    // Determine which users to remove - accept both 'users' and 'userIds' format
    let usersToRemove: string[] = []
    let isRemovingOthers = false

    const userIdsToRemove = users || userIds
    if (userIdsToRemove && Array.isArray(userIdsToRemove) && userIdsToRemove.length > 0) {
      // Owner removing specific users
      if (!isOwner) {
        res.status(403).json({
          message: 'You do not have permission to remove users from this class'
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

    // If owner is being removed (either naturally or in the removal list), require ownership transfer
    if (isOwner && usersToRemove.includes(uidString)) {
      if (!transferOwnershipTo) {
        res.status(400).json({
          message: 'As the owner, you must specify transferOwnershipTo when leaving the class'
        })
        return
      }

      const newOwnerEntry = selectedClass.users.find(
        (u: any) => u.account.toString() === transferOwnershipTo.toString()
      )

      if (!newOwnerEntry) {
        res.status(400).json({
          message: 'Specified user to transfer ownership to is not in the class'
        })
        return
      }

      // Update new owner's role in database first
      await Class.findOneAndUpdate(
        { _id: cid, 'users.account': transferOwnershipTo },
        {
          $set: {
            'users.$.role': 'owner'
          }
        }
      )
    }

    // Filter out users that exist in the class
    const existingUsers = selectedClass.users.filter(u =>
      usersToRemove.includes(u.account.toString())
    )

    if (existingUsers.length === 0) {
      res.status(400).json({
        message: 'No specified users found in the class'
      })
      return
    }

    // Remove users from class using MongoDB $pull for data integrity
    await Class.findByIdAndUpdate(
      cid,
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

    const updatedClass = await Class.findById(cid)

    res.status(200).json({
      message: `${existingUsers.length} user(s) removed from class`,
      removedUsers: existingUsers.map(u => ({
        accountId: u.account._id,
        role: u.role
      })),
      class: updatedClass
    })

  } catch (error) {
    next(error)
  }
}

export { removeStack, deleteClass, removeUser }