import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

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
        message: 'You do not have permission to view this stack'
      })
    }

    return next({
      message: '',
      statusCode: 200,
      stack: selectedStack,
      className: selectedClass.name,
      role: role
    })

  } catch (error) {
    next(error)
  }
}

export default view