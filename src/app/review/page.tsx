"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewModal } from "@/components/review/ReviewModal";
import { getContents } from "@/lib/actions/content";
import { BookOpenCheck, Play, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function ReviewPage() {
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Modal / Studio State
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviewItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await getContents({
      status: "review",
      limit: 50,
    });

    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setItems(res.data || []);
      setTotalCount(res.count || 0);
    }
  }, []);

  useEffect(() => {
    fetchReviewItems();
  }, [fetchReviewItems]);

  const handleOpenReview = (item: any) => {
    const idx = items.findIndex((i) => i.id === item.id);
    setSelectedItemIndex(idx !== -1 ? idx : 0);
    setIsModalOpen(true);
  };

  const handleStartSession = () => {
    if (items.length > 0) {
      setSelectedItemIndex(0);
      setIsModalOpen(true);
    }
  };

  const currentModalItem = selectedItemIndex !== null && items[selectedItemIndex] ? items[selectedItemIndex] : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <PageHeader
        title="Learning Review System"
        description="Revisit saved knowledge items, review AI summaries, timestamped transcripts, and personal study notes."
        badge={<Badge variant="warning">{totalCount} Queued Items</Badge>}
        action={
          items.length > 0 ? (
            <Button icon={<Play className="h-4 w-4" />} onClick={handleStartSession}>
              Start Review Session
            </Button>
          ) : undefined
        }
      />

      {/* Review Queue Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Active Review Queue ({totalCount} items)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
            Revisiting items solidifies core concepts. Open any item to review key takeaways, edit study notes, or mark as reviewed.
          </p>
        </div>

        {items.length > 0 && (
          <Button variant="default" size="sm" onClick={handleStartSession} icon={<Sparkles className="h-4 w-4" />}>
            Step Through Queue ({totalCount})
          </Button>
        )}
      </div>

      {/* Main Review Items Grid */}
      {isLoading ? (
        <LoadingState label="Loading review queue..." />
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
          Failed to load review items: {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your review queue is currently empty"
          description="Flag any item in your Knowledge Library with status 'Send to Review Queue' to schedule it for active revision."
          action={
            <Link href="/library">
              <Button icon={<ArrowRight className="h-4 w-4" />}>Explore Knowledge Library</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              content={item}
              onOpenReview={handleOpenReview}
              onRefresh={fetchReviewItems}
            />
          ))}
        </div>
      )}

      {/* Interactive Review Studio Modal */}
      {currentModalItem && (
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contentItem={currentModalItem}
          currentIndex={selectedItemIndex ?? 0}
          totalItems={items.length}
          hasNext={selectedItemIndex !== null && selectedItemIndex < items.length - 1}
          hasPrev={selectedItemIndex !== null && selectedItemIndex > 0}
          onNext={() => setSelectedItemIndex((prev) => (prev !== null ? prev + 1 : 0))}
          onPrev={() => setSelectedItemIndex((prev) => (prev !== null ? prev - 1 : 0))}
          onRefresh={fetchReviewItems}
        />
      )}
    </div>
  );
}
