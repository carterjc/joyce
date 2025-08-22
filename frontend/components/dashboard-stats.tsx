'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, type Transcription } from '@/lib/api'
import { Calendar, Clock, FileText, TrendingUp } from 'lucide-react'
import useSWR from 'swr'

export function DashboardStats() {
  const { data: transcriptions = [], isLoading } = useSWR(
    'transcriptions',
    () => apiClient.getTranscriptions(),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = calculateStats(transcriptions)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Recordings
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalRecordings}</div>
          <p className="text-xs text-muted-foreground">
            Captured thoughts preserved
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Words
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.totalWords.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {stats.avgWordsPerRecording > 0 
              ? `Avg ${Math.round(stats.avgWordsPerRecording)} per recording`
              : 'Stream of consciousness'
            }
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.recentActivity}</div>
          <p className="text-xs text-muted-foreground">
            Past 7 days
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Latest Recording
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.latestRecording}</div>
          <p className="text-xs text-muted-foreground">
            {stats.latestRecordingName ? (
              <span className="truncate block max-w-full" title={stats.latestRecordingName}>
                {stats.latestRecordingName}
              </span>
            ) : (
              'Begin your first recording'
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function calculateStats(transcriptions: Transcription[]) {
  const totalRecordings = transcriptions.length
  
  if (totalRecordings === 0) {
    return {
      totalRecordings: 0,
      totalWords: 0,
      avgWordsPerRecording: 0,
      recentActivity: 0,
      latestRecording: 'None yet',
      latestRecordingName: null
    }
  }

  // Calculate total words across all transcriptions
  const totalWords = transcriptions.reduce((acc, t) => {
    const wordCount = t.text ? t.text.split(/\s+/).length : 0
    return acc + wordCount
  }, 0)

  const avgWordsPerRecording = totalWords / totalRecordings

  // Calculate recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const recentActivity = transcriptions.filter(t => {
    const createdDate = new Date(t.created_at)
    return createdDate >= sevenDaysAgo
  }).length

  // Find latest recording
  const sortedByDate = [...transcriptions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  
  const latest = sortedByDate[0]
  const now = new Date()
  const latestDate = new Date(latest.created_at)
  const timeDiff = now.getTime() - latestDate.getTime()
  
  let latestRecording: string
  if (timeDiff < 60000) { // Less than 1 minute
    latestRecording = 'Just now'
  } else if (timeDiff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(timeDiff / 60000)
    latestRecording = `${minutes}m ago`
  } else if (timeDiff < 86400000) { // Less than 1 day
    const hours = Math.floor(timeDiff / 3600000)
    latestRecording = `${hours}h ago`
  } else {
    const days = Math.floor(timeDiff / 86400000)
    latestRecording = `${days}d ago`
  }

  return {
    totalRecordings,
    totalWords,
    avgWordsPerRecording,
    recentActivity,
    latestRecording,
    latestRecordingName: latest.filename
  }
}