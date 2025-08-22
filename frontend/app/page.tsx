'use client'

import { useState } from 'react'
import { UploadForm } from '@/components/upload-form'
import { TranscriptionsDataTable } from '@/components/transcriptions-data-table'
import { type Transcription } from '@/lib/api'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadSuccess = (_transcription: Transcription) => {
    // Trigger a refresh of the transcriptions list
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-accent/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e6e3d9%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 text-foreground">
              <span className="stream-text">Joyce</span>
            </h1>
            
            <div className="epigraph text-muted-foreground max-w-2xl mx-auto mb-8">
              &quot;Every life is in many days, day after day. We walk through ourselves, meeting robbers, ghosts, giants, old men, young men, wives, widows, brothers-in-love, but always meeting ourselves.&quot;
              <div className="text-sm mt-2 opacity-75">— James Joyce, Ulysses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <UploadForm onSuccess={handleUploadSuccess} />
            </div>
          </div>
          
          {/* Transcriptions Section */}
          <div className="lg:col-span-3">
            <TranscriptionsDataTable key={refreshKey} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8 mt-16">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground italic">
            &quot;What is that word known to all men?&quot;
          </p>
        </div>
      </footer>
    </div>
  )
}
