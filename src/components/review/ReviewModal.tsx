"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ContentTypeBadge } from "@/components/content/ContentTypeBadge";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { TabList, TabItem } from "@/components/ui/Tabs";

import { getAISummaryForContent } from "@/lib/actions/ai";
import { getTranscriptForContent } from "@/lib/actions/transcript";
import { getNotesForContent, createNote } from "@/lib/actions/notes";
import { markContentAsReviewed, updateContentStatus } from "@/lib/actions/content";

import {
  Sparkles,
  FileText,
  StickyNote,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpenCheck,
} from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: any;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  currentIndex?: number;
  totalItems?: number;
  onRefresh?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  contentItem,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  currentIndex,
  totalItems,
  onRefresh,
}: ReviewModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "notes">("summary");
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!contentItem?.id) return;
    setIsLoading(true);
    setActionSuccessMsg(null);

    const [summaryRes, transcriptRes, notesRes] = await Promise.all([
      getAISummaryForContent(contentItem.id),
      getTranscriptForContent(contentItem.id),
      getNotesForContent(contentItem.id),
    ]);

    setAiSummary(summaryRes);
    setTranscript(transcriptRes);
    setNotes(notesRes || []);
    setIsLoading(false);
  }, [contentItem?.id]);

  useEffect(() => {
    if (isOpen) {
      loadDetails();
    }
  }, [isOpen, loadDetails]);

  const handleMarkAsReviewed = async () => {
    if (!contentItem?.id) return;
    const res = await markContentAsReviewed(contentItem.id, "completed");
    if (!res.error) {
      setActionSuccessMsg("Marked as reviewed and logged activity!");
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setActionSuccessMsg(null);
        if (onNext && hasNext) {
          onNext();
        } else {
          onClose();
        }
      }, 800);
    }
  };

  const handleMarkCompleted = async () => {
    if (!contentItem?.id) return;
    const res = await updateContentStatus(contentItem.id, "completed");
    if (!res.error) {
      setActionSuccessMsg("Marked as completed!");
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setActionSuccessMsg(null);
        if (onNext && hasNext) onNext();
        else onClose();
      }, 800);
    }
  };

  const handleRemoveFromReview = async () => {
    if (!contentItem?.id) return;
    const res = await updateContentStatus(contentItem.id, "in_progress");
    if (!res.error) {
      setActionSuccessMsg("Removed from review queue!");
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setActionSuccessMsg(null);
        if (onNext && hasNext) onNext();
        else onClose();
      }, 800);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !contentItem?.id) return;
    setIsSubmittingNote(true);
    const res = await createNote(contentItem.id, newNoteText.trim());
    setIsSubmittingNote(false);
    if (!res.error) {
      setNewNoteText("");
      const updatedNotes = await getNotesForContent(contentItem.id);
      setNotes(updatedNotes);
    }
  };

  if (!contentItem) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review Studio`} size="xl">
      <div className="space-y-6">
        {/* Top Review Item Header */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ContentTypeBadge type={contentItem.content_type} />
              {contentItem.category && (
                <Badge variant="outline" style={{ borderColor: contentItem.category.color || undefined }}>
                  {contentItem.category.name}
                </Badge>
              )}
              {totalItems !== undefined && currentIndex !== undefined && (
                <span className="text-xs font-mono text-slate-400">
                  Item {currentIndex + 1} of {totalItems}
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              {hasPrev && (
                <Button variant="ghost" size="sm" onClick={onPrev} icon={<ChevronLeft className="h-4 w-4" />}>
                  Prev
                </Button>
              )}
              {hasNext && (
                <Button variant="ghost" size="sm" onClick={onNext} icon={<ChevronRight className="h-4 w-4" />}>
                  Next
                </Button>
              )}
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{contentItem.title}</h2>

          {contentItem.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{contentItem.description}</p>
          )}

          {actionSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {actionSuccessMsg}
            </div>
          )}

          {/* Workflow Action Bar */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="default"
                size="sm"
                onClick={handleMarkAsReviewed}
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              >
                Mark as Reviewed
              </Button>
              <Button variant="outline" size="sm" onClick={handleMarkCompleted}>
                Mark Completed
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRemoveFromReview} icon={<XCircle className="h-4 w-4 text-slate-400" />}>
                Remove from Queue
              </Button>
            </div>

            <Link href={`/library/${contentItem.id}`} target="_blank">
              <Button variant="ghost" size="sm" icon={<ExternalLink className="h-4 w-4" />}>
                Open Full View
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
          <TabList ariaLabel="Review content sections">
            <TabItem
              active={activeTab === "summary"}
              onClick={() => setActiveTab("summary")}
              icon={<Sparkles className="h-4 w-4 text-indigo-400" />}
              id="review-tab-summary"
            >
              Review Summary
            </TabItem>
            <TabItem
              active={activeTab === "transcript"}
              onClick={() => setActiveTab("transcript")}
              icon={<FileText className="h-4 w-4 text-sky-400" />}
              id="review-tab-transcript"
            >
              Review Transcript
            </TabItem>
            <TabItem
              active={activeTab === "notes"}
              onClick={() => setActiveTab("notes")}
              icon={<StickyNote className="h-4 w-4 text-amber-400" />}
              badge={notes.length}
              id="review-tab-notes"
            >
              Review Notes
            </TabItem>
          </TabList>
        </div>

        {/* Tab Content Panels */}
        {isLoading ? (
          <LoadingState label="Loading review details..." />
        ) : activeTab === "summary" ? (
          aiSummary ? (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <AISummaryCard summary={aiSummary} />
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No AI summary generated yet for this item.</p>
              <Link href={`/library/${contentItem.id}`} className="mt-3 inline-block">
                <Button size="sm" variant="outline">
                  Go to Content to Generate Summary
                </Button>
              </Link>
            </div>
          )
        ) : activeTab === "transcript" ? (
          transcript?.full_text ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 max-h-[60vh] overflow-y-auto text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
              {transcript.full_text}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No transcript available for this item.</p>
            </div>
          )
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Add note input */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new note for this review..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="submit" size="sm" disabled={isSubmittingNote} icon={<Plus className="h-4 w-4" />}>
                Add Note
              </Button>
            </form>

            {/* Notes List */}
            {notes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No personal notes saved yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                    <p className="text-slate-800 dark:text-slate-200">{note.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(note.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
