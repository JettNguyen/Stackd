import { Schema, model, Types } from 'mongoose'

const stackSchema = new Schema({
  name: { type: String, required: true },
  visibility: { type: String, enum: ['public', 'private'], default: 'private' },

  // List of users with roles
  users: [
    {
      account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
      role: { type: String, enum: ['viewer', 'editor', 'owner'], required: true }
    }
  ],

  // List of cards in this stack
  cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }]
}, { timestamps: true })

export default model('Stack', stackSchema)