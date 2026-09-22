"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentList, ContentItem } from "@/components/content/ContentList";
import { Badge } from "@/components/ui/Badge";
import { getContents } from "@/lib/actions/content";

export default function FavoritesPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await getContents({
      isFavorite: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    setIsLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setItems(res.data as ContentItem[]);
      setTotalCount(res.count);
    }
  }, [page]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorite Knowledge"
        description="Your starred videos, audio recordings, and notes for quick reference."
        badge={<Badge variant="success">{totalCount} Favorites</Badge>}
      />

      <ContentList
        items={items}
        totalCount={totalCount}
        isLoading={isLoading}
        error={error}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onRefresh={fetchFavorites}
      />
    </div>
  );
}
