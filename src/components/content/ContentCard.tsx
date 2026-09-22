"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { ContentTypeBadge } from "./ContentTypeBadge";
import { ContentStatusBadge } from "./ContentStatusBadge";
import { ContentStatus } from "@/types/database.types";
import { Star, MoreVertical, Trash2, Edit3, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { toggleFavorite, updateContentStatus, deleteContent } from "@/lib/actions/content";

export interface ContentCardProps {
  content: {
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
  };
  onEdit?: (content: unknown) => void;
  onRefresh?: () => void;
}

export function ContentCard({ content, onEdit, onRefresh }: ContentCardProps) {
  const [isFav, setIsFav] = useState(content.is_favorite);
  const [status, setStatus] = useState<ContentStatus>(content.status);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleFav = async () => {
    const nextStatus = !isFav;
    setIsFav(nextStatus);
    const res = await toggleFavorite(content.id, isFav);
    if (res.error) {
      setIsFav(isFav); // Revert if failed
    } else if (onRefresh) {
      onRefresh();
    }
  };

  const handleStatusChange = async (newStatus: ContentStatus) => {
    setStatus(newStatus);
    const res = await updateContentStatus(content.id, newStatus);
    if (res.error) {
      setStatus(status); // Revert
    } else if (onRefresh) {
      onRefresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${content.title}"?`)) return;
    setIsDeleting(true);
    await deleteContent(content.id);
    setIsDeleting(false);
    if (onRefresh) onRefresh();
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const [imgError, setImgError] = useState(false);

  return (
    <Card className={`overflow-hidden flex flex-col transition-all hover:shadow-md ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Thumbnail or Icon Banner Header */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {content.thumbnail_url && !imgError ? (
          <Image
            src={content.thumbnail_url}
            alt={content.title}
            fill
            onError={() => setImgError(true)}
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <PlayCircle className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        {/* Favorite Button Overlay */}
        <button
          onClick={handleToggleFav}
          className="absolute top-2 right-2 rounded-full bg-slate-900/60 p-1.5 backdrop-blur-md text-white hover:scale-110 transition-transform"
          aria-label={isFav ? "Remove favorite" : "Mark favorite"}
        >
          <Star className={`h-4 w-4 ${isFav ? "fill-amber-400 text-amber-400" : "text-white"}`} />
        </button>

        {/* Duration badge */}
        {content.duration && content.duration > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-mono text-white backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {formatDuration(content.duration)}
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <ContentTypeBadge type={content.content_type} />
              <ContentStatusBadge status={status} />
            </div>

            {/* Actions Menu Dropdown */}
            <Dropdown
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </Button>
              }
              items={[
                {
                  id: "edit",
                  label: "Edit Details",
                  icon: <Edit3 className="h-4 w-4" />,
                  onClick: () => onEdit && onEdit(content),
                },
                {
                  id: "status-in-progress",
                  label: "Mark In Progress",
                  icon: <Clock className="h-4 w-4" />,
                  onClick: () => handleStatusChange("in_progress"),
                },
                {
                  id: "status-completed",
                  label: "Mark Completed",
                  icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                  onClick: () => handleStatusChange("completed"),
                },
                {
                  id: "status-review",
                  label: "Send to Review Queue",
                  icon: <Clock className="h-4 w-4 text-amber-500" />,
                  onClick: () => handleStatusChange("review"),
                },
                {
                  id: "delete",
                  label: "Delete Content",
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onClick: handleDelete,
                },
              ]}
            />
          </div>

          <Link href={`/library/${content.id}`}>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 transition-colors">
              {content.title}
            </h3>
          </Link>

          {content.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {content.description}
            </p>
          )}
        </div>

        {/* Category & Tag Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
          {content.category ? (
            <Badge variant="outline" size="sm" style={{ borderColor: content.category.color || undefined }}>
              {content.category.name}
            </Badge>
          ) : (
            <span className="text-[10px] text-slate-400">Uncategorized</span>
          )}

          {content.content_tags && content.content_tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {content.content_tags.slice(0, 2).map(({ tag }) => (
                <span key={tag.id} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  #{tag.name}
                </span>
              ))}
              {content.content_tags.length > 2 && (
                <span className="text-[10px] text-slate-400">+{content.content_tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
