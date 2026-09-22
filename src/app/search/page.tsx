"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { searchKnowledgeLibrary } from "@/lib/actions/search";
import { getCategories } from "@/lib/actions/category";
import { getTags } from "@/lib/actions/tag";
import { ContentType, SourceType, ContentStatus } from "@/types/database.types";
import { SearchResultItem } from "@/lib/search/searchService";
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Star } from "lucide-react";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  // Filter & Sort State
  const [contentType, setContentType] = useState<ContentType | "">("");
  const [sourceType, setSourceType] = useState<SourceType | "">("");
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tagId, setTagId] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "oldest" | "title_asc" | "title_desc">("relevance");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    Promise.all([getCategories(), getTags()]).then(([cats, tgs]) => {
      setCategories(cats);
      setTags(tgs);
    });
  }, []);

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await searchKnowledgeLibrary({
      query,
      contentType: contentType || undefined,
      sourceType: sourceType || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
      tagId: tagId || undefined,
      isFavorite,
      sortBy,
      page,
      pageSize,
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setItems(res.data.items);
      setTotalCount(res.data.totalCount);
    }
  }, [query, contentType, sourceType, status, categoryId, tagId, isFavorite, sortBy, page]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    executeSearch();
  };

  const handleResetFilters = () => {
    setContentType("");
    setSourceType("");
    setStatus("");
    setCategoryId("");
    setTagId("");
    setIsFavorite(undefined);
    setSortBy("relevance");
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Search & Discovery"
        description="Search across titles, descriptions, transcripts, AI summaries, notes, and tags."
        badge={<Badge variant="default">{totalCount} Results</Badge>}
      />

      {/* Main Search Input Form */}
      <Card className="p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            placeholder="Search transcripts, AI summaries, notes, or tags (e.g. transformer, system design)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="flex-1 bg-white dark:bg-slate-900"
          />
          <Button type="submit" variant="default" icon={<Search className="h-4 w-4" />}>
            Search
          </Button>
        </form>
      </Card>

      {/* Filters & Sorting Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filters:
            </span>

            {/* Category */}
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Tag */}
            <select
              value={tagId}
              onChange={(e) => { setTagId(e.target.value); setPage(1); }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>#{t.name}</option>
              ))}
            </select>

            {/* Type */}
            <select
              value={contentType}
              onChange={(e) => { setContentType(e.target.value as ContentType); setPage(1); }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Types</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="text">Text Note</option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as ContentStatus); setPage(1); }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Statuses</option>
              <option value="unread">Unread</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="review">Review Queue</option>
            </select>

            {/* Favorite toggle */}
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setIsFavorite(isFavorite ? undefined : true); setPage(1); }}
              icon={<Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-white" : ""}`} />}
            >
              Favorites
            </Button>

            {(contentType || sourceType || status || categoryId || tagId || isFavorite) && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} icon={<RefreshCw className="h-3 w-3" />}>
                Reset
              </Button>
            )}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Results View */}
      {isLoading ? (
        <LoadingState label="Searching knowledge library..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={executeSearch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10 text-indigo-500" />}
          title="No matching knowledge items found"
          description={
            query
              ? `No content matches "${query}". Try searching with different keywords or clearing applied filters.`
              : "Enter a search term above to search across transcripts, AI summaries, notes, and tags."
          }
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <SearchResultCard key={item.id} item={item} query={query} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs">
              <span className="text-slate-500">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{(page - 1) * pageSize + 1}</span> to{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> items
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <span className="font-medium text-slate-700 dark:text-slate-300 px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  icon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading search workspace..." />}>
      <SearchPageContent />
    </Suspense>
  );
}
