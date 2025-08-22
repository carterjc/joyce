'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiClient, type Transcription } from '@/lib/api'
import { Clock, Download, FileText } from 'lucide-react'
import { useState } from 'react'

interface RecordingTimelineProps {
  transcriptions: Transcription[]
}

export function RecordingTimeline({ transcriptions }: RecordingTimelineProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  
  // Sort transcriptions by date (most recent first) and take the last 10
  const recentTranscriptions = [...transcriptions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const timeDiff = now.getTime() - date.getTime()
    
    if (timeDiff < 60000) return 'Just now'
    if (timeDiff < 3600000) return `${Math.floor(timeDiff / 60000)}m ago`
    if (timeDiff < 86400000) return `${Math.floor(timeDiff / 3600000)}h ago`
    if (timeDiff < 604800000) return `${Math.floor(timeDiff / 86400000)}d ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getWordCount = (text: string) => {
    return text ? text.split(/\s+/).length : 0
  }

  const getWordCountBadgeVariant = (count: number) => {
    if (count < 50) return 'secondary'
    if (count < 200) return 'default'
    return 'default'
  }

  const handleDownload = async (transcriptionId: string) => {
    try {
      setDownloadingId(transcriptionId)
      await apiClient.downloadAudio(transcriptionId)
    } catch (error) {
      console.error('Download failed:', error)
      // You could add toast notifications here in the future
    } finally {
      setDownloadingId(null)
    }
  }

  if (recentTranscriptions.length === 0) {
    return (
      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent Recordings
          </CardTitle>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recordings yet</p>
            <p className="text-sm">Start your first recording to see the timeline</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Recordings
        </CardTitle>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTranscriptions.map((transcription, index) => {
            const wordCount = getWordCount(transcription.text)
            const isLatest = index === 0
            
            return (
              <div
                key={transcription.id}
                className={`relative flex gap-4 pb-4 ${
                  index !== recentTranscriptions.length - 1 ? 'border-b border-border/50' : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full mt-2 ${
                      isLatest 
                        ? 'bg-green-500 ring-4 ring-green-500/20' 
                        : 'bg-muted-foreground/40'
                    }`}
                  />
                  {index !== recentTranscriptions.length - 1 && (
                    <div className="absolute top-5 left-1/2 w-px h-full bg-border transform -translate-x-1/2" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {transcription.filename}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatRelativeTime(transcription.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant={getWordCountBadgeVariant(wordCount)}
                          className="text-xs"
                        >
                          {wordCount} words
                        </Badge>
                        <button
                          onClick={() => handleDownload(transcription.id)}
                          disabled={downloadingId === transcription.id}
                          className="p-1 rounded hover:bg-muted/50 transition-colors disabled:opacity-50"
                          title="Download original audio file"
                        >
                          <Download className={`h-3 w-3 text-muted-foreground ${
                            downloadingId === transcription.id ? 'animate-pulse' : ''
                          }`} />
                        </button>
                      </div>
                      {transcription.has_summary && (
                        <Badge variant="outline" className="text-xs">
                          Summarized
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview of transcription text */}
                  {transcription.text && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {transcription.text.substring(0, 120)}
                      {transcription.text.length > 120 ? '...' : ''}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
          
          {transcriptions.length > 10 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {recentTranscriptions.length} of {transcriptions.length} recordings
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}