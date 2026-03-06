import { Schema, model, Types } from 'mongoose'
import { Card } from '../@types'

const cardSchema = new Schema<Card>(
  {
    front: { type: String, required: true },
    back: { type: String, required: true }
  },
  { timestamps: true }
)

export default model<Card>('Card', cardSchema)