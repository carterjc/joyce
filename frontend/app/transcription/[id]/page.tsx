'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, type Transcription, type Summary } from '@/lib/api'

export default function TranscriptionPage() {
  const params = useParams()
  const router = useRouter()
  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const transcriptionId = params.id as string

  useEffect(() => {
    if (transcriptionId) {
      loadTranscription()
    }
  }, [transcriptionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTranscription = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getTranscription(transcriptionId)
      setTranscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (!transcription) return

    try {
      setIsSummarizing(true)
      const summaryData = await apiClient.summarizeTranscription(transcription.id)
      setSummary(summaryData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleCopyText = () => {
    if (transcription?.text) {
      navigator.clipboard.writeText(transcription.text)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading transcription...</div>
        </div>
      </div>
    )
  }

  if (error || !transcription) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">
              {error || 'Transcription not found'}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/')}>
                Back to Home
              </Button>
              {error && (
                <Button onClick={loadTranscription} variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto p-6 max-w-4xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              ← Return to the Stream
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {transcription.filename}
                </h1>
                <p className="text-muted-foreground">
                  Recorded on {formatDate(transcription.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleCopyText} variant="outline">
                Copy Text
              </Button>
              <Button 
                onClick={handleSummarize} 
                disabled={isSummarizing}
                variant="secondary"
              >
                {isSummarizing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                    <span>Summarizing...</span>
                  </div>
                ) : (
                  'Summarize'
                )}
              </Button>
            </div>
          </div>

          {/* Main Transcription */}
          <Card className="shadow-lg border-border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                The Interior Voice
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Stream of consciousness captured and preserved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="bg-muted/30 p-6 rounded-lg border-l-4 border-primary">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap font-serif text-base">
                    {transcription.text || (
                      <span className="italic text-muted-foreground">
                        The transcription remains unspoken, awaiting its voice...
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {summary && (
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  Distilled Thought
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Essential meaning extracted on {formatDate(summary.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-accent/30 p-6 rounded-lg border-l-4 border-accent">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap font-serif text-base">
                      {summary.text}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Literary Footer */}
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground italic">
              &quot;The conscious mind may be compared to a fountain playing in the sun and falling back into the great subterranean pool of subconscious from which it rises.&quot;
            </p>
            <p className="text-xs text-muted-foreground mt-2">— Sigmund Freud</p>
          </div>
        </div>
      </div>
    </div>
  )
}