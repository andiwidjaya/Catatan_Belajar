"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { markContentAsReviewed, updateContentStatus } from "@/lib/actions/content";
import { ContentStatus } from "@/types/database.types";
import {
  BookOpenCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PlayCircle,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";

export interface ReviewCardProps {
  content: {
    id: string;
    title: string;
    description: string | null;
    content_type: "video" | "audio" | "text";
    source_type: "youtube" | "upload" | "manual";
    thumbnail_url: string | null;
    duration: number | null;
    status: ContentStatus;
    created_at: string;
    category?: { id: string; name: string; color: string | null } | null;
    content_tags?: { tag: { id: string; name: string } }[] | null;
  };
  onOpenReview: (content: any) => void;
  onRefresh?: () => void;
}

export function ReviewCard({ content, onOpenReview, onRefresh }: ReviewCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const handleMarkAsReviewed = async () => {
    setIsUpdating(true);
    const res = await markContentAsReviewed(content.id, "completed");
    setIsUpdating(false);
    if (!res.error) {
      setSuccessStatus("Reviewed!");
      if (onRefresh) onRefresh();
    }
  };

  const handleMarkCompleted = async () => {
    setIsUpdating(true);
    const res = await updateContentStatus(content.id, "completed");
    setIsUpdating(false);
    if (!res.error) {
      setSuccessStatus("Completed!");
      if (onRefresh) onRefresh();
    }
  };

  const handleRemoveFromReview = async () => {
    setIsUpdating(true);
    const res = await updateContentStatus(content.id, "in_progress");
    setIsUpdating(false);
    if (!res.error) {
      setSuccessStatus("Removed!");
      if (onRefresh) onRefresh();
    }
  };

  return (
    <Card className={`overflow-hidden flex flex-col transition-all hover:shadow-md ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Card Header Media / Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {content.thumbnail_url ? (
          <Image
            src={content.thumbnail_url}
            alt={content.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <PlayCircle className="h-12 w-12 stroke-[1.5]" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-white font-semibold text-[10px] uppercase px-2 py-0.5 rounded-full backdrop-blur-sm">
          <BookOpenCheck className="h-3 w-3" />
          Review Queue
        </div>

        {successStatus && (
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm gap-2">
            <Check className="h-6 w-6 text-emerald-400" />
            <span>{successStatus}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <ContentTypeBadge type={content.content_type} />
            {content.category && (
              <Badge variant="outline" size="sm" style={{ borderColor: content.category.color || undefined }}>
                {content.category.name}
              </Badge>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
            {content.title}
          </h3>

          {content.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {content.description}
            </p>
          )}
        </div>

        {/* Primary Review Workflow Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onOpenReview(content)}
            icon={<Sparkles className="h-4 w-4" />}
          >
            Review Summary, Notes & Transcript
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="xs"
              onClick={handleMarkAsReviewed}
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            >
              Mark Reviewed
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={handleRemoveFromReview}
              icon={<XCircle className="h-3.5 w-3.5 text-slate-400" />}
            >
              Remove
            </Button>
          </div>

          <div className="flex justify-end pt-1">
            <Link href={`/library/${content.id}`} className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>Open Content Page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
