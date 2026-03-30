import { Schema, model } from 'mongoose'
import { UserCardProgress } from '../@types'

const userCardProgressSchema = new Schema<UserCardProgress>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },

    card: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true
    },

    stack: {
      type: Schema.Types.ObjectId,
      ref: 'Stack',
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ['learning', 'review', 'mastered'],
      default: 'learning'
    }
  },
  { timestamps: true }
)

export default model<UserCardProgress>('UserCardProgress', userCardProgressSchema)