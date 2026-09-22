"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { ContentStatusBadge } from "@/components/content/ContentStatusBadge";
import { ContentType, ContentStatus } from "@/types/database.types";
import { Search, PlayCircle, Star, ArrowRight } from "lucide-react";

export interface SearchResultCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    content_type: ContentType;
    source_type: string;
    thumbnail_url: string | null;
    status: ContentStatus;
    is_favorite: boolean;
    created_at: string;
    match_source?: string;
    match_snippet?: string;
    category?: { id: string; name: string; color: string | null } | null;
  };
  query: string;
}

export function SearchResultCard({ item, query }: SearchResultCardProps) {
  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="overflow-hidden p-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Thumbnail preview */}
        <div className="relative aspect-video w-full md:w-48 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          {item.thumbnail_url ? (
            <Image src={item.thumbnail_url} alt={item.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <PlayCircle className="h-8 w-8 stroke-[1.5]" />
            </div>
          )}
          {item.is_favorite && (
            <div className="absolute top-2 right-2 rounded-full bg-slate-900/70 p-1 backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>
          )}
        </div>

        {/* Info & Snippet Content */}
        <div className="flex-1 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ContentTypeBadge type={item.content_type} />
                <ContentStatusBadge status={item.status} />
                {item.category && (
                  <Badge variant="outline" size="sm">
                    {item.category.name}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{formattedDate}</span>
            </div>

            <Link href={`/library/${item.id}`}>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {item.title}
              </h3>
            </Link>

            {/* Matching text snippet highlight */}
            {item.match_snippet && (
              <div className="rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40 p-2.5 border border-indigo-100 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-[10px] text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">
                  <Search className="h-3 w-3" />
                  Matched in {item.match_source?.replace("_", " ") || "content"}
                </div>
                <p className="line-clamp-2 italic">
                  &ldquo;...{item.match_snippet}...&rdquo;
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Link href={`/library/${item.id}`}>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                <span>View Full Item</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
