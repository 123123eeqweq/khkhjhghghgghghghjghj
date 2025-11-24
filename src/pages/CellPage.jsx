import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import KanbanBoard from '@/components/KanbanBoard'
import DockMenu from '@/components/DockMenu'

function CellPage() {
  const { cellNumber } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4 md:p-8 pb-24">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 mb-4 text-left"
            >
              ← Назад
            </button>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              День {cellNumber}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <KanbanBoard cellNumber={cellNumber} />
      </div>
      <DockMenu />
    </div>
  )
}

export default CellPage
