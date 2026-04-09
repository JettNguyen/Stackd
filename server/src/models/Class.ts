import { Schema, model } from 'mongoose'
import { Class } from '../@types'

const classSchema = new Schema<Class>(
  {
    name: { type: String, required: true },

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
        },
        lastOpenedAt: {
          type: Date,
          required: false
        }
      }
    ]
  },
  { timestamps: true }
)

export default model<Class>('Class', classSchema)