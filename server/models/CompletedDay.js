import mongoose from 'mongoose'

const completedDaySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  completed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

export default mongoose.model('CompletedDay', completedDaySchema)

