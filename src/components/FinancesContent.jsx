import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { financesAPI } from '@/lib/api'

const MONTHS = [
  { id: 'october', name: 'Октябрь', key: '2024-10' },
  { id: 'november', name: 'Ноябрь', key: '2024-11' },
  { id: 'december', name: 'Декабрь', key: '2024-12' },
  { id: 'january', name: 'Январь', key: '2025-01' },
]

const MAX_CAPITAL = 100000

function FinancesContent() {
  const [capital, setCapital] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].key)
  const [expenses, setExpenses] = useState({})
  const [newExpenseDescription, setNewExpenseDescription] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [editingExpense, setEditingExpense] = useState(null)

  // Загружаем данные из API
  useEffect(() => {
    const loadFinances = async () => {
      const finances = await financesAPI.get()
      setCapital(finances.capital || 0)
      setExpenses(finances.expenses || {})
    }
    loadFinances()
  }, [])

  // Сохраняем финансы в API (с дебаунсом)
  useEffect(() => {
    const timer = setTimeout(() => {
      financesAPI.save({ capital, expenses })
    }, 500)
    return () => clearTimeout(timer)
  }, [capital, expenses])

  const currentMonthExpenses = expenses[selectedMonth] || []
  const totalMonthExpenses = currentMonthExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)

  const addExpense = () => {
    const amount = parseFloat(newExpenseAmount)
    const description = newExpenseDescription.trim()

    if (!description || isNaN(amount) || amount <= 0) return

    const newExpense = {
      id: Date.now().toString(),
      description,
      amount,
      date: new Date().toISOString(),
    }

    setExpenses((prev) => ({
      ...prev,
      [selectedMonth]: [...(prev[selectedMonth] || []), newExpense],
    }))

    setNewExpenseDescription('')
    setNewExpenseAmount('')
  }

  const deleteExpense = (expenseId) => {
    setExpenses((prev) => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).filter((exp) => exp.id !== expenseId),
    }))
  }

  const updateExpense = (expenseId, newDescription, newAmount) => {
    setExpenses((prev) => ({
      ...prev,
      [selectedMonth]: (prev[selectedMonth] || []).map((exp) =>
        exp.id === expenseId
          ? { ...exp, description: newDescription, amount: parseFloat(newAmount) || exp.amount }
          : exp
      ),
    }))
    setEditingExpense(null)
  }

  const capitalPercentage = Math.min((capital / MAX_CAPITAL) * 100, 100)

  return (
    <div className="space-y-6">
      {/* Прогресс-бар капитала */}
      <Card className="bg-white/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Капитал</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {capital.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} / {MAX_CAPITAL.toLocaleString('ru-RU')}
            </span>
            <span className="text-gray-600 font-semibold">
              {capitalPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${capitalPercentage}%` }}
            ></div>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Math.max(0, Math.min(MAX_CAPITAL, parseFloat(e.target.value) || 0)))}
              placeholder="Введите капитал"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Переключатель месяцев */}
      <Card className="bg-white/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Месяцы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MONTHS.map((month) => (
              <button
                key={month.key}
                onClick={() => setSelectedMonth(month.key)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedMonth === month.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {month.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Карточка с суммой трат за месяц */}
      <Card className="bg-white/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Траты за {MONTHS.find((m) => m.key === selectedMonth)?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            ${totalMonthExpenses.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
          </div>
        </CardContent>
      </Card>

      {/* Список трат */}
      <Card className="bg-white/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Траты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Форма добавления траты */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newExpenseDescription}
              onChange={(e) => setNewExpenseDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExpense()}
              placeholder="Что купил..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newExpenseAmount}
              onChange={(e) => setNewExpenseAmount(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExpense()}
              placeholder="Сумма"
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addExpense}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Добавить
            </button>
          </div>

          {/* Список трат */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentMonthExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Нет трат за этот месяц</p>
            ) : (
              currentMonthExpenses.map((expense) => (
                <Card
                  key={expense.id}
                  className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  {editingExpense === expense.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        defaultValue={expense.description}
                        onBlur={(e) => updateExpense(expense.id, e.target.value, expense.amount)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateExpense(expense.id, e.target.value, expense.amount)
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        defaultValue={expense.amount}
                        onBlur={(e) => updateExpense(expense.id, expense.description, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateExpense(expense.id, expense.description, e.target.value)
                          }
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">{expense.description}</p>
                        <p className="text-gray-500 text-sm">
                          {new Date(expense.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-blue-600">
                          ${expense.amount.toLocaleString('ru-RU')}
                        </span>
                        <button
                          onClick={() => setEditingExpense(expense.id)}
                          className="p-2 hover:bg-gray-100 rounded"
                          title="Редактировать"
                        >
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 hover:bg-red-50 rounded"
                          title="Удалить"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinancesContent
