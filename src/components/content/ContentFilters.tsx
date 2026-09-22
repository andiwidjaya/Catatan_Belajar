"use client";

import React from "react";
import { ContentType, SourceType, ContentStatus } from "@/types/database.types";
import { Filter, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FilterState {
  contentType?: ContentType;
  sourceType?: SourceType;
  status?: ContentStatus;
  categoryId?: string;
  isFavorite?: boolean;
}

export interface ContentFiltersProps {
  filters: FilterState;
  categories: { id: string; name: string }[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function ContentFilters({ filters, categories, onChange, onReset }: ContentFiltersProps) {
  const hasActiveFilters =
    filters.contentType ||
    filters.sourceType ||
    filters.status ||
    filters.categoryId ||
    filters.isFavorite;

  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      {/* Category Select */}
      <select
        value={filters.categoryId || ""}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value || undefined })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Content Type Select */}
      <select
        value={filters.contentType || ""}
        onChange={(e) => onChange({ ...filters, contentType: (e.target.value as ContentType) || undefined })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All Types</option>
        <option value="video">Video</option>
        <option value="audio">Audio</option>
        <option value="text">Text Note</option>
      </select>

      {/* Source Type Select */}
      <select
        value={filters.sourceType || ""}
        onChange={(e) => onChange({ ...filters, sourceType: (e.target.value as SourceType) || undefined })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All Sources</option>
        <option value="youtube">YouTube</option>
        <option value="upload">Upload</option>
        <option value="manual">Manual Note</option>
      </select>

      {/* Status Select */}
      <select
        value={filters.status || ""}
        onChange={(e) => onChange({ ...filters, status: (e.target.value as ContentStatus) || undefined })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All Statuses</option>
        <option value="unread">Unread</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="review">Review Queue</option>
      </select>

      {/* Favorites Toggle Button */}
      <Button
        variant={filters.isFavorite ? "default" : "outline"}
        size="sm"
        onClick={() => onChange({ ...filters, isFavorite: filters.isFavorite ? undefined : true })}
        icon={<Star className={`h-3.5 w-3.5 ${filters.isFavorite ? "fill-white" : ""}`} />}
      >
        Favorites Only
      </Button>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} icon={<RefreshCw className="h-3.5 w-3.5" />}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
