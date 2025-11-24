import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema({
  id: String,
  description: String,
  amount: Number
})

const financeSchema = new mongoose.Schema({
  capital: {
    type: Number,
    default: 0
  },
  expenses: {
    'Октябрь': [expenseSchema],
    'Ноябрь': [expenseSchema],
    'Декабрь': [expenseSchema],
    'Январь': [expenseSchema]
  }
}, {
  timestamps: true
})

// Создаем единственный документ
financeSchema.statics.getOrCreate = async function() {
  let finance = await this.findOne()
  if (!finance) {
    finance = await this.create({
      capital: 0,
      expenses: {
        'Октябрь': [],
        'Ноябрь': [],
        'Декабрь': [],
        'Январь': []
      }
    })
  }
  return finance
}

export default mongoose.model('Finance', financeSchema)

