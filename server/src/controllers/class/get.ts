import { RequestHandler } from 'express'
import mongoose from 'mongoose'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

const getClassById: RequestHandler = async (req, res, next) => {
  try {
    const classId = req.params.id
    const { uid } = req.auth || {}

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      res.status(400).json({ message: 'Invalid class ID' })
      return
    }

    const selectedClass = await Class.findById(classId)
      .populate('users.account', 'username')

    if (!selectedClass) {
      res.status(404).json({ message: 'Could not find class' })
      return
    }

    // find user role if authenticated
    let role: string | null = null
    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account._id.toString() === uid.toString()
      )
      if (userEntry) role = userEntry.role
    }

    // Authorization check
    if (selectedClass.visibility !== 'public' && !role) {
      res.status(403).json({ message: 'You do not have permission to view this class' })
      return
    }

    // fetch stacks
    let stackQuery: any = { class: classId }
    if (uid) {
      stackQuery['$or'] = [
        { 'users.account': uid },
        { visibility: 'public' }
      ]
    } else {
      stackQuery['visibility'] = 'public'
    }

    const stacks = await Stack.find(stackQuery)
      .select('_id name createdAt updatedAt')
      .lean()

    // build response
    const responseData: any = {
      message: 'Class Found!',
      name: selectedClass.name,
      stacks,
      role
    }

    if (role === 'owner') {
      responseData.users = selectedClass.users
        .filter((u: any) => u.account !== null)
        .map(u => ({
          accountId: u.account._id,
          username: (u.account as any).username,
          role: u.role
        }))
      responseData.visibility = selectedClass.visibility
    }

    res.status(200).json(responseData)

  } catch (error) {
    next(error)
  }
}

export default getClassById