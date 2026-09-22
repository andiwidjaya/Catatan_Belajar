"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { ContentStatusBadge } from "@/components/content/ContentStatusBadge";
import { ContentStatus, ContentType } from "@/types/database.types";
import { ArrowLeft, Star, Trash2, Edit3 } from "lucide-react";

export interface ContentDetailHeaderProps {
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStatusChange: (status: ContentStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContentDetailHeader({
  title,
  contentType,
  status,
  isFavorite,
  onToggleFavorite,
  onStatusChange,
  onEdit,
  onDelete,
}: ContentDetailHeaderProps) {
  return (
    <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/library">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Library
            </Button>
          </Link>
          <ContentTypeBadge type={contentType} />
          <ContentStatusBadge status={status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ContentStatus)}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:outline-none"
          >
            <option value="unread">Status: Unread</option>
            <option value="in_progress">Status: In Progress</option>
            <option value="completed">Status: Completed</option>
            <option value="review">Status: Review Queue</option>
          </select>

          <Button
            variant={isFavorite ? "default" : "outline"}
            size="sm"
            onClick={onToggleFavorite}
            icon={<Star className={`h-4 w-4 ${isFavorite ? "fill-white" : ""}`} />}
          >
            {isFavorite ? "Favorite" : "Star"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            icon={<Edit3 className="h-4 w-4" />}
          >
            Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            icon={<Trash2 className="h-4 w-4 text-rose-500" />}
          >
            Delete
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl leading-snug">
        {title}
      </h1>
    </div>
  );
}
