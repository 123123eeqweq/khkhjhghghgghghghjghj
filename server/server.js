import express from 'express'
import bodyParser from 'body-parser'
import { config } from './config.js'
import { supabase } from './supabase.js'

const app = express()
const PORT = process.env.PORT || 3001

// CORS - РАЗРЕШАЕМ ВСЁ БЕЗ ОГРАНИЧЕНИЙ
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  next()
})

app.use(bodyParser.json())

const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36)
}

// БЕЗ ПРОВЕРКИ - ВСЁ РАЗРЕШЕНО
const requireAuth = async (req, res, next) => {
  next()
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body
    
    if (password === config.PASSWORD) {
      const token = generateToken()
      const expires = Date.now() + config.SESSION_DURATION
      
      await supabase.from('sessions').insert({
        token,
        expires,
        created_at: Date.now()
      })
      
      res.json({ success: true, token, expires })
    } else {
      res.status(401).json({ success: false, error: 'Неверный пароль' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера', details: error.message })
  }
})

app.get('/api/auth/check', requireAuth, (req, res) => {
  res.json({ success: true, valid: true })
})

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  res.json({ success: true })
})

app.get('/api/tasks/:cellNumber', requireAuth, async (req, res) => {
  try {
    const { cellNumber } = req.params
    const { data, error } = await supabase
      .from('tasks')
      .select('tasks')
      .eq('cell_number', cellNumber)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ success: false, error: 'Failed to fetch tasks' })
    }
    
    res.json(data?.tasks || { todo: [], done: [], 'not-done': [] })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' })
  }
})

app.post('/api/tasks/:cellNumber', requireAuth, async (req, res) => {
  try {
    const { cellNumber } = req.params
    const tasks = req.body
    
    await supabase.from('tasks').upsert({
      cell_number: cellNumber,
      tasks: tasks
    }, { onConflict: 'cell_number' })
    
    res.json({ success: true, tasks })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save tasks' })
  }
})

app.get('/api/completed-days', requireAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('completed_days')
      .select('day_number')
      .eq('completed', true)
    
    const completedDays = {}
    if (data) {
      data.forEach(doc => {
        completedDays[doc.day_number] = true
      })
    }
    
    res.json(completedDays)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch completed days' })
  }
})

app.post('/api/completed-days', requireAuth, async (req, res) => {
  try {
    const completedDays = req.body
    
    const { data: existingDays } = await supabase
      .from('completed_days')
      .select('day_number')
      .eq('completed', true)
    
    const existingDayNumbers = new Set(existingDays?.map(d => d.day_number) || [])
    
    const daysToAdd = Object.keys(completedDays)
      .filter(dayNumber => completedDays[dayNumber] && !existingDayNumbers.has(parseInt(dayNumber)))
      .map(dayNumber => parseInt(dayNumber))
    
    const daysToRemove = Array.from(existingDayNumbers)
      .filter(dayNumber => !completedDays[dayNumber])
    
    if (daysToAdd.length > 0) {
      const inserts = daysToAdd.map(dayNumber => ({
        day_number: dayNumber,
        completed: true
      }))
      await supabase.from('completed_days').upsert(inserts, { onConflict: 'day_number' })
    }
    
    if (daysToRemove.length > 0) {
      await supabase.from('completed_days').delete().in('day_number', daysToRemove)
    }
    
    res.json({ success: true, completedDays })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save completed days' })
  }
})

app.get('/api/finances', requireAuth, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('finances')
      .select('capital, expenses')
      .eq('id', 1)
      .single()
    
    if (error && error.code === 'PGRST116') {
      const { data: newData } = await supabase
        .from('finances')
        .insert({
          id: 1,
          capital: 0,
          expenses: { 'Октябрь': [], 'Ноябрь': [], 'Декабрь': [], 'Январь': [] }
        })
        .select('capital, expenses')
        .single()
      data = newData
    }
    
    res.json({
      capital: data?.capital || 0,
      expenses: data?.expenses || { 'Октябрь': [], 'Ноябрь': [], 'Декабрь': [], 'Январь': [] }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch finances' })
  }
})

app.post('/api/finances', requireAuth, async (req, res) => {
  try {
    const { capital, expenses } = req.body
    
    const { data } = await supabase
      .from('finances')
      .upsert({
        id: 1,
        capital: capital !== undefined ? capital : 0,
        expenses: expenses
      }, { onConflict: 'id' })
      .select('capital, expenses')
      .single()
    
    res.json({ success: true, finances: { capital: data.capital, expenses: data.expenses } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save finances' })
  }
})

app.get('/api/goals', requireAuth, async (req, res) => {
  try {
    let { data, error } = await supabase
      .from('goals')
      .select('goals')
      .eq('id', 1)
      .single()
    
    if (error && error.code === 'PGRST116') {
      const { data: newData } = await supabase
        .from('goals')
        .insert({
          id: 1,
          goals: { planned: [], completed: [] }
        })
        .select('goals')
        .single()
      data = newData
    }
    
    res.json(data?.goals || { planned: [], completed: [] })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch goals' })
  }
})

app.post('/api/goals', requireAuth, async (req, res) => {
  try {
    const goals = req.body
    
    const { data } = await supabase
      .from('goals')
      .upsert({
        id: 1,
        goals: goals
      }, { onConflict: 'id' })
      .select('goals')
      .single()
    
    res.json({ success: true, goals: data.goals })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save goals' })
  }
})

app.get('/api/all-data', requireAuth, async (req, res) => {
  try {
    const { data: allTasks } = await supabase.from('tasks').select('cell_number, tasks')
    const tasks = {}
    if (allTasks) {
      allTasks.forEach(task => {
        tasks[task.cell_number] = task.tasks
      })
    }
    
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
    
    let { data: finance } = await supabase
      .from('finances')
      .select('capital, expenses')
      .eq('id', 1)
      .single()
    
    if (!finance) {
      finance = { capital: 0, expenses: { 'Октябрь': [], 'Ноябрь': [], 'Декабрь': [], 'Январь': [] } }
    }
    
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
    res.status(500).json({ success: false, error: 'Failed to fetch all data' })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`)
})
