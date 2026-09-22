"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ContentCard } from "@/components/content/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ActivityOverviewCard } from "@/components/dashboard/ActivityOverviewCard";
import { RecentSummariesCard } from "@/components/dashboard/RecentSummariesCard";
import { getDashboardData, DashboardMetrics } from "@/lib/actions/dashboard";
import {
  Library,
  BookOpenCheck,
  Star,
  Plus,
  Youtube,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await getDashboardData();
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setMetrics(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Statistics cards layout array (all 9 real Supabase metrics)
  const statsList = [
    {
      title: "Total Content",
      value: metrics?.totalContent ?? 0,
      description: "Videos, recordings & articles",
      icon: Library,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50",
    },
    {
      title: "YouTube Content",
      value: metrics?.youtubeContent ?? 0,
      description: "Imported via video links",
      icon: Youtube,
      color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/50",
    },
    {
      title: "Uploaded Content",
      value: metrics?.uploadedContent ?? 0,
      description: "Personal audio & video files",
      icon: UploadCloud,
      color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-100 dark:border-sky-900/50",
    },
    {
      title: "Completed Content",
      value: metrics?.completedContent ?? 0,
      description: "Fully reviewed knowledge items",
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/50",
    },
    {
      title: "Needing Review",
      value: metrics?.contentNeedingReview ?? 0,
      description: "Items queued for active learning",
      icon: BookOpenCheck,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50",
    },
    {
      title: "Favorites",
      value: metrics?.favoritesCount ?? 0,
      description: "Starred priority knowledge",
      icon: Star,
      color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-100 dark:border-yellow-900/50",
    },
    {
      title: "Recently Added",
      value: metrics?.recentlyAddedCount ?? 0,
      description: "New items in last 30 days",
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border-violet-100 dark:border-violet-900/50",
    },
    {
      title: "Recently Viewed",
      value: metrics?.recentlyViewedCount ?? 0,
      description: "Interacted learning sessions",
      icon: Eye,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-900/50",
    },
    {
      title: "AI Summaries",
      value: metrics?.recentlyGeneratedSummariesCount ?? 0,
      description: "Generated intelligence summaries",
      icon: Sparkles,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-900/50",
    },
  ];

  if (isLoading) {
    return <LoadingState label="Loading intelligent dashboard & real-time analytics..." />;
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Dashboard Page Header */}
      <PageHeader
        title="Intelligent Dashboard"
        description="Real-time personal knowledge analytics, learning queues, and AI activity overviews."
        action={
          <div className="flex items-center gap-3">
            <Link href="/library/youtube">
              <Button icon={<Plus className="h-4 w-4" />}>Add New Content</Button>
            </Link>
          </div>
        }
      />

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
          Failed to load live metrics: {errorMsg}
        </div>
      )}

      {/* 9-Metric Statistics Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Real-Time Statistics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {statsList.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {stat.title}
                    </span>
                    <div className={`p-2 rounded-lg border ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {stat.value}
                    </span>
                    <span className="text-xs text-slate-400">items</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Ingestion Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Ingestion
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/library/youtube">
            <Card className="p-4 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900">
                  <Youtube className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">YouTube Video</h3>
                  <p className="text-xs text-slate-500">Save via video URL</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/library/upload">
            <Card className="p-4 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Audio / Video File</h3>
                  <p className="text-xs text-slate-500">Upload recording file</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/library/text">
            <Card className="p-4 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manual Note</h3>
                  <p className="text-xs text-slate-500">Add article or notes</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* SECTION 1: Continue Learning */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Continue Learning</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick up where you left off on in-progress items
              </p>
            </div>
          </div>
          <Link href="/library">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!metrics?.continueLearningItems || metrics.continueLearningItems.length === 0 ? (
            <EmptyState
              title="No active learning sessions"
              description="Start exploring items in your library to build active learning sessions here."
              action={
                <Link href="/library">
                  <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                    Explore Library
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.continueLearningItems.map((item) => (
                <ContentCard key={item.id} content={item} onRefresh={fetchDashboard} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: Needs Review */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Needs Review Queue</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Knowledge items flagged for active review & spaced repetition
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">{metrics?.contentNeedingReview ?? 0} queued</Badge>
            <Link href="/review">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                Go to Review
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!metrics?.needsReviewItems || metrics.needsReviewItems.length === 0 ? (
            <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <BookOpenCheck className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Your review queue is empty</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 mb-3">
                Flag knowledge items as &quot;Send to Review Queue&quot; to organize spaced repetition study sessions.
              </p>
              <Link href="/library">
                <Button size="sm" variant="outline">
                  Browse Items
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.needsReviewItems.map((item) => (
                <ContentCard key={item.id} content={item} onRefresh={fetchDashboard} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: Recently Added Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Recently Added</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Newest videos, recordings, and text notes imported into your library
              </p>
            </div>
          </div>
          <Link href="/library">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>
              View All Items
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!metrics?.recentlyAddedItems || metrics.recentlyAddedItems.length === 0 ? (
            <EmptyState
              title="No knowledge items saved yet"
              description="Import a YouTube video, upload a personal audio recording, or write notes to build your knowledge base."
              action={
                <Link href="/library/youtube">
                  <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                    Add Your First Item
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.recentlyAddedItems.map((item) => (
                <ContentCard key={item.id} content={item} onRefresh={fetchDashboard} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: Recently Generated AI Summaries */}
      <RecentSummariesCard summaries={metrics?.recentSummariesItems || []} />

      {/* SECTION 5: Learning Activity Overview */}
      {metrics?.activityOverview && <ActivityOverviewCard activity={metrics.activityOverview} />}
    </div>
  );
}
