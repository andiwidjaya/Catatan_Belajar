"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Clock, Flame, BookOpen, Sparkles, MessageSquare, StickyNote, Eye } from "lucide-react";

interface ActivityOverviewCardProps {
  activity: {
    totalActivities: number;
    totalDurationMinutes: number;
    activityBreakdown: Record<string, number>;
    recentLogs: any[];
  };
}

export function ActivityOverviewCard({ activity }: ActivityOverviewCardProps) {
  const { totalActivities, totalDurationMinutes, activityBreakdown, recentLogs } = activity;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "summarize":
        return <Sparkles className="h-3.5 w-3.5 text-indigo-500" />;
      case "chat":
        return <MessageSquare className="h-3.5 w-3.5 text-sky-500" />;
      case "note":
        return <StickyNote className="h-3.5 w-3.5 text-amber-500" />;
      case "review":
        return <BookOpen className="h-3.5 w-3.5 text-emerald-500" />;
      default:
        return <Eye className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "summarize":
        return "AI Summaries";
      case "chat":
        return "AI Chats";
      case "note":
        return "Notes Added";
      case "review":
        return "Reviews Completed";
      case "view":
        return "Items Viewed";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Learning Activity Overview</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent interaction summary and logged learning events
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1 font-mono">
          <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          {totalActivities} events logged
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Metric summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400">Total Events</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalActivities}</p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400">Time Spent</span>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-indigo-500" />
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalDurationMinutes}m</p>
            </div>
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400">Activity Types</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Object.keys(activityBreakdown).length}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold text-slate-400">Status</span>
            <Badge variant="success" className="mt-1">Active</Badge>
          </div>
        </div>

        {/* Activity Breakdown Pills */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Activity Breakdown
          </h4>
          {Object.keys(activityBreakdown).length === 0 ? (
            <p className="text-xs text-slate-400 italic">No activity recorded yet. Browse content to generate logs.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(activityBreakdown).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {getActivityIcon(type)}
                  <span>{getActivityLabel(type)}</span>
                  <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-[10px]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Timeline Feed */}
        {recentLogs.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Recent Learning Timeline
            </h4>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {recentLogs.slice(0, 5).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">
                      {getActivityIcon(log.activity_type)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {log.content?.title || "Knowledge Activity"}
                      </p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {getActivityLabel(log.activity_type)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
