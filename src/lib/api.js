// API URL - для production берем из переменной окружения, иначе используем прокси или localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api')

// Получение токена авторизации
const getAuthToken = () => {
  return localStorage.getItem('authToken')
}

// Добавление токена к запросу
const getAuthHeaders = () => {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// Обработка ошибок авторизации
const handleAuthError = (response) => {
  if (response.status === 401) {
    localStorage.removeItem('authToken')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
}

// Задачи для клеточек
export const tasksAPI = {
  get: async (cellNumber) => {
    const response = await fetch(`${API_URL}/tasks/${cellNumber}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to fetch tasks')
    }
    return await response.json()
  },
  
  save: async (cellNumber, tasks) => {
    const response = await fetch(`${API_URL}/tasks/${cellNumber}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tasks),
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to save tasks')
    }
    return await response.json()
  },
}

// Завершенные дни
export const completedDaysAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/completed-days`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to fetch completed days')
    }
    return await response.json()
  },
  
  save: async (completedDays) => {
    const response = await fetch(`${API_URL}/completed-days`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(completedDays),
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to save completed days')
    }
    return await response.json()
  },
}

// Финансы
export const financesAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/finances`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to fetch finances')
    }
    return await response.json()
  },
  
  save: async (finances) => {
    const response = await fetch(`${API_URL}/finances`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(finances),
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to save finances')
    }
    return await response.json()
  },
}

// Цели
export const goalsAPI = {
  get: async () => {
    const response = await fetch(`${API_URL}/goals`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to fetch goals')
    }
    return await response.json()
  },
  
  save: async (goals) => {
    const response = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goals),
    })
    if (!response.ok) {
      handleAuthError(response)
      throw new Error('Failed to save goals')
    }
    return await response.json()
  },
}
