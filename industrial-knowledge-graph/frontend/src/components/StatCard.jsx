import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, trend }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value) || 0
    if (end === 0) {
      setDisplayValue(value)
      return
    }

    const duration = 1000
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  return (
    <div className="card p-6 glass hover:shadow-lg hover:shadow-[var(--accent-primary)]/5 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{displayValue}</h3>
          
          {subtitle && (
            <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
          )}
          
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{Math.abs(trend)}% from last week</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`p-4 rounded-xl border ${colorStyles[color]}`}>
            <Icon className="w-8 h-8" />
          </div>
        )}
      </div>
    </div>
  )
}
