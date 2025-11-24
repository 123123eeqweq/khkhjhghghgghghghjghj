import mongoose from 'mongoose'

// Connection string для MongoDB Atlas
// Важно: убедитесь, что IP-адрес добавлен в whitelist MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://sdfghsdghfsgdjfsd2711111_db_user:ScndkL5ZS1B4Qnxd@quotes.et2ccvo.mongodb.net/80days?retryWrites=true&w=majority&appName=Quotes'

let isConnected = false

export const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB already connected')
    return
  }

  try {
    await mongoose.connect(MONGODB_URI)
    isConnected = true
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    isConnected = false
    throw error
  }
}

export const disconnectDB = async () => {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
  console.log('MongoDB disconnected')
}

