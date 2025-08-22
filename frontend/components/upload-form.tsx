'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, type Transcription } from '@/lib/api'

interface UploadFormProps {
  onSuccess?: (transcription: Transcription) => void
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file to begin the transcription')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const transcription = await apiClient.uploadAudio(file)
      setFile(null)
      if (onSuccess) {
        onSuccess(transcription)
      }
      // Reset file input
      const fileInput = document.getElementById('audio-file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The transcription encountered an unexpected difficulty')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="shadow-lg border-border bg-card">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold text-card-foreground">
          Voice to Consciousness
        </CardTitle>
        <CardDescription className="text-muted-foreground prose">
          Submit your spoken words to be transformed into written form. 
          We accept various audio formats: MP3, WAV, M4A, and others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="audio-file" className="block text-sm font-medium text-foreground">
            Select Audio Recording
          </label>
          <div className="relative">
            <input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border file:border-border
                file:text-sm file:font-medium
                file:bg-secondary file:text-secondary-foreground
                hover:file:bg-accent hover:file:text-accent-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                cursor-pointer transition-colors"
            />
          </div>
        </div>
        
        {file && (
          <div className="p-4 bg-accent/50 rounded-lg border border-border">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-accent-foreground">
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground ml-2">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm text-destructive font-medium">
              {error}
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {isUploading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              <span>Transcribing the spoken word...</span>
            </div>
          ) : (
            'Begin Transcription'
          )}
        </Button>
        
        {!file && !isUploading && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground italic">
              "The words we speak become the thoughts we preserve"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}