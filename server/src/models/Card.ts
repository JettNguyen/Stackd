import { Schema, model } from 'mongoose'
import { Card } from '../@types'

const cardSchema = new Schema<Card>(
  {
    stack: {
      type: Schema.Types.ObjectId,
      ref: 'Stack',
      required: true,
      index: true
    },

    front: { type: String, required: true },
    back: { type: String, required: true }
  },
  { timestamps: true }
)

export default model<Card>('Card', cardSchema)