"use client";

import { AppLayout } from "@/components/app-layout";
import { UploadForm } from "@/components/upload-form";
import { type Transcription } from "@/lib/api";
import { useState } from "react";

export default function UploadPage() {
  const [lastUpload, setLastUpload] = useState<Transcription | null>(null);

  const handleUploadSuccess = (transcription: Transcription) => {
    setLastUpload(transcription);
    // Optionally redirect to the new transcription
    // router.push(`/transcription/${transcription.id}`)
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="epigraph text-muted-foreground max-w-2xl mx-auto">
            &ldquo;Speech is civilization itself. The word, even the most contradictory word, preserves contact—it is
            silence which isolates.&rdquo;
            <div className="text-sm mt-2 opacity-75">— Thomas Mann</div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="max-w-2xl mx-auto">
          <UploadForm onSuccess={handleUploadSuccess} />
        </div>

        {/* Last Upload Success */}
        {lastUpload && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="p-4 bg-accent/20 border border-accent rounded-lg">
              <h3 className="font-semibold text-accent-foreground mb-2">Transcription Complete</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your voice has been captured and transformed into written consciousness.
              </p>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">{lastUpload.filename}</span>
                <a href={`/transcription/${lastUpload.id}`} className="text-sm text-primary hover:underline">
                  Explore the interior voice →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
