"use client";

import React from "react";
import { ContentCard } from "./ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ContentStatus } from "@/types/database.types";
import { Button } from "@/components/ui/Button";
import { Library, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  content_type: "video" | "audio" | "text";
  source_type: "youtube" | "upload" | "manual";
  thumbnail_url: string | null;
  duration: number | null;
  status: ContentStatus;
  is_favorite: boolean;
  created_at: string;
  category?: { id: string; name: string; color: string | null } | null;
  content_tags?: { tag: { id: string; name: string } }[] | null;
}

export interface ContentListProps {
  items: ContentItem[];
  totalCount: number;
  isLoading?: boolean;
  error?: string | null;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEditItem?: (item: unknown) => void;
  onRefresh?: () => void;
}

export function ContentList({
  items,
  totalCount,
  isLoading,
  error,
  page,
  pageSize,
  onPageChange,
  onEditItem,
  onRefresh,
}: ContentListProps) {
  if (isLoading) {
    return <LoadingState label="Fetching knowledge library content..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRefresh} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Library className="h-10 w-10 text-indigo-500" />}
        title="No content found"
        description="Try adjusting your filters or search query, or add your first knowledge item."
        action={
          <Link href="/library/youtube">
            <Button size="sm" icon={<Plus className="h-4 w-4" />}>
              Add Content
            </Button>
          </Link>
        }
      />
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            content={item}
            onEdit={onEditItem}
            onRefresh={onRefresh}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
          <span className="text-slate-500">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(page - 1) * pageSize + 1}</span> to{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {Math.min(page * pageSize, totalCount)}
            </span>{" "}
            of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> items
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <span className="font-medium text-slate-700 dark:text-slate-300 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
