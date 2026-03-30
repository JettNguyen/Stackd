// get account information to populate home page

import { type RequestHandler } from 'express'
import Account from '../../models/Account'
import Stack from '../../models/Stack'
import Class from '../../models/Class'

const user: RequestHandler = async (req, res, next) => {
  try {
    const { uid } = req.auth || {}

    // Get account from DB, password is not verified because we're already token-authorized at this point
    const account = await Account.findOne({ _id: uid }).select('-password')
    
    if (!account) {
      return next({
        statusCode: 400,
        message: 'Your session is no longer valid. Please sign in again.',
      })
    }

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
          stackCount: { $size: '$stacks' } // count number of stacks
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          createdAt: 1,
          updatedAt: 1,
          stackCount: 1 // include stack count
        }
      }
    ]);

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
      message: 'Successfully got account',
      data: account,
      classes: userClasses,
      stacks,
    })
  } catch (error) {
    next(error)
  }
}

export default user
