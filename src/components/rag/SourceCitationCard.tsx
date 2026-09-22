"use client";

import Link from "next/link";
import { BookOpen, Clock, FileText, Sparkles } from "lucide-react";

export interface SourceCitationProps {
  source: {
    contentId: string;
    contentTitle: string;
    sourceType: string;
    startTime: number | null;
    endTime: number | null;
    snippet: string;
    similarity: number;
  };
}

export function SourceCitationCard({ source }: SourceCitationProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const targetUrl =
    source.startTime !== null && source.startTime !== undefined
      ? `/library/${source.contentId}?t=${Math.floor(source.startTime)}`
      : `/library/${source.contentId}`;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "transcript":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "summary":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "note":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <Link
      href={targetUrl}
      className="group block rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-lg"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <BookOpen className="h-4 w-4 shrink-0 text-cyan-400" />
          <span className="truncate text-xs font-semibold text-slate-200 group-hover:text-cyan-400">
            {source.contentTitle}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${getBadgeColor(
            source.sourceType
          )}`}
        >
          {source.sourceType}
        </span>
      </div>

      <p className="mb-2.5 line-clamp-2 text-xs italic text-slate-400 group-hover:text-slate-300">
        &ldquo;{source.snippet}&rdquo;
      </p>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          {source.startTime !== null && source.startTime !== undefined ? (
            <>
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono text-slate-300">
                Timestamp: {formatTime(source.startTime)}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>Full Content</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          <span>{Math.round(source.similarity * 100)}% match</span>
        </div>
      </div>
    </Link>
  );
}
