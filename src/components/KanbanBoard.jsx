import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Edit2, Flag } from 'lucide-react'
import { tasksAPI } from '@/lib/api'

const COLUMNS = [
  { id: 'todo', title: 'Сделать' },
  { id: 'done', title: 'Сделано' },
  { id: 'not-done', title: 'Не сделано' },
]

const PRIORITIES = [
  { id: 'high', color: 'red', label: 'Высокий' },
  { id: 'medium', color: 'orange', label: 'Средний' },
  { id: 'low', color: 'green', label: 'Низкий' },
  { id: 'none', color: 'gray', label: 'Без приоритета' },
]

function KanbanBoard({ cellNumber }) {
  const [tasks, setTasks] = useState({ todo: [], done: [], 'not-done': [] })
  const [editingTask, setEditingTask] = useState(null)
  const [newTaskTexts, setNewTaskTexts] = useState({ todo: '', done: '', 'not-done': '' })
  const [draggedColumn, setDraggedColumn] = useState(null)

  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Загружаем задачи из API
  useEffect(() => {
    const loadTasks = async () => {
      setIsInitialLoad(true)
      try {
        const loadedTasks = await tasksAPI.get(cellNumber)
        setTasks({
          todo: loadedTasks.todo || [],
          done: loadedTasks.done || [],
          'not-done': loadedTasks['not-done'] || [],
        })
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setIsInitialLoad(false)
      }
    }
    loadTasks()
  }, [cellNumber])

  // Сохраняем задачи в API (с дебаунсом, только если это не начальная загрузка)
  useEffect(() => {
    if (isInitialLoad) return // Не сохраняем при первой загрузке
    
    const timer = setTimeout(async () => {
      try {
        await tasksAPI.save(cellNumber, tasks)
        console.log('✅ Tasks saved successfully')
      } catch (error) {
        console.error('❌ Error saving tasks:', error)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [tasks, cellNumber, isInitialLoad])

  const addTask = async (columnId) => {
    const text = newTaskTexts[columnId]
    if (!text?.trim()) return

    const newTask = {
      id: Date.now().toString(),
      text: text.trim(),
      priority: 'none',
    }

    const updatedTasks = {
      ...tasks,
      [columnId]: [...tasks[columnId], newTask],
    }

    setTasks(updatedTasks)
    setNewTaskTexts((prev) => ({
      ...prev,
      [columnId]: '',
    }))

    // Немедленно сохраняем
    try {
      await tasksAPI.save(cellNumber, updatedTasks)
      console.log('✅ Task added and saved')
    } catch (error) {
      console.error('❌ Error saving task:', error)
    }
  }

  const deleteTask = async (columnId, taskId) => {
    const updatedTasks = {
      ...tasks,
      [columnId]: tasks[columnId].filter((task) => task.id !== taskId),
    }

    setTasks(updatedTasks)

    // Немедленно сохраняем
    try {
      await tasksAPI.save(cellNumber, updatedTasks)
      console.log('✅ Task deleted and saved')
    } catch (error) {
      console.error('❌ Error saving deletion:', error)
    }
  }

  const updateTaskText = async (columnId, taskId, newText) => {
    const updatedTasks = {
      ...tasks,
      [columnId]: tasks[columnId].map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      ),
    }

    setTasks(updatedTasks)
    setEditingTask(null)

    // Немедленно сохраняем
    try {
      await tasksAPI.save(cellNumber, updatedTasks)
      console.log('✅ Task updated and saved')
    } catch (error) {
      console.error('❌ Error saving update:', error)
    }
  }

  const togglePriority = async (columnId, taskId) => {
    const updatedTasks = {
      ...tasks,
      [columnId]: tasks[columnId].map((task) => {
        if (task.id !== taskId) return task
        
        const currentPriority = task.priority || 'none'
        const priorityIndex = PRIORITIES.findIndex((p) => p.id === currentPriority)
        const nextPriority = PRIORITIES[(priorityIndex + 1) % PRIORITIES.length]
        
        return { ...task, priority: nextPriority.id }
      }),
    }

    setTasks(updatedTasks)

    // Немедленно сохраняем
    try {
      await tasksAPI.save(cellNumber, updatedTasks)
      console.log('✅ Priority updated and saved')
    } catch (error) {
      console.error('❌ Error saving priority:', error)
    }
  }

  const moveTask = async (fromColumn, toColumn, taskId) => {
    const task = tasks[fromColumn].find((t) => t.id === taskId)
    if (!task) return

    const updatedTasks = {
      ...tasks,
      [fromColumn]: tasks[fromColumn].filter((t) => t.id !== taskId),
      [toColumn]: [...tasks[toColumn], task],
    }

    setTasks(updatedTasks)

    // Немедленно сохраняем
    try {
      await tasksAPI.save(cellNumber, updatedTasks)
      console.log('✅ Task moved and saved')
    } catch (error) {
      console.error('❌ Error saving move:', error)
    }
  }

  const getPriorityColor = (priority) => {
    const priorityObj = PRIORITIES.find((p) => p.id === priority) || PRIORITIES[3]
    return priorityObj.color
  }

  const getPriorityClass = (priority) => {
    const color = getPriorityColor(priority)
    const colorClasses = {
      red: 'text-red-500 fill-red-500',
      orange: 'text-orange-500 fill-orange-500',
      green: 'text-green-500 fill-green-500',
      gray: 'text-gray-400 fill-gray-400',
    }
    return colorClasses[color] || colorClasses.gray
  }

  // Вычисляем прогресс
  const totalTasks = tasks.todo.length + tasks.done.length + tasks['not-done'].length
  const completedTasks = tasks.done.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Прогресс-бар */}
      {totalTasks > 0 && (
        <Card className="bg-white/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">
                  Выполнено: {completedTasks} из {totalTasks}
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

      {/* Колонки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  const taskId = e.dataTransfer.getData('taskId')
                  const fromColumn = e.dataTransfer.getData('fromColumn')
                  if (fromColumn && fromColumn !== column.id) {
                    moveTask(fromColumn, column.id, taskId)
                  }
                  setDraggedColumn(null)
                }}
              >
                {tasks[column.id]?.map((task) => (
                  <Card
                    key={task.id}
                    className={`p-3 bg-white shadow-sm hover:shadow-md transition-shadow cursor-move ${
                      draggedColumn === column.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', task.id)
                      e.dataTransfer.setData('fromColumn', column.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => togglePriority(column.id, task.id)}
                        className="mt-1 flex-shrink-0"
                        title={`Приоритет: ${PRIORITIES.find((p) => p.id === task.priority)?.label || 'Без приоритета'}`}
                      >
                        <Flag
                          size={16}
                          className={getPriorityClass(task.priority)}
                        />
                      </button>
                      
                      {editingTask === task.id ? (
                        <input
                          type="text"
                          defaultValue={task.text}
                          onBlur={(e) => updateTaskText(column.id, task.id, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateTaskText(column.id, task.id, e.target.value)
                            }
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p
                          className="flex-1 text-sm cursor-pointer"
                          onClick={() => setEditingTask(task.id)}
                        >
                          {task.text}
                        </p>
                      )}
                      
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingTask(task.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Редактировать"
                        >
                          <Edit2 size={14} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => deleteTask(column.id, task.id)}
                          className="p-1 hover:bg-red-50 rounded"
                          title="Удалить"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Поле ввода новой задачи только для колонки "Сделать" */}
                {column.id === 'todo' && (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTaskTexts[column.id]}
                        onChange={(e) => setNewTaskTexts((prev) => ({
                          ...prev,
                          [column.id]: e.target.value,
                        }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTask(column.id)
                          }
                        }}
                        placeholder="Добавить задачу..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => addTask(column.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KanbanBoard
