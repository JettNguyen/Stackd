import { Schema, model, Types } from 'mongoose'

const classSchema = new Schema({
  name: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'private' },

  // List of accounts with roles
  users: [
    {
      account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
      role: { type: String, enum: ['viewer', 'editor', 'owner'], required: true }
    }
  ],

  // List of stacks in this class
  stacks: [{ type: Schema.Types.ObjectId, ref: 'Stack' }]
}, { timestamps: true })

export default model('Class', classSchema)