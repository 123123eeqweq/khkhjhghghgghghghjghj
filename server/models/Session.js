import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expires: {
    type: Number,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {
  timestamps: false
})

// Индекс для автоматического удаления истекших сессий
sessionSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Session', sessionSchema)

