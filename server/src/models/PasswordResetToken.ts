import { Schema, model } from 'mongoose'

const passwordResetTokenSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
})

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default model('PasswordResetToken', passwordResetTokenSchema)
