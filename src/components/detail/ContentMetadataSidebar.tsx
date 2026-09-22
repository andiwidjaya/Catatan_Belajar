import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, Calendar, Clock, Globe } from "lucide-react";

export interface ContentMetadataSidebarProps {
  sourceType: string;
  sourceUrl?: string | null;
  category?: { name: string; color: string | null } | null;
  language?: string;
  duration?: number | null;
  createdAt: string;
  tags?: { tag: { id: string; name: string } }[] | null;
}

export function ContentMetadataSidebar({
  sourceType,
  sourceUrl,
  category,
  language = "en",
  duration,
  createdAt,
  tags,
}: ContentMetadataSidebarProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formatDuration = (sec?: number | null) => {
    if (!sec) return "N/A";
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Information & Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Source Type</span>
            <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
              {sourceType}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Category</span>
            {category ? (
              <Badge variant="outline" size="sm" style={{ borderColor: category.color || undefined }}>
                {category.name}
              </Badge>
            ) : (
              <span className="text-slate-400 italic">Uncategorized</span>
            )}
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Language
            </span>
            <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">
              {language}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Duration
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {formatDuration(duration)}
            </span>
          </div>

          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Added On
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {formattedDate}
            </span>
          </div>

          {sourceUrl && (
            <div className="pt-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                <span>Open Original Source</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags Card */}
      {tags && tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assigned Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700"
              >
                #{tag.name}
              </span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
