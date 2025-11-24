import express from 'express'
import bodyParser from 'body-parser'
import { config } from './config.js'
import { supabase } from './supabase.js'

const app = express()
const PORT = process.env.PORT || 3001

// CORS - РАЗРЕШЕНО ВСЁ, БЕЗ ПРОВЕРОК
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.options('*', (req, res) => res.sendStatus(200))

app.use(bodyParser.json())

// ЛОГИРОВАНИЕ УБРАНО

// Генерация токена
const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36)
}

// БЕЗ ПРОВЕРКИ АВТОРИЗАЦИИ - ТОЛЬКО ПАРОЛЬ
const requireAuth = async (req, res, next) => {
  next() // ПРОПУСКАЕМ ВСЁ
}

// Health check (публичный)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Авторизация (публичный endpoint)
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt, body:', req.body)
    const { password } = req.body
    
    if (!password) {
      console.log('❌ No password provided')
      return res.status(400).json({ success: false, error: 'Пароль не указан' })
    }
    
    console.log('Checking password:', password === config.PASSWORD ? 'MATCH' : 'NO MATCH')
    
    if (password === config.PASSWORD) {
      const token = generateToken()
      const expires = Date.now() + config.SESSION_DURATION
      
      // Сохраняем сессию в Supabase
      const { error } = await supabase
        .from('sessions')
        .insert({
          token,
          expires,
          created_at: Date.now()
        })
      
      if (error) {
        console.error('Error saving session:', error)
        return res.status(500).json({ success: false, error: 'Failed to create session' })
      }
      
      console.log(`✅ User logged in, token created: ${token.substring(0, 20)}...`)
      res.json({ success: true, token, expires })
    } else {
      console.log(`❌ Failed login attempt - wrong password`)
      res.status(401).json({ success: false, error: 'Неверный пароль' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера', details: error.message })
  }
})

// Проверка авторизации
app.get('/api/auth/check', requireAuth, (req, res) => {
  res.json({ success: true, valid: true })
})

// Выход
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('token', req.token)
    
    if (error) {
      console.error('Error deleting session:', error)
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// Защищенные роуты - требуют авторизации

// Задачи для клеточек
app.get('/api/tasks/:cellNumber', requireAuth, async (req, res) => {
  try {
    const { cellNumber } = req.params
    const { data, error } = await supabase
      .from('tasks')
      .select('tasks')
      .eq('cell_number', cellNumber)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching tasks:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch tasks' })
    }
    
    if (data) {
      res.json(data.tasks)
    } else {
      // Возвращаем пустую структуру, если задачи еще не созданы
      res.json({ todo: [], done: [], 'not-done': [] })
    }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' })
  }
})

app.post('/api/tasks/:cellNumber', requireAuth, async (req, res) => {
  try {
    const { cellNumber } = req.params
    const tasks = req.body
    
    // Валидация данных
    if (!tasks || typeof tasks !== 'object') {
      console.error(`❌ Invalid tasks data for cell ${cellNumber}:`, tasks)
      return res.status(400).json({ success: false, error: 'Invalid tasks data' })
    }
    
    console.log(`💾 Saving tasks for cell ${cellNumber}:`, JSON.stringify(tasks).substring(0, 200))
    
    const { data, error } = await supabase
      .from('tasks')
      .upsert({
        cell_number: cellNumber,
        tasks: tasks
      }, {
        onConflict: 'cell_number'
      })
      .select()
    
    if (error) {
      console.error(`❌ Error saving tasks for cell ${cellNumber}:`, error)
      return res.status(500).json({ success: false, error: 'Failed to save tasks', details: error.message })
    }
    
    console.log(`✅ Successfully saved tasks for cell ${cellNumber}`)
    res.json({ success: true, tasks })
  } catch (error) {
    console.error(`❌ Exception saving tasks for cell ${req.params.cellNumber}:`, error)
    res.status(500).json({ success: false, error: 'Failed to save tasks', details: error.message })
  }
})

// Завершенные дни
app.get('/api/completed-days', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('completed_days')
      .select('day_number')
      .eq('completed', true)
    
    if (error) {
      console.error('Error fetching completed days:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch completed days' })
    }
    
    const completedDays = {}
    if (data) {
      data.forEach(doc => {
        completedDays[doc.day_number] = true
      })
    }
    
    res.json(completedDays)
  } catch (error) {
    console.error('Error fetching completed days:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch completed days' })
  }
})

app.post('/api/completed-days', requireAuth, async (req, res) => {
  try {
    const completedDays = req.body
    
    // Валидация
    if (!completedDays || typeof completedDays !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid completed days data' })
    }
    
    // Получаем все существующие завершенные дни
    const { data: existingDays } = await supabase
      .from('completed_days')
      .select('day_number')
      .eq('completed', true)
    
    const existingDayNumbers = new Set(existingDays?.map(d => d.day_number) || [])
    
    // Находим дни, которые нужно добавить и удалить
    const daysToAdd = Object.keys(completedDays)
      .filter(dayNumber => completedDays[dayNumber] && !existingDayNumbers.has(parseInt(dayNumber)))
      .map(dayNumber => parseInt(dayNumber))
    
    const daysToRemove = Array.from(existingDayNumbers)
      .filter(dayNumber => !completedDays[dayNumber])
    
    // Добавляем новые завершенные дни
    if (daysToAdd.length > 0) {
      const inserts = daysToAdd.map(dayNumber => ({
        day_number: dayNumber,
        completed: true
      }))
      
      const { error: insertError } = await supabase
        .from('completed_days')
        .upsert(inserts, { onConflict: 'day_number' })
      
      if (insertError) {
        console.error('Error inserting completed days:', insertError)
      }
    }
    
    // Удаляем дни, которые больше не завершены
    if (daysToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('completed_days')
        .delete()
        .in('day_number', daysToRemove)
      
      if (deleteError) {
        console.error('Error deleting completed days:', deleteError)
      }
    }
    
    console.log(`✅ Saved completed days (added: ${daysToAdd.length}, removed: ${daysToRemove.length})`)
    res.json({ success: true, completedDays })
  } catch (error) {
    console.error('Error saving completed days:', error)
    res.status(500).json({ success: false, error: 'Failed to save completed days' })
  }
})

// Финансы
app.get('/api/finances', requireAuth, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('finances')
      .select('capital, expenses')
      .eq('id', 1)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // Создаем запись, если её нет
      const { data: newData, error: insertError } = await supabase
        .from('finances')
        .insert({
          id: 1,
          capital: 0,
          expenses: { 'Октябрь': [], 'Ноябрь': [], 'Декабрь': [], 'Январь': [] }
        })
        .select('capital, expenses')
        .single()
      
      if (insertError) {
        console.error('Error creating finances:', insertError)
        return res.status(500).json({ success: false, error: 'Failed to fetch finances' })
      }
      
      data = newData
    } else if (error) {
      console.error('Error fetching finances:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch finances' })
    }
    
    res.json({
      capital: data?.capital || 0,
      expenses: data?.expenses || { 'Октябрь': [], 'Ноябрь': [], 'Декабрь': [], 'Январь': [] }
    })
  } catch (error) {
    console.error('Error fetching finances:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch finances' })
  }
})

app.post('/api/finances', requireAuth, async (req, res) => {
  try {
    const { capital, expenses } = req.body
    
    // Валидация
    if (!expenses || typeof expenses !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid finances data' })
    }
    
    const { data, error } = await supabase
      .from('finances')
      .upsert({
        id: 1,
        capital: capital !== undefined ? capital : 0,
        expenses: expenses
      }, {
        onConflict: 'id'
      })
      .select('capital, expenses')
      .single()
    
    if (error) {
      console.error('Error saving finances:', error)
      return res.status(500).json({ success: false, error: 'Failed to save finances' })
    }
    
    console.log(`✅ Saved finances`)
    res.json({ success: true, finances: { capital: data.capital, expenses: data.expenses } })
  } catch (error) {
    console.error('Error saving finances:', error)
    res.status(500).json({ success: false, error: 'Failed to save finances' })
  }
})

// Цели
app.get('/api/goals', requireAuth, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('goals')
      .select('goals')
      .eq('id', 1)
      .single()
    
    if (error && error.code === 'PGRST116') {
      // Создаем запись, если её нет
      const { data: newData, error: insertError } = await supabase
        .from('goals')
        .insert({
          id: 1,
          goals: { planned: [], completed: [] }
        })
        .select('goals')
        .single()
      
      if (insertError) {
        console.error('Error creating goals:', insertError)
        return res.status(500).json({ success: false, error: 'Failed to fetch goals' })
      }
      
      data = newData
    } else if (error) {
      console.error('Error fetching goals:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch goals' })
    }
    
    res.json(data?.goals || { planned: [], completed: [] })
  } catch (error) {
    console.error('Error fetching goals:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch goals' })
  }
})

app.post('/api/goals', requireAuth, async (req, res) => {
  try {
    const goals = req.body
    
    // Валидация
    if (!goals || typeof goals !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid goals data' })
    }
    
    const { data, error } = await supabase
      .from('goals')
      .upsert({
        id: 1,
        goals: goals
      }, {
        onConflict: 'id'
      })
      .select('goals')
      .single()
    
    if (error) {
      console.error('Error saving goals:', error)
      return res.status(500).json({ success: false, error: 'Failed to save goals' })
    }
    
    console.log(`✅ Saved goals`)
    res.json({ success: true, goals: data.goals })
  } catch (error) {
    console.error('Error saving goals:', error)
    res.status(500).json({ success: false, error: 'Failed to save goals' })
  }
})

// Получить все данные (для синхронизации)
app.get('/api/all-data', requireAuth, async (req, res) => {
  try {
    // Получаем все задачи
    const { data: allTasks } = await supabase.from('tasks').select('cell_number, tasks')
    const tasks = {}
    if (allTasks) {
      allTasks.forEach(task => {
        tasks[task.cell_number] = task.tasks
      })
    }
    
    // Получаем завершенные дни
    const { data: completedDaysDocs } = await supabase
      .from('completed_days')
      .select('day_number')
      .eq('completed', true)
    
    const completedDays = {}
    if (completedDaysDocs) {
      completedDaysDocs.forEach(doc => {
        completedDays[doc.day_number] = true
      })
    }
    
    // Получаем финансы
    let { data: finance } = await supabase
      .from('finances')
      .select('capital, expenses')
      .eq('id', 1)
      .single()
    
    if (!finance) {
      finance = { capital: 0, expenses: { 'Октябрь': [], 'Ноябрь': [], 'Декабрь': [], 'Январь': [] } }
    }
    
    // Получаем цели
    let { data: goal } = await supabase
      .from('goals')
      .select('goals')
      .eq('id', 1)
      .single()
    
    if (!goal) {
      goal = { goals: { planned: [], completed: [] } }
    }
    
    res.json({
      tasks,
      completedDays,
      finances: {
        capital: finance.capital,
        expenses: finance.expenses
      },
      goals: goal.goals
    })
  } catch (error) {
    console.error('Error fetching all data:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch all data' })
  }
})

// 404 обработка
app.use((req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.path}`)
  res.status(404).json({ success: false, error: 'Route not found', path: req.path })
})

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
  console.log(`🔗 Using Supabase`)
  console.log(`🔐 Password: ${config.PASSWORD}`)
})
