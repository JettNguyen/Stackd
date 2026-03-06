import { Schema, model } from 'mongoose'
import { Account } from '../@types'

const accountSchema = new Schema<Account>(
  {
    username: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
)

export default model<Account>('Account', accountSchema)