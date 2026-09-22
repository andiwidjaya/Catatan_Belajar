"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { saveRawTranscript } from "@/lib/actions/transcript";
import { FileText, Clock, Save, Edit3, Search, ChevronDown } from "lucide-react";

export interface TranscriptSegment {
  id?: string;
  start_time: number;
  end_time: number;
  text: string;
  sequence: number;
}

export interface TranscriptViewerProps {
  contentId: string;
  transcript: {
    id?: string;
    full_text?: string;
    language?: string;
    transcript_segments?: TranscriptSegment[];
  } | null;
  defaultText?: string;
  onRefresh?: () => void;
}

const CHUNK_SIZE = 50;

export function TranscriptViewer({ contentId, transcript, defaultText = "", onRefresh }: TranscriptViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rawText, setRawText] = useState(transcript?.full_text || defaultText);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Incremental Windowing State for Long Transcripts
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(CHUNK_SIZE);
  const [isFullTextExpanded, setIsFullTextExpanded] = useState(false);

  const handleSave = async () => {
    if (!rawText.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await saveRawTranscript({
      contentId,
      fullText: rawText.trim(),
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsEditing(false);
      if (onRefresh) onRefresh();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Memoize sorted segments to prevent redundant array sorting on every render
  const sortedSegments = useMemo(() => {
    if (!transcript?.transcript_segments || transcript.transcript_segments.length === 0) return [];
    return [...transcript.transcript_segments].sort((a, b) => a.sequence - b.sequence);
  }, [transcript?.transcript_segments]);

  // Filter segments based on in-transcript search query
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return sortedSegments;
    const q = searchQuery.toLowerCase().trim();
    return sortedSegments.filter((seg) => seg.text.toLowerCase().includes(q));
  }, [sortedSegments, searchQuery]);

  // Paginated window slice of segments to maintain low DOM node count and 60fps scrolling
  const visibleSegments = useMemo(() => {
    return filteredSegments.slice(0, visibleLimit);
  }, [filteredSegments, visibleLimit]);

  const hasSegments = sortedSegments.length > 0;
  const isLongText = (rawText || "").length > 3000;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-indigo-600" />
            Raw Transcript & Source Text
            {hasSegments && (
              <span className="text-xs font-normal text-slate-500 ml-1">
                ({sortedSegments.length} segments)
              </span>
            )}
          </CardTitle>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                icon={<Edit3 className="h-3.5 w-3.5" />}
              >
                Edit Transcript
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                isLoading={isLoading}
                icon={<Save className="h-3.5 w-3.5" />}
              >
                Save Transcript
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

          {!isEditing && hasSegments && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search in transcript..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleLimit(CHUNK_SIZE);
                }}
                className="pl-9 text-xs h-8"
              />
            </div>
          )}

          {isEditing ? (
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw video transcript or manual content text..."
              rows={12}
            />
          ) : hasSegments ? (
            <div className="space-y-3">
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                {visibleSegments.map((seg) => (
                  <div
                    key={seg.id || seg.sequence}
                    className="flex gap-3 text-xs p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded h-fit">
                      <Clock className="h-3 w-3" />
                      {formatSeconds(seg.start_time)}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{seg.text}</p>
                  </div>
                ))}

                {visibleSegments.length === 0 && (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No transcript segments match &quot;{searchQuery}&quot;.
                  </p>
                )}
              </div>

              {/* Incremental Windowing Controls */}
              {visibleLimit < filteredSegments.length && (
                <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setVisibleLimit((prev) => prev + CHUNK_SIZE)}
                    icon={<ChevronDown className="h-3.5 w-3.5" />}
                  >
                    Show More ({filteredSegments.length - visibleLimit} remaining)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200/60 dark:border-slate-800">
                {isLongText && !isFullTextExpanded
                  ? `${rawText.slice(0, 3000)}...\n\n[Long text truncated for performance]`
                  : rawText || "No raw transcript stored yet. Click 'Edit Transcript' to add content text."}
              </div>

              {isLongText && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsFullTextExpanded(!isFullTextExpanded)}
                >
                  {isFullTextExpanded ? "Show Less" : "Show Full Text"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
