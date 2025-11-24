import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB, disconnectDB } from './database.js'
import Task from './models/Task.js'
import CompletedDay from './models/CompletedDay.js'
import Finance from './models/Finance.js'
import Goal from './models/Goal.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.join(__dirname, 'data.json')

async function migrate() {
  try {
    console.log('🔄 Starting migration from JSON to MongoDB...')
    
    // Подключаемся к БД
    await connectDB()
    
    // Проверяем, существует ли файл данных
    if (!fs.existsSync(DATA_FILE)) {
      console.log('ℹ️  No data.json file found. Nothing to migrate.')
      await disconnectDB()
      return
    }
    
    // Читаем данные из JSON
    const jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    console.log('📄 Loaded data from JSON file')
    
    let migrated = 0
    
    // Мигрируем задачи
    if (jsonData.tasks && Object.keys(jsonData.tasks).length > 0) {
      console.log('📦 Migrating tasks...')
      for (const [cellNumber, tasks] of Object.entries(jsonData.tasks)) {
        await Task.findOneAndUpdate(
          { cellNumber },
          { cellNumber, tasks },
          { upsert: true }
        )
        migrated++
      }
      console.log(`✅ Migrated ${migrated} task sets`)
    }
    
    // Мигрируем завершенные дни
    if (jsonData.completedDays && Object.keys(jsonData.completedDays).length > 0) {
      console.log('📦 Migrating completed days...')
      migrated = 0
      for (const [dayNumber, completed] of Object.entries(jsonData.completedDays)) {
        if (completed) {
          await CompletedDay.findOneAndUpdate(
            { dayNumber: parseInt(dayNumber) },
            { dayNumber: parseInt(dayNumber), completed: true },
            { upsert: true }
          )
          migrated++
        }
      }
      console.log(`✅ Migrated ${migrated} completed days`)
    }
    
    // Мигрируем финансы
    if (jsonData.finances) {
      console.log('📦 Migrating finances...')
      const finance = await Finance.getOrCreate()
      finance.capital = jsonData.finances.capital || 0
      if (jsonData.finances.expenses) {
        finance.expenses = jsonData.finances.expenses
      }
      await finance.save()
      console.log('✅ Migrated finances')
    }
    
    // Мигрируем цели
    if (jsonData.goals) {
      console.log('📦 Migrating goals...')
      const goal = await Goal.getOrCreate()
      goal.goals = jsonData.goals
      await goal.save()
      console.log('✅ Migrated goals')
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('💡 You can now remove data.json if you want (it will be backed up as data.json.backup)')
    
    // Создаем бэкап
    const backupFile = DATA_FILE + '.backup'
    fs.copyFileSync(DATA_FILE, backupFile)
    console.log(`📦 Backup created: ${backupFile}`)
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  } finally {
    await disconnectDB()
  }
}

migrate()

