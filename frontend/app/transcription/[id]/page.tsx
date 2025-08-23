"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, TranscriptionSegment } from "@/lib/api";
import { Download, Pause, Play } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

export default function TranscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const transcriptionId = params.id as string;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    data: transcription,
    isLoading,
    error,
    mutate: retryLoadTranscription,
  } = useSWR(
    transcriptionId ? `transcription-${transcriptionId}` : null,
    () => apiClient.getTranscription(transcriptionId),
    { revalidateOnFocus: false },
  );

  const [canFetchSummary, setCanFetchSummary] = useState(false);
  const {
    data: summary,
    mutate: generateSummary,
    isValidating: isSummarizing,
  } = useSWR(
    canFetchSummary || transcription?.has_summary ? `summary-${transcriptionId}` : null, // auto-fetch summary if has_summary is True (cached)
    () => apiClient.summarizeTranscription(transcriptionId),
    { revalidateOnFocus: false },
  );

  const handleSummarize = () => {
    if (transcription) {
      setCanFetchSummary(true);
      generateSummary();
    }
  };

  const handleCopyText = () => {
    if (transcription?.text) {
      navigator.clipboard.writeText(transcription.text);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSegmentClick = (segment: TranscriptionSegment) => {
    if (audioRef.current) {
      audioRef.current.currentTime = segment.start;
      setActiveSegment(segment.id);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDownloadAudio = async () => {
    try {
      await apiClient.downloadAudio(transcriptionId);
    } catch (error) {
      console.error("Failed to download audio:", error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !transcription?.segments) return;

    const updateCurrentTime = () => {
      setCurrentTime(audio.currentTime);

      const currentSegment = transcription.segments.find(
        segment => audio.currentTime >= segment.start && audio.currentTime <= segment.end,
      );

      if (currentSegment && currentSegment.id !== activeSegment) {
        setActiveSegment(currentSegment.id);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setActiveSegment(null);
    };

    audio.addEventListener("timeupdate", updateCurrentTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateCurrentTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [transcription?.segments, activeSegment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading transcription...</div>
        </div>
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{error || "Transcription not found"}</div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/")}>Back to Home</Button>
              {error && (
                <Button onClick={() => retryLoadTranscription()} variant="outline">
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log(transcription.has_summary);
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{transcription.filename}</h1>
                <p className="text-muted-foreground">Recorded on {formatDate(transcription.created_at)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                <Button onClick={handlePlayPause} variant="outline" size="sm" className="h-8 px-3">
                  {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={handleDownloadAudio} variant="outline" size="sm" className="h-8 px-3">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button onClick={handleCopyText} variant="outline" size="sm" className="h-8 px-3">
                  Copy Text
                </Button>
              </div>
              <div className="h-4 w-px bg-border" />
              <Button
                onClick={handleSummarize}
                disabled={isSummarizing}
                variant={transcription.has_summary ? "default" : "secondary"}
                size="sm"
                className="h-8 px-3"
              >
                {isSummarizing ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
                    <span>Summarizing...</span>
                  </div>
                ) : transcription.has_summary ? (
                  "View Summary"
                ) : (
                  "Summarize"
                )}
              </Button>
            </div>

            <div className="flex items-center gap-6 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{formatTime(transcription.duration)}</span> duration
              </div>
              <div className="h-4 w-px bg-border/50" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{transcription.words.toLocaleString()}</span> words
              </div>
              {transcription.segments?.length && (
                <>
                  <div className="h-4 w-px bg-border/50" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{transcription.segments.length}</span> segments
                  </div>
                </>
              )}
              <div className="flex-1" />
              {currentTime > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-muted h-1.5 rounded-full">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${(currentTime / transcription.duration) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{formatTime(currentTime)}</div>
                </div>
              )}
            </div>
          </div>

          <audio
            ref={audioRef}
            src={`${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
            }/transcriptions/${transcriptionId}/download`}
            preload="metadata"
          />

          {/* Segments Timeline */}
          {transcription.segments && transcription.segments.length > 0 && (
            <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Interactive Transcript
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Click any segment to jump to that moment in the audio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-y-auto space-y-1 pr-2">
                  {transcription.segments.map(segment => (
                    <div
                      key={segment.id}
                      onClick={() => handleSegmentClick(segment)}
                      className={`group cursor-pointer p-3 rounded-md transition-all duration-200 hover:bg-muted/70 hover:shadow-sm ${
                        activeSegment === segment.id
                          ? "bg-primary/15 border border-primary/30 shadow-sm ring-1 ring-primary/20"
                          : "bg-muted/20 border border-transparent hover:border-border/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`text-xs font-mono px-2 py-1 rounded-md shrink-0 transition-colors ${
                            activeSegment === segment.id
                              ? "bg-primary/20 text-primary font-medium"
                              : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                          }`}
                        >
                          {formatTime(segment.start)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed text-foreground">{segment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Transcription */}
          <Card className="shadow-lg border-border/50 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                The Interior Voice
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Stream of consciousness captured and preserved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg max-w-none">
                <div className="bg-gradient-to-br from-muted/40 to-muted/20 p-6 rounded-xl border border-border/30 backdrop-blur-sm">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap font-serif text-base selection:bg-primary/20">
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
            <Card className="shadow-lg border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-accent to-accent/50 rounded-full" />
                  Distilled Thought
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Essential meaning extracted on {formatDate(summary.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-gradient-to-br from-accent/20 to-accent/10 p-6 rounded-xl border border-accent/20 backdrop-blur-sm">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap font-serif text-base selection:bg-accent/30">
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
              &quot;The conscious mind may be compared to a fountain playing in the sun and falling back into the great
              subterranean pool of subconscious from which it rises.&quot;
            </p>
            <p className="text-xs text-muted-foreground mt-2">— Sigmund Freud</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
