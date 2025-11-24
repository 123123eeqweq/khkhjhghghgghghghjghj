import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { goalsAPI } from '@/lib/api'

const COLUMNS = [
  { id: 'planned', title: 'Запланировано' },
  { id: 'completed', title: 'Выполнено' },
]

function GoalsBoard() {
  const [goals, setGoals] = useState({ 'planned': [], 'completed': [] })
  const [editingGoal, setEditingGoal] = useState(null)
  const [newGoalText, setNewGoalText] = useState('')
  const [draggedColumn, setDraggedColumn] = useState(null)

  // Загружаем цели из API
  useEffect(() => {
    const loadGoals = async () => {
      const loadedGoals = await goalsAPI.get()
      setGoals({
        'planned': loadedGoals['planned'] || [],
        'completed': loadedGoals['completed'] || [],
      })
    }
    loadGoals()
  }, [])

  // Сохраняем цели в API (с дебаунсом)
  useEffect(() => {
    const timer = setTimeout(() => {
      goalsAPI.save(goals)
    }, 500)
    return () => clearTimeout(timer)
  }, [goals])

  const addGoal = () => {
    if (!newGoalText.trim()) return

    const newGoal = {
      id: Date.now().toString(),
      text: newGoalText.trim(),
      date: new Date().toISOString(),
    }

    setGoals((prev) => ({
      ...prev,
      'planned': [...prev['planned'], newGoal],
    }))

    setNewGoalText('')
  }

  const deleteGoal = (columnId, goalId) => {
    setGoals((prev) => ({
      ...prev,
      [columnId]: prev[columnId].filter((goal) => goal.id !== goalId),
    }))
  }

  const updateGoalText = (columnId, goalId, newText) => {
    setGoals((prev) => ({
      ...prev,
      [columnId]: prev[columnId].map((goal) =>
        goal.id === goalId ? { ...goal, text: newText } : goal
      ),
    }))
    setEditingGoal(null)
  }

  const moveGoal = (fromColumn, toColumn, goalId) => {
    setGoals((prev) => {
      const goal = prev[fromColumn].find((g) => g.id === goalId)
      if (!goal) return prev

      return {
        ...prev,
        [fromColumn]: prev[fromColumn].filter((g) => g.id !== goalId),
        [toColumn]: [...prev[toColumn], goal],
      }
    })
  }

  // Вычисляем прогресс
  const totalGoals = goals['planned'].length + goals['completed'].length
  const completedGoals = goals['completed'].length
  const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Прогресс-бар */}
      {totalGoals > 0 && (
        <Card className="bg-white/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">
                  Выполнено: {completedGoals} из {totalGoals}
                </span>
                <span className="text-gray-600 font-semibold">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма добавления цели */}
      <Card className="bg-white/50">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Введите цель..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addGoal}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Добавить
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Колонки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col">
            <Card className="flex-1 bg-white/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{column.title}</CardTitle>
              </CardHeader>
              <CardContent
                className="space-y-2 min-h-[200px]"
                onDragOver={(e) => {
                  e.preventDefault()
                  setDraggedColumn(column.id)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setDraggedColumn(null)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const goalId = e.dataTransfer.getData('goalId')
                  const fromColumn = e.dataTransfer.getData('fromColumn')
                  if (fromColumn && fromColumn !== column.id) {
                    moveGoal(fromColumn, column.id, goalId)
                  }
                  setDraggedColumn(null)
                }}
              >
                {goals[column.id]?.map((goal) => (
                  <Card
                    key={goal.id}
                    className={`p-3 bg-white shadow-sm hover:shadow-md transition-shadow cursor-move ${
                      draggedColumn === column.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('goalId', goal.id)
                      e.dataTransfer.setData('fromColumn', column.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    {editingGoal === goal.id ? (
                      <input
                        type="text"
                        defaultValue={goal.text}
                        onBlur={(e) => updateGoalText(column.id, goal.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateGoalText(column.id, goal.id, e.target.value)
                          }
                        }}
                        autoFocus
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="flex-1 text-sm cursor-pointer"
                          onClick={() => setEditingGoal(goal.id)}
                        >
                          {goal.text}
                        </p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingGoal(goal.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Редактировать"
                          >
                            <Edit2 size={14} className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteGoal(column.id, goal.id)}
                            className="p-1 hover:bg-red-50 rounded"
                            title="Удалить"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GoalsBoard
