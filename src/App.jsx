import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import DockMenu from '@/components/DockMenu'
import { tasksAPI, completedDaysAPI } from '@/lib/api'

function App() {
  const navigate = useNavigate()
  const cells = Array.from({ length: 82 }, (_, i) => i + 1)
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [cellProgress, setCellProgress] = useState({})
  const [completedDays, setCompletedDays] = useState({})

  // Загружаем завершенные дни из API
  useEffect(() => {
    const loadCompletedDays = async () => {
      const loaded = await completedDaysAPI.get()
      setCompletedDays(loaded)
    }
    loadCompletedDays()
  }, [])

  // Сохраняем завершенные дни в API
  useEffect(() => {
    if (Object.keys(completedDays).length > 0) {
      const timer = setTimeout(() => {
        completedDaysAPI.save(completedDays)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [completedDays])

  // Функция для получения прогресса клеточки из API
  const getCellProgress = async (cellNumber) => {
    try {
      const tasks = await tasksAPI.get(cellNumber)
      const totalTasks = (tasks.todo?.length || 0) + (tasks.done?.length || 0) + (tasks['not-done']?.length || 0)
      const completedTasks = tasks.done?.length || 0

      if (totalTasks === 0) return 0
      return Math.round((completedTasks / totalTasks) * 100)
    } catch (e) {
      return 0
    }
  }

  // Обработчик правой кнопки мыши
  const handleContextMenu = (e, cellNumber) => {
    e.preventDefault()
    setCompletedDays((prev) => ({
      ...prev,
      [cellNumber]: !prev[cellNumber],
    }))
  }

  // Обновляем прогресс всех клеточек
  useEffect(() => {
    const loadProgress = async () => {
      const progress = {}
      for (const num of cells) {
        progress[num] = await getCellProgress(num)
      }
      setCellProgress(progress)
    }
    loadProgress()

    // Обновляем прогресс каждые 2 секунды
    const interval = setInterval(async () => {
      const newProgress = {}
      for (const num of cells) {
        newProgress[num] = await getCellProgress(num)
      }
      setCellProgress(newProgress)
    }, 2000)

    return () => clearInterval(interval)
  }, [cells])

  useEffect(() => {
    // Целевая дата: 10 февраля 2026 года
    const targetDate = new Date(2026, 1, 10, 0, 0, 0) // месяц 1 = февраль (0-индексированный)
    
    const tick = () => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTime({ d: 0, h: 0, m: 0, s: 0 })
        return
      }

      // Вычисляем дни, часы, минуты, секунды
      const totalSeconds = Math.floor(diff / 1000)
      const totalMinutes = Math.floor(totalSeconds / 60)
      const totalHours = Math.floor(totalMinutes / 60)

      const d = Math.floor(totalHours / 24)
      const h = totalHours % 24
      const m = totalMinutes % 60
      const s = totalSeconds % 60

      setTime({ d, h, m, s })
    }

    // Запускаем сразу
    tick()
    
    // Обновляем каждую секунду
    const timer = setInterval(tick, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex justify-center items-center p-4 md:p-8 pb-24">
      <div className="w-full max-w-6xl space-y-6">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              ОСТАЛОСЬ
            </CardTitle>
            <div className="flex items-center justify-center gap-2 md:gap-3 text-4xl md:text-5xl lg:text-6xl font-bold">
              <div className="flex flex-col items-center">
                <span className="text-blue-600">
                  {String(time.d).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 font-normal mt-1">ДД</span>
              </div>
              <span className="text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-blue-600">
                  {String(time.h).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 font-normal mt-1">ЧЧ</span>
              </div>
              <span className="text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-blue-600">
                  {String(time.m).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 font-normal mt-1">ММ</span>
              </div>
              <span className="text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-indigo-600">
                  {String(time.s).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 font-normal mt-1">СС</span>
              </div>
            </div>
            <CardDescription className="text-base mt-4">
              Мама, Папа, Даша на тебя надеятся
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-3 md:gap-4 p-2">
              {cells.map((num) => {
                const progress = cellProgress[num] || 0
                const isCompleted = completedDays[num] || false
                const getProgressColor = (percent) => {
                  if (percent === 0) return 'bg-white'
                  if (percent < 33) return 'bg-green-100'
                  if (percent < 66) return 'bg-green-300'
                  if (percent < 100) return 'bg-green-500'
                  return 'bg-green-600'
                }
                
                return (
                  <div
                    key={num}
                    onClick={() => navigate(`/cell/${num}`)}
                    onContextMenu={(e) => handleContextMenu(e, num)}
                    className={`aspect-square border-2 border-gray-200 rounded-lg shadow-sm cursor-pointer relative overflow-hidden transition-all duration-300 ${
                      isCompleted ? 'opacity-70' : ''
                    }`}
                  >
                    {/* Фон прогресса */}
                    <div
                      className={`absolute inset-0 transition-all duration-500 ${getProgressColor(progress)}`}
                      style={{ opacity: progress > 0 ? 0.3 : 0 }}
                    />
                    
                    {/* Прогресс-бар внизу */}
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                        <div
                          className="h-full bg-green-600 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    
                    {/* Номер клеточки или замочек */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {isCompleted ? (
                        <Lock size={24} className="text-blue-600 z-10" />
                      ) : (
                        <span className="text-sm text-gray-700 font-medium z-10">{num}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <DockMenu />
    </div>
  )
}

export default App
