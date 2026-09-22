"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

interface RecentSummariesCardProps {
  summaries: any[];
}

export function RecentSummariesCard({ summaries }: RecentSummariesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Recently Generated Summaries</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI-extracted insights, key points, and core concepts
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono">
          {summaries.length} items
        </Badge>
      </CardHeader>

      <CardContent>
        {summaries.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No AI summaries generated yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1 mb-3">
              Open any item in your library and click &quot;Generate AI Summary&quot; to populate your intelligence hub.
            </p>
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Browse Knowledge Library <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaries.map((item) => {
              const content = item.content;
              const keyPoints = Array.isArray(item.key_points) ? item.key_points : [];

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {item.model || "Gemini Flash"}
                      </Badge>
                      {content?.category && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${content.category.color}15`,
                            color: content.category.color || "currentColor",
                          }}
                        >
                          {content.category.name}
                        </span>
                      )}
                    </div>

                    <Link href={`/library/${content?.id || "#"}`}>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1">
                        {content?.title || "Knowledge Item"}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                      &quot;{item.summary}&quot;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{keyPoints.length} key points</span>
                    </div>

                    <Link
                      href={`/library/${content?.id}`}
                      className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                    >
                      <span>View Analysis</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
