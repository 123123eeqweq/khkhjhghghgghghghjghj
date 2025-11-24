import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('authToken')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        // Если сервер недоступен, не считаем это авторизацией
        setIsAuthenticated(false)
        localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return children
}

export default ProtectedRoute
