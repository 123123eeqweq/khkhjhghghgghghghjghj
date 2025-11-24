import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Target, Wallet } from 'lucide-react'

const menuItems = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/finances', icon: Wallet, label: 'Финансы' },
  { path: '/goals', icon: Target, label: 'Цели' },
]

function DockMenu() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={(e) => {
                e.preventDefault()
                console.log('Navigating to:', item.path)
                navigate(item.path)
              }}
              className={`relative p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
              title={item.label}
            >
              <Icon size={24} />
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DockMenu
