import { Schema, model } from 'mongoose'
import { Account } from '../@types'

const accountSchema = new Schema<Account>(
  {
    email: { type: String, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
)

accountSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true, $nin: [null, ''] } } })

export default model<Account>('Account', accountSchema)