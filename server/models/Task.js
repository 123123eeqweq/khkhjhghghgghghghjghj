import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  cellNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tasks: {
    todo: [{
      id: String,
      text: String,
      priority: String // 'red', 'orange', 'green', null
    }],
    done: [{
      id: String,
      text: String,
      priority: String
    }],
    'not-done': [{
      id: String,
      text: String,
      priority: String
    }]
  }
}, {
  timestamps: true
})

export default mongoose.model('Task', taskSchema)

