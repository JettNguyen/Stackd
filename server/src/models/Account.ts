import { Schema, model } from 'mongoose'
import { Account } from '../@types'

const accountSchema = new Schema<Account>(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
)

export default model<Account>('Account', accountSchema)