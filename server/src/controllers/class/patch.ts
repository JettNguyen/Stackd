import { type RequestHandler } from 'express'
import Class from '../../models/Class'

// update visibility of class
const updateVisibility: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const cid = req.params.id
    const { visibility } = req.body

    if (!visibility) {
      res.status(400).json({
        message: 'Visibility is required'
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

    // check if user is authorized to change visibility (must be owner)
    let role: string | null = null
    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account._id.toString() === uid.toString()
      )
      if (userEntry) role = userEntry.role
    }

    if (role !== 'owner') {
      res.status(403).json({
        message: 'You do not have permission to change visibility of this class'
      })
      return
    }

    if (selectedClass.visibility === visibility) {
      res.status(400).json({
        message: 'Class visibility is already set to the requested value'
      })
      return
    }

    // Update class visibility
    selectedClass.visibility = visibility

    await selectedClass.save()

    res.status(200).json({
      message: 'Class visibility updated!',
      class: selectedClass
    })

  } catch (error) {
    next(error)
  }
}

// update name of class
const updateName: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}
    const cid = req.params.id
    const { name } = req.body

    if (!name) {
      res.status(400).json({
        message: 'Name is required'
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

    // check if user is authorized to change visibility (must be owner)
    let role: string | null = null
    if (uid) {
      const userEntry = selectedClass.users.find(
        (u: any) => u.account._id.toString() === uid.toString()
      )
      if (userEntry) role = userEntry.role
    }

    if (role !== 'owner') {
      res.status(403).json({
        message: 'You do not have permission to change name of this class'
      })
      return
    }

    // Update class name
    selectedClass.name = name

    await selectedClass.save()

    res.status(200).json({
      message: 'Class name updated!',
      class: selectedClass
    })

  } catch (error) {
    next(error)
  }
}

export { updateVisibility, updateName }