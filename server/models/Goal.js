import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema({
  goals: {
    planned: [{
      id: String,
      text: String
    }],
    completed: [{
      id: String,
      text: String
    }]
  }
}, {
  timestamps: true
})

// Создаем единственный документ
goalSchema.statics.getOrCreate = async function() {
  let goal = await this.findOne()
  if (!goal) {
    goal = await this.create({
      goals: {
        planned: [],
        completed: []
      }
    })
  }
  return goal
}

export default mongoose.model('Goal', goalSchema)

