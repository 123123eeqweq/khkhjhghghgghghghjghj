import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting login...')
      // Используем переменную окружения или прокси/localhost
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/auth/login`
        : (import.meta.env.DEV ? '/api/auth/login' : 'http://localhost:3001/api/auth/login')
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok && response.status === 404) {
        throw new Error('Сервер не найден. Убедитесь, что бэкенд запущен на порту 3001')
      }

      let data
      try {
        data = await response.json()
        console.log('Response data:', data)
      } catch (parseError) {
        console.error('Parse error:', parseError)
        const text = await response.text()
        console.error('Response text:', text)
        throw new Error(`Ошибка обработки ответа сервера (код: ${response.status})`)
      }

      if (response.ok && data.success) {
        // Сохраняем токен
        localStorage.setItem('authToken', data.token)
        // Полная перезагрузка для обновления авторизации
        window.location.href = '/'
      } else {
        setError(data.error || 'Неверный пароль')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
        setError('Ошибка подключения к серверу. Проверьте, что бэкенд запущен на порту 3001')
      } else {
        setError(error.message || 'Ошибка подключения к серверу')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex justify-center items-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            80 Days Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
