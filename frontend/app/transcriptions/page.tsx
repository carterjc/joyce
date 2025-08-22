'use client'

import { AppLayout } from '@/components/app-layout'
import { TranscriptionsDataTable } from '@/components/transcriptions-data-table'

export default function TranscriptionsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Transcriptions
          </h1>
        </div>
        <TranscriptionsDataTable />
      </div>
    </AppLayout>
  )
}