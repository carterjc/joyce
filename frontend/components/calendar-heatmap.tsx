"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Transcription } from "@/lib/api";
import { Calendar } from "lucide-react";

interface CalendarHeatmapProps {
  transcriptions: Omit<Transcription, "has_summary">[];
}

function toUTCDate(d: Date) {
  // strip time -> 00:00:00 UTC
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function ymd(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 0) {
  // 0 = Sunday, 1 = Monday
  const d = toUTCDate(date);
  const day = d.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function CalendarHeatmap({ transcriptions }: CalendarHeatmapProps) {
  // Build a count map using UTC day keys to avoid timezone drift
  const countsByDay: Record<string, number> = {};
  for (const t of transcriptions) {
    const d = new Date(t.created_at); // can be ISO or Date-compatible
    const key = ymd(toUTCDate(d));
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  }

  // Define 12 full weeks ending on the current week
  const todayUTC = toUTCDate(new Date());
  const endOfCurrentWeek = addDays(startOfWeek(todayUTC, 0), 6); // Saturday
  const startOfRange = addDays(endOfCurrentWeek, -7 * 12 + 1); // 12 weeks inclusive

  // Generate columns by week (each column is 7 days, Sun->Sat)
  const weeks: Date[][] = [];
  for (let colStart = startOfRange; colStart <= endOfCurrentWeek; colStart = addDays(colStart, 7)) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(addDays(colStart, i));
    }
    weeks.push(week);
  }

  // Compute max count for intensity scale (min 1 to avoid divide-by-zero)
  const maxCount = Math.max(...Object.values(countsByDay), 1);

  const getIntensityClass = (count: number) => {
    if (count === 0) {
      // was: bg-muted/30 (too dark to see)
      return "bg-muted/50 dark:bg-zinc-800/70";
    }
    const intensity = count / maxCount;
    if (intensity <= 0.25) return "bg-green-200 dark:bg-green-900/40";
    if (intensity <= 0.5) return "bg-green-300 dark:bg-green-800/60";
    if (intensity <= 0.75) return "bg-green-400 dark:bg-green-700/80";
    return "bg-green-500 dark:bg-green-600";
  };

  // Month labels: show label above the first week that contains a 1st of the month
  const monthLabels = weeks.map((week, i) => {
    const hasFirstOfMonth = week.some(d => d.getUTCDate() === 1);
    if (i === 0 || hasFirstOfMonth) {
      const labelDate = hasFirstOfMonth ? week.find(d => d.getUTCDate() === 1)! : week[0];
      return labelDate.toLocaleDateString("en-US", { month: "short" });
    }
    return "";
  });

  // Day labels on the left (Sun/Tue/Thu for light hinting)
  const dayLabels = ["Sun", "", "Tue", "", "Thu", "", ""]; // 7 rows

  return (
    <Card className="shadow-sm border-border h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Recording Activity</CardTitle>
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Month labels aligned with week columns */}
          <div className="flex gap-1 overflow-x-auto px-1">
            {/* left gutter for day labels */}
            <div className="w-6 shrink-0" />
            {monthLabels.map((label, i) => (
              <div key={`m-${i}`} className="w-3 shrink-0 text-[10px] text-muted-foreground text-center">
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1 overflow-x-auto">
            {/* Day labels gutter */}
            <div className="flex flex-col gap-1 w-6 shrink-0">
              {dayLabels.map((dl, i) => (
                <div key={`dl-${i}`} className="h-3 text-[10px] leading-3 text-muted-foreground">
                  {dl}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1 shrink-0">
                {week.map(date => {
                  const key = ymd(date);
                  const count = countsByDay[key] || 0;
                  const title = `${date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}: ${count} recording${count !== 1 ? "s" : ""}`;

                  return (
                    <div
                      key={key}
                      className={`w-3.5 h-3.5 rounded-[3px] ${getIntensityClass(
                        count,
                      )} outline outline-border/25 transition-colors hover:ring-2 hover:ring-ring hover:ring-offset-1`}
                      title={title}
                      role="img"
                      aria-label={title}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {transcriptions.length} recordings in the last 12 weeks
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/30" />
                <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/40" />
                <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/60" />
                <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/80" />
                <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
