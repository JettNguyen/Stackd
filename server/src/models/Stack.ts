import { Schema, model } from 'mongoose'
import { Stack } from '../@types'

const stackSchema = new Schema<Stack>(
  {
    name: { type: String, required: true },

    class: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },

    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private'
    },

    users: [
      {
        account: {
          type: Schema.Types.ObjectId,
          ref: 'Account',
          required: true
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'owner'],
          required: true
        }
      }
    ]
  },
  { timestamps: true }
)

export default model<Stack>('Stack', stackSchema)