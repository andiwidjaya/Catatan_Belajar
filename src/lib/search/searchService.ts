import { ContentType, SourceType, ContentStatus } from "@/types/database.types";

export interface SearchFilters {
  query: string;
  contentType?: ContentType;
  sourceType?: SourceType;
  status?: ContentStatus;
  categoryId?: string;
  tagId?: string;
  isFavorite?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "relevance" | "newest" | "oldest" | "title_asc" | "title_desc";
  page?: number;
  pageSize?: number;
}

export interface SearchResultItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  source_type: SourceType;
  source_url: string | null;
  source_id: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  language: string;
  category_id: string | null;
  status: ContentStatus;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  match_source?: string;
  match_snippet?: string;
  relevance_rank?: number;
  category?: { id: string; name: string; color: string | null } | null;
}

export interface SearchResponse {
  items: SearchResultItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ISearchProvider {
  search(filters: SearchFilters): Promise<SearchResponse>;
}

export function highlightMatchingText(text: string, query: string): string {
  if (!text || !query.trim()) return text;
  return text;
}
