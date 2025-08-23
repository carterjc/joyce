"use client";

import { AppLayout } from "@/components/app-layout";
import { UploadForm } from "@/components/upload-form";
import { type Transcription } from "@/lib/api";
import { useState } from "react";

export default function UploadPage() {
  const [lastUpload, setLastUpload] = useState<Transcription | null>(null);

  const handleUploadSuccess = (transcription: Transcription) => {
    setLastUpload(transcription);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Upload Recording</h1>
            <p className="text-sm text-muted-foreground mt-1">Upload an audio file to generate a transcription</p>
          </div>

          {/* Upload Form */}
          <UploadForm onSuccess={handleUploadSuccess} />

          {/* Success Message */}
          {lastUpload && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">Upload Successful</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                Your file has been transcribed successfully.
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-700 dark:text-green-300">{lastUpload.filename}</span>
                <a href={`/transcription/${lastUpload.id}`} className="text-sm text-green-800 dark:text-green-200 hover:underline font-medium">
                  View transcription →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
