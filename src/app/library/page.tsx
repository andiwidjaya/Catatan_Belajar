"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ContentSearch } from "@/components/content/ContentSearch";
import { ContentFilters, FilterState } from "@/components/content/ContentFilters";
import { ContentList, ContentItem } from "@/components/content/ContentList";
import { ContentForm } from "@/components/content/ContentForm";
import { CategoryManagerModal } from "@/components/content/CategoryManagerModal";
import { TagManagerModal } from "@/components/content/TagManagerModal";
import { getContents } from "@/lib/actions/content";
import { getCategories } from "@/lib/actions/category";
import { getTags } from "@/lib/actions/tag";
import { Plus, Youtube, UploadCloud, FileText, FolderPlus, Tag } from "lucide-react";

export default function LibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Modals state
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const loadMetaData = useCallback(async () => {
    const [cats, tgs] = await Promise.all([getCategories(), getTags()]);
    setCategories(cats);
    setTags(tgs);
  }, []);

  const fetchContentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await getContents({
      searchQuery,
      contentType: filters.contentType,
      sourceType: filters.sourceType,
      status: filters.status,
      categoryId: filters.categoryId,
      isFavorite: filters.isFavorite,
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
  }, [searchQuery, filters, page]);

  useEffect(() => {
    loadMetaData();
  }, [loadMetaData]);

  useEffect(() => {
    fetchContentData();
  }, [fetchContentData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Library"
        description="Browse, search, and manage all your saved knowledge sources."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              icon={<FolderPlus className="h-4 w-4" />}
            >
              Categories
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(true)}
              icon={<Tag className="h-4 w-4" />}
            >
              Tags
            </Button>
            <Link href="/library/youtube">
              <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                Add Content
              </Button>
            </Link>
          </div>
        }
      />

      {/* Sub-library nav tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link href="/library">
          <Button variant="default" size="sm">
            All Content ({totalCount})
          </Button>
        </Link>
        <Link href="/library/youtube">
          <Button variant="ghost" size="sm" icon={<Youtube className="h-4 w-4 text-red-500" />}>
            YouTube
          </Button>
        </Link>
        <Link href="/library/upload">
          <Button variant="ghost" size="sm" icon={<UploadCloud className="h-4 w-4 text-sky-500" />}>
            Uploads
          </Button>
        </Link>
        <Link href="/library/text">
          <Button variant="ghost" size="sm" icon={<FileText className="h-4 w-4 text-emerald-500" />}>
            Text Notes
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <ContentSearch value={searchQuery} onChange={(q) => { setSearchQuery(q); setPage(1); }} />
        <ContentFilters
          filters={filters}
          categories={categories}
          onChange={(f) => { setFilters(f); setPage(1); }}
          onReset={() => { setFilters({}); setSearchQuery(""); setPage(1); }}
        />
      </div>

      {/* Main Content Grid & List */}
      <ContentList
        items={items}
        totalCount={totalCount}
        isLoading={isLoading}
        error={error}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onEditItem={(item) => setEditingContent(item)}
        onRefresh={fetchContentData}
      />

      {/* Edit Content Form Modal */}
      {editingContent && (
        <ContentForm
          isOpen={!!editingContent}
          onClose={() => setEditingContent(null)}
          content={editingContent as any}
          categories={categories}
          tags={tags}
          onSuccess={fetchContentData}
        />
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onRefresh={() => { loadMetaData(); fetchContentData(); }}
      />

      {/* Tag Manager Modal */}
      <TagManagerModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={tags}
        onRefresh={() => { loadMetaData(); fetchContentData(); }}
      />
    </div>
  );
}
