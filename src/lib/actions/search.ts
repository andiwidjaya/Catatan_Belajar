"use server";

import { createClient } from "@/lib/supabase/server";
import { SearchFilters, SearchResponse, SearchResultItem } from "@/lib/search/searchService";

export async function searchKnowledgeLibrary(filters: SearchFilters): Promise<{ data?: SearchResponse; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthenticated" };
  }

  const query = filters.query?.trim() || "";
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const offset = (page - 1) * pageSize;

  try {
    // Try executing RPC search function
    const { data, error } = await (supabase.rpc as any)("search_knowledge_library", {
      p_user_id: user.id,
      p_query: query,
      p_content_type: filters.contentType || null,
      p_source_type: filters.sourceType || null,
      p_status: filters.status || null,
      p_category_id: filters.categoryId || null,
      p_tag_id: filters.tagId || null,
      p_is_favorite: filters.isFavorite !== undefined ? filters.isFavorite : null,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
      p_sort_by: filters.sortBy || "relevance",
      p_limit: pageSize,
      p_offset: offset,
    });

    if (error) {
      console.warn("RPC Search unavailable, falling back to standard query:", error.message);
      // Fallback standard search query if RPC is pending migration
      return await fallbackSearch(supabase, user.id, filters, page, pageSize, offset);
    }

    const items = (data as any[]) || [];
    const totalCount = items.length > 0 ? Number(items[0].total_count) : 0;

    return {
      data: {
        items: items as SearchResultItem[],
        totalCount,
        page,
        pageSize,
      },
    };
  } catch (err: unknown) {
    console.error("Search Action Exception:", err);
    return { error: "An unexpected error occurred while executing search." };
  }
}

async function fallbackSearch(
  supabase: any,
  userId: string,
  filters: SearchFilters,
  page: number,
  pageSize: number,
  offset: number
) {
  let query = (supabase.from("contents" as any) as any)
    .select(`
      *,
      category:categories(id, name, color)
    `, { count: "exact" })
    .eq("user_id", userId);

  if (filters.query && filters.query.trim() !== "") {
    query = query.ilike("title", `%${filters.query.trim()}%`);
  }

  if (filters.contentType) query = query.eq("content_type", filters.contentType);
  if (filters.sourceType) query = query.eq("source_type", filters.sourceType);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.isFavorite !== undefined) query = query.eq("is_favorite", filters.isFavorite);

  if (filters.sortBy === "newest") query = query.order("created_at", { ascending: false });
  else if (filters.sortBy === "oldest") query = query.order("created_at", { ascending: true });
  else if (filters.sortBy === "title_asc") query = query.order("title", { ascending: true });
  else if (filters.sortBy === "title_desc") query = query.order("title", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return {
    data: {
      items: (data as SearchResultItem[]) || [],
      totalCount: count || 0,
      page,
      pageSize,
    },
  };
}
