import React, { useState, useEffect } from 'react'

function CountdownTimer() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0 })

  useEffect(() => {
    const targetDate = new Date('2025-02-10T00:00:00')
    
    const tick = () => {
      const now = Date.now()
      const target = targetDate.getTime()
      let diff = target - now

      if (diff < 0) {
        setTime({ d: 0, h: 0, m: 0 })
        return
      }

      // Конвертируем в миллисекунды
      const msPerDay = 24 * 60 * 60 * 1000
      const msPerHour = 60 * 60 * 1000
      const msPerMinute = 60 * 1000

      const d = Math.floor(diff / msPerDay)
      diff = diff % msPerDay
      
      const h = Math.floor(diff / msPerHour)
      diff = diff % msPerHour
      
      const m = Math.floor(diff / msPerMinute)

      setTime({ d, h, m })
    }

    tick() // Вызываем сразу
    const timer = setInterval(tick, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center justify-center gap-3 md:gap-4 text-5xl md:text-6xl font-bold">
      <span className="text-blue-600">
        {String(time.d).padStart(2, '0')}
      </span>
      <span className="text-gray-400">:</span>
      <span className="text-blue-600">
        {String(time.h).padStart(2, '0')}
      </span>
      <span className="text-gray-400">:</span>
      <span className="text-blue-600">
        {String(time.m).padStart(2, '0')}
      </span>
    </div>
  )
}

export default CountdownTimer