'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
      setError('Please select an audio file')
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
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <label htmlFor="audio-file" className="block text-sm font-medium">
          Audio File
        </label>
        <input
          id="audio-file"
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border file:border-border
            file:text-sm file:font-medium
            file:bg-secondary file:text-secondary-foreground
            hover:file:bg-accent hover:file:text-accent-foreground
            cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">
          Supports MP3, WAV, M4A and other audio formats
        </p>
      </div>
      
      {file && (
        <div className="p-3 bg-muted rounded-md">
          <div className="text-sm">
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground ml-2">
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        </div>
      )}

      <Button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
            <span>Transcribing...</span>
          </div>
        ) : (
          'Upload & Transcribe'
        )}
      </Button>
    </div>
  )
}