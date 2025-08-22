"use client";

import { AppLayout } from "@/components/app-layout";
import { CalendarHeatmap } from "@/components/calendar-heatmap";
import { DashboardStats } from "@/components/dashboard-stats";
import { RecordingTimeline } from "@/components/recording-timeline";
import { apiClient } from "@/lib/api";
import useSWR from "swr";
import { Quote } from "../components/quote";

export default function Home() {
  const { data: transcriptions = [] } = useSWR("transcriptions", () => apiClient.getTranscriptions(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-accent/20 border-b border-border">
        <div className="relative container mx-auto px-6 pt-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-foreground">Joyce</h1>
            <Quote slug="portia-desc" size="large" />
          </div>
        </div>
        {/* Statistics Section */}
        <div className="container mx-auto px-6 pb-4">
          <DashboardStats />
        </div>

        {/* Analytics Section */}
        <div className="container mx-auto px-6 pb-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <CalendarHeatmap transcriptions={transcriptions} />
            <RecordingTimeline transcriptions={transcriptions} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
