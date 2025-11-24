import React from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import DockMenu from '@/components/DockMenu'
import FinancesContent from '@/components/FinancesContent'

function FinancesPage() {
  console.log('FinancesPage rendered')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 p-4 md:p-8 pb-24">
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Финансы
            </CardTitle>
          </CardHeader>
        </Card>
        
        <FinancesContent />
      </div>
      <DockMenu />
    </div>
  )
}

export default FinancesPage
