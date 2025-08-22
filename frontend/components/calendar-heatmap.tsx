'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Transcription } from '@/lib/api'
import { Calendar } from 'lucide-react'

interface CalendarHeatmapProps {
  transcriptions: Transcription[]
}

export function CalendarHeatmap({ transcriptions }: CalendarHeatmapProps) {
  // Calculate the date range for the last 12 weeks (84 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 83) // 12 weeks - 1 day

  // Group transcriptions by date
  const transcriptionsByDate = transcriptions.reduce((acc, transcription) => {
    const date = new Date(transcription.created_at).toDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Generate array of dates for the last 12 weeks
  const dates = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Get max count for color intensity calculation
  const maxCount = Math.max(...Object.values(transcriptionsByDate), 1)

  // Generate weeks structure for grid layout
  const weeks: Date[][] = []
  let currentWeek: Date[] = []
  
  dates.forEach((date, index) => {
    if (index % 7 === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(date)
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30'
    const intensity = count / maxCount
    if (intensity <= 0.25) return 'bg-green-200 dark:bg-green-900/40'
    if (intensity <= 0.5) return 'bg-green-300 dark:bg-green-800/60'
    if (intensity <= 0.75) return 'bg-green-400 dark:bg-green-700/80'
    return 'bg-green-500 dark:bg-green-600'
  }

  const monthLabels = []
  const today = new Date()
  for (let i = 2; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }))
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recording Activity
        </CardTitle>
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Month labels */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            {monthLabels.map((month, index) => (
              <span key={index}>{month}</span>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((date) => {
                  const dateString = date.toDateString()
                  const count = transcriptionsByDate[dateString] || 0
                  return (
                    <div
                      key={dateString}
                      className={`w-3 h-3 rounded-sm ${getIntensityClass(count)} transition-colors hover:ring-2 hover:ring-ring hover:ring-offset-1`}
                      title={`${date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}: ${count} recording${count !== 1 ? 's' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {transcriptions.length} recordings in the last 12 weeks
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/60" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/80" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}