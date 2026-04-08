import { type RequestHandler } from 'express'
import Account from '../../models/Account'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

const viewProfile: RequestHandler = async (req, res, next) => {
  try {
    const username = String(req.params.username || '').trim().toLowerCase()

    if (!username) {
      next({ statusCode: 400, message: 'Username is required.' })
      return
    }

    const account = await Account.findOne({ username }).select('-password')

    if (!account) {
      next({ statusCode: 404, message: 'Profile not found.' })
      return
    }

    const viewerUid = String(req.auth?.uid || '')
    const isOwnProfile = Boolean(viewerUid) && viewerUid === String(account._id)

    if (!isOwnProfile && !account.publicProfile) {
      next({ statusCode: 404, message: 'Profile not found.' })
      return
    }

    if (isOwnProfile) {
      const userClasses = await Class.aggregate([
        {
          $match: {
            'users.account': account._id,
          }
        },
        {
          $lookup: {
            from: 'stacks',
            localField: '_id',
            foreignField: 'class',
            as: 'stacks'
          }
        },
        {
          $addFields: {
            stackCount: { $size: '$stacks' }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            createdAt: 1,
            updatedAt: 1,
            stackCount: 1
          }
        }
      ])

      const userStacks = await Stack.find({ 'users.account': account._id })
        .populate('class', 'name')
        .select('_id name class updatedAt createdAt')
        .lean()

      const stacks = userStacks.map((stack: any) => ({
        _id: stack._id,
        name: stack.name,
        className: stack.class?.name || '',
        updatedAt: stack.updatedAt,
        createdAt: stack.createdAt,
      }))

      res.status(200).json({
        message: 'Successfully got account profile',
        data: account,
        classes: userClasses,
        stacks,
        isOwnProfile,
      })
      return
    }

    const publicClasses = await Class.find({
      'users.account': account._id,
      visibility: 'public',
    })
      .select('_id name createdAt updatedAt')
      .lean()

    const classes = await Promise.all(
      publicClasses.map(async (item) => ({
        _id: item._id,
        name: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        stackCount: await Stack.countDocuments({ class: item._id, visibility: 'public' }),
      }))
    )

    const userStacks = await Stack.find({
      'users.account': account._id,
      visibility: 'public',
    })
      .populate('class', 'name visibility')
      .select('_id name class updatedAt createdAt')
      .lean()

    const stacks = userStacks
      .filter((stack: any) => !stack.class || stack.class.visibility === 'public')
      .map((stack: any) => ({
        _id: stack._id,
        name: stack.name,
        className: stack.class?.name || '',
        updatedAt: stack.updatedAt,
        createdAt: stack.createdAt,
      }))

    res.status(200).json({
      message: 'Successfully got public profile',
      data: account,
      classes,
      stacks,
      isOwnProfile,
    })
    return
  } catch (error) {
    next(error)
  }
}

export default viewProfile
