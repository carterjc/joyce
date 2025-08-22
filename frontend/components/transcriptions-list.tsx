'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, type Transcription } from '@/lib/api'

export function TranscriptionsList() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTranscriptions()
  }, [])

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getTranscriptions()
      setTranscriptions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcriptions')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transcriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading transcriptions...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transcriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
          <Button onClick={loadTranscriptions} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-border bg-card">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold text-card-foreground">
          Interior Monologues
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {transcriptions.length === 0 
            ? 'No captured thoughts yet. Begin with your first recording to populate this consciousness.'
            : `${transcriptions.length} recorded thought${transcriptions.length === 1 ? '' : 's'} preserved`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transcriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-muted-foreground rounded-full border-dashed"></div>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Your transcribed thoughts will appear here
                </p>
                <p className="text-xs text-muted-foreground italic">
                  &quot;Stream of consciousness flows into written word&quot;
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {transcriptions.map((transcription) => (
              <div
                key={transcription.id}
                className="group border border-border rounded-lg p-6 hover:bg-accent/50 hover:border-accent transition-all duration-200 bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground truncate max-w-xs">
                    {transcription.filename}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {formatDate(transcription.created_at)}
                  </span>
                </div>
                
                <div className="monologue mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {transcription.text ? 
                      transcription.text.substring(0, 180) + (transcription.text.length > 180 ? '...' : '')
                      : (
                        <span className="italic">
                          Processing the stream of consciousness...
                        </span>
                      )
                    }
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Link href={`/transcription/${transcription.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Explore Thought
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="text-xs"
                    onClick={() => navigator.clipboard.writeText(transcription.text)}
                  >
                    Preserve Text
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}