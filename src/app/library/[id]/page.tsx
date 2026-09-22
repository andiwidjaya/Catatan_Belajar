"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card } from "@/components/ui/Card";
import { ContentDetailHeader } from "@/components/detail/ContentDetailHeader";
import { MediaPlayer } from "@/components/detail/MediaPlayer";
import { TimestampedTranscript } from "@/components/detail/TimestampedTranscript";
import { NotesManager } from "@/components/detail/NotesManager";
import { ContentMetadataSidebar } from "@/components/detail/ContentMetadataSidebar";
import { AISummaryCard } from "@/components/ai/AISummaryCard";
import { GenerateSummaryButton } from "@/components/ai/GenerateSummaryButton";
import { ItemAIChatWidget } from "@/components/ai/ItemAIChatWidget";
import { ContentForm } from "@/components/content/ContentForm";

import { TabList, TabItem } from "@/components/ui/Tabs";

import { getContentById, toggleFavorite, updateContentStatus, deleteContent } from "@/lib/actions/content";
import { logLearningActivity } from "@/lib/actions/activity";
import { getTranscriptForContent } from "@/lib/actions/transcript";
import { getAISummaryForContent } from "@/lib/actions/ai";
import { getNotesForContent } from "@/lib/actions/notes";
import { getCategories } from "@/lib/actions/category";
import { getTags } from "@/lib/actions/tag";
import { mediaStorageService } from "@/lib/storage/mediaStorageService";
import { ContentStatus } from "@/types/database.types";

import { Sparkles, FileText, StickyNote, MessageSquare, ArrowLeft } from "lucide-react";

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const contentId = resolvedParams.id;
  const router = useRouter();

  const [content, setContent] = useState<any>(null);
  const [transcript, setTranscript] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [signedPlaybackUrl, setSignedPlaybackUrl] = useState<string | null>(null);

  // Playback sync state
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTimeTrigger, setSeekTimeTrigger] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "chat" | "transcript" | "notes">("ai");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadAllDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const [contentRes, transcriptData, summaryData, notesData, catsData, tagsData] = await Promise.all([
      getContentById(contentId),
      getTranscriptForContent(contentId),
      getAISummaryForContent(contentId),
      getNotesForContent(contentId),
      getCategories(),
      getTags(),
    ]);

    setIsLoading(false);

    if (contentRes.error || !contentRes.data) {
      setErrorMsg(contentRes.error || "Content item not found.");
      return;
    }

    const item = contentRes.data;
    setContent(item);
    setTranscript(transcriptData);
    setAiSummary(summaryData);
    setNotes(notesData);
    setCategories(catsData);
    setTags(tagsData);

    // Log viewing activity
    logLearningActivity(contentId, "view").catch(() => {});

    // If source_type is upload, generate secure signed URL for media player
    if (item.source_type === "upload" && item.source_url) {
      mediaStorageService
        .getSignedUrl(item.source_url)
        .then((url) => setSignedPlaybackUrl(url))
        .catch(() => setSignedPlaybackUrl(null));
    }
  }, [contentId]);

  useEffect(() => {
    loadAllDetails();
  }, [loadAllDetails]);

  const handleToggleFav = async () => {
    if (!content) return;
    const res = await toggleFavorite(content.id, content.is_favorite);
    if (!res.error) {
      setContent((prev: any) => ({ ...prev, is_favorite: !prev.is_favorite }));
    }
  };

  const handleStatusChange = async (newStatus: ContentStatus) => {
    if (!content) return;
    const res = await updateContentStatus(content.id, newStatus);
    if (!res.error) {
      setContent((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const handleDelete = async () => {
    if (!content) return;
    if (!confirm(`Are you sure you want to delete "${content.title}"?`)) return;
    await deleteContent(content.id);
    router.push("/library");
  };

  const handleSeekTo = (seconds: number) => {
    setSeekTimeTrigger(seconds);
    setTimeout(() => setSeekTimeTrigger(null), 100);
  };

  if (isLoading) {
    return <LoadingState label="Loading complete content details..." />;
  }

  if (errorMsg || !content) {
    return (
      <div className="space-y-6">
        <Link href="/library">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back to Library
          </Button>
        </Link>
        <ErrorState message={errorMsg || "Content item not found."} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <ContentDetailHeader
        title={content.title}
        contentType={content.content_type}
        status={content.status}
        isFavorite={content.is_favorite}
        onToggleFavorite={handleToggleFav}
        onStatusChange={handleStatusChange}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDelete}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Player */}
          <MediaPlayer
            title={content.title}
            sourceType={content.source_type}
            contentType={content.content_type}
            sourceId={content.source_id}
            signedPlaybackUrl={signedPlaybackUrl}
            thumbnailUrl={content.thumbnail_url}
            seekTime={seekTimeTrigger}
            onTimeUpdate={setCurrentTime}
          />

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <TabList ariaLabel="Content view sections">
              <TabItem
                active={activeTab === "ai"}
                onClick={() => setActiveTab("ai")}
                icon={<Sparkles className="h-4 w-4" />}
                id="tab-ai"
              >
                AI Summary
              </TabItem>
              <TabItem
                active={activeTab === "chat"}
                onClick={() => setActiveTab("chat")}
                icon={<MessageSquare className="h-4 w-4" />}
                id="tab-chat"
              >
                Ask AI about this Content
              </TabItem>
              <TabItem
                active={activeTab === "transcript"}
                onClick={() => setActiveTab("transcript")}
                icon={<FileText className="h-4 w-4" />}
                id="tab-transcript"
              >
                Transcript
              </TabItem>
              <TabItem
                active={activeTab === "notes"}
                onClick={() => setActiveTab("notes")}
                icon={<StickyNote className="h-4 w-4" />}
                badge={notes.length}
                id="tab-notes"
              >
                Notes
              </TabItem>
            </TabList>

            <GenerateSummaryButton
              contentId={content.id}
              hasExistingSummary={!!aiSummary}
              onSuccess={loadAllDetails}
            />
          </div>

          {/* Active Tab View */}
          {activeTab === "ai" ? (
            aiSummary ? (
              <AISummaryCard summary={aiSummary} />
            ) : (
              <Card className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-3">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No AI summary generated yet
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Generate an AI summary using Google Gemini 2.5 Flash to extract executive overviews, key takeaways, core concepts, and study questions.
                </p>
                <GenerateSummaryButton
                  contentId={content.id}
                  hasExistingSummary={false}
                  onSuccess={loadAllDetails}
                />
              </Card>
            )
          ) : activeTab === "chat" ? (
            <ItemAIChatWidget contentId={content.id} contentTitle={content.title} />
          ) : activeTab === "transcript" ? (
            <TimestampedTranscript
              contentId={content.id}
              transcript={transcript}
              currentTime={currentTime}
              onSeekTime={handleSeekTo}
              onRefresh={loadAllDetails}
            />
          ) : (
            <NotesManager
              contentId={content.id}
              notes={notes}
              currentTime={currentTime}
              onSeekTime={handleSeekTo}
              onRefresh={loadAllDetails}
            />
          )}
        </div>

        {/* Sidebar Metadata Column */}
        <div>
          <ContentMetadataSidebar
            sourceType={content.source_type}
            sourceUrl={content.source_url}
            category={content.category}
            language={content.language}
            duration={content.duration}
            createdAt={content.created_at}
            tags={content.content_tags}
          />
        </div>
      </div>

      {/* Edit Content Form Modal */}
      {isEditModalOpen && (
        <ContentForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          content={content}
          categories={categories}
          tags={tags}
          onSuccess={loadAllDetails}
        />
      )}
    </div>
  );
}
