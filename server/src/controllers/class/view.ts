import { type RequestHandler } from 'express'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

const view: RequestHandler = async (req, res, next) => {
  try {
    const { class: classId } = req.query

    const selectedClass = await Class.findById(classId).lean()

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

    const stacks = await Stack.find({ class: classId })
      .select('_id name createdAt updatedAt')
      .lean()

    return next({
      message: '',
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