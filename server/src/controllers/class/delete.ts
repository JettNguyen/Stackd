import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

const view: RequestHandler = async (req, res, next) => {
  try {
    const { class: classId } = req.query

    const selectedClass = await Class.findById(classId)

    if (!selectedClass) {
      return next({
        statusCode: 404,
        message: 'Could not find class'
      })
    }

    let role: string | null = null

    const { uid } = req.auth || {}

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
        message: 'You do not have permission to view this class'
      })
    }

    const stacks = await Stack.find({ class: classId, 'users.account': uid})
      .select('_id name createdAt updatedAt')
      .lean()
    
    // if owner pass the list of users and roles
    if (role === 'owner') {
      const classData = await Class.findById(classId)
        .populate('users.account', 'username')
      if (classData) {
        const users = classData.users.map(u => ({
          accountId: (u.account as any)._id,
          username: (u.account as any).username,
          role: u.role
        }))
        return next({
          message: 'Class Found!',
          statusCode: 200,
          name: selectedClass.name,
          stacks: stacks,
          role: role,
          users: users
        })
      }
    }

    return next({
      message: 'Class Found!',
      statusCode: 200,
      name: selectedClass.name,
      stacks: stacks,
      role: role
    })

  } catch (error) {
    next(error)
  }
}

export default view