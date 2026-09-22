"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { saveRawTranscript } from "@/lib/actions/transcript";
import { FileText, Save, Edit3, Play, Copy, Check, Search } from "lucide-react";

export interface TranscriptSegment {
  id?: string;
  start_time: number;
  end_time: number;
  text: string;
  sequence: number;
}

export interface TimestampedTranscriptProps {
  contentId: string;
  transcript: {
    id?: string;
    full_text?: string;
    language?: string;
    transcript_segments?: TranscriptSegment[];
  } | null;
  currentTime?: number;
  onSeekTime?: (seconds: number) => void;
  onRefresh?: () => void;
}

export function TimestampedTranscript({
  contentId,
  transcript,
  currentTime = 0,
  onSeekTime,
  onRefresh,
}: TimestampedTranscriptProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rawText, setRawText] = useState(transcript?.full_text || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    const textToCopy = transcript?.full_text || rawText || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const segments = transcript?.transcript_segments || [];
  const hasSegments = segments.length > 0;

  const filteredSegments = segments.filter((seg) =>
    seg.text.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4 flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Interactive Transcript ({hasSegments ? segments.length : "Full Text"})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={handleCopy}
            icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          >
            {copied ? "Copied!" : "Copy Transcript"}
          </Button>
          {!isEditing ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsEditing(true)}
              icon={<Edit3 className="h-3.5 w-3.5" />}
            >
              Edit Text
            </Button>
          ) : (
            <Button
              variant="default"
              size="xs"
              onClick={handleSave}
              isLoading={isLoading}
              icon={<Save className="h-3.5 w-3.5" />}
            >
              Save
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

        {hasSegments && !isEditing && (
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search terms in transcript..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {isEditing ? (
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Edit or paste raw transcript content..."
            rows={12}
          />
        ) : hasSegments ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {filteredSegments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No segments matching &quot;{searchFilter}&quot;.</p>
            ) : (
              filteredSegments
                .sort((a, b) => a.sequence - b.sequence)
                .map((seg) => {
                  const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;
                  return (
                    <div
                      key={seg.id || seg.sequence}
                      className={`flex items-start gap-3 text-xs p-2.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-800 font-medium"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                      }`}
                    >
                      <button
                        onClick={() => onSeekTime && onSeekTime(seg.start_time)}
                        className="flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-100/70 dark:bg-indigo-900/60 px-2 py-0.5 rounded hover:bg-indigo-600 hover:text-white transition-colors"
                        title="Jump to this moment"
                      >
                        <Play className="h-2.5 w-2.5 fill-current" />
                        {formatSeconds(seg.start_time)}
                      </button>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed flex-1 select-text">
                        {seg.text}
                      </p>
                    </div>
                  );
                })
            )}
          </div>
        ) : (
          <div className="text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 max-h-[500px] overflow-y-auto select-text font-sans">
            {transcript?.full_text || rawText || "No raw transcript data stored yet. Click 'Edit Text' to insert transcript text."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
