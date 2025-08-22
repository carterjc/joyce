'use client'

import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'

export default function TranscriptionPage() {
  const params = useParams()
  const router = useRouter()
  const transcriptionId = params.id as string

  const { data: transcription, isLoading, error, mutate: retryLoadTranscription } = useSWR(
    transcriptionId ? `transcription-${transcriptionId}` : null,
    () => apiClient.getTranscription(transcriptionId),
    { revalidateOnFocus: false }
  )

  const { data: summary, mutate: generateSummary, isValidating: isSummarizing } = useSWR(
    transcription?.has_summary ? `summary-${transcriptionId}` : null, // auto-fetch summary if has_summary is True (cached)
    () => apiClient.summarizeTranscription(transcriptionId),
    { revalidateOnFocus: false }
  )

  const handleSummarize = () => {
    if (transcription) generateSummary()
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
                <Button onClick={() => retryLoadTranscription()} variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log(transcription.has_summary)
  return (
    <AppLayout>
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
                disabled={isSummarizing || transcription.has_summary}
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
    </AppLayout>
  )
}