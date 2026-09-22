"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ContentType, SourceType, ContentStatus } from "@/types/database.types";

export interface GetContentsOptions {
  contentType?: ContentType;
  sourceType?: SourceType;
  status?: ContentStatus;
  categoryId?: string;
  isFavorite?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export async function getContents(options: GetContentsOptions = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: [], count: 0, error: "Unauthenticated" };

  let query = (supabase.from("contents" as any) as any)
    .select(`
      *,
      category:categories(id, name, color),
      content_tags(
        tag:tags(id, name)
      )
    `, { count: "exact" })
    .eq("user_id", user.id);

  if (options.contentType) {
    query = query.eq("content_type", options.contentType);
  }

  if (options.sourceType) {
    query = query.eq("source_type", options.sourceType);
  }

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options.isFavorite !== undefined) {
    query = query.eq("is_favorite", options.isFavorite);
  }

  if (options.searchQuery && options.searchQuery.trim() !== "") {
    query = query.ilike("title", `%${options.searchQuery.trim()}%`);
  }

  const limit = options.limit || 20;
  const offset = options.offset || 0;

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching contents:", error.message);
    return { data: [], count: 0, error: error.message };
  }

  return { data: data || [], count: count || 0 };
}

export async function getContentById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await (supabase.from("contents" as any) as any)
    .select(`
      *,
      category:categories(id, name, color),
      content_tags(
        tag:tags(id, name)
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export interface CreateContentInput {
  title: string;
  description?: string;
  contentType: ContentType;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceId?: string;
  thumbnailUrl?: string;
  duration?: number;
  language?: string;
  categoryId?: string;
  status?: ContentStatus;
  isFavorite?: boolean;
  tagIds?: string[];
}

export async function createContent(input: CreateContentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await (supabase.from("contents" as any) as any)
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      content_type: input.contentType,
      source_type: input.sourceType,
      source_url: input.sourceUrl,
      source_id: input.sourceId,
      thumbnail_url: input.thumbnailUrl,
      duration: input.duration || 0,
      language: input.language || "en",
      category_id: input.categoryId || null,
      status: input.status || "unread",
      is_favorite: input.isFavorite || false,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (input.tagIds && input.tagIds.length > 0) {
    const contentTags = input.tagIds.map((tagId) => ({
      content_id: data.id,
      tag_id: tagId,
    }));
    await (supabase.from("content_tags" as any) as any).insert(contentTags);
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateContent(id: string, input: Partial<CreateContentInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.contentType !== undefined) updateData.content_type = input.contentType;
  if (input.sourceType !== undefined) updateData.source_type = input.sourceType;
  if (input.sourceUrl !== undefined) updateData.source_url = input.sourceUrl;
  if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl;
  if (input.categoryId !== undefined) updateData.category_id = input.categoryId;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.isFavorite !== undefined) updateData.is_favorite = input.isFavorite;

  const { data, error } = await (supabase.from("contents" as any) as any)
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (input.tagIds !== undefined) {
    await (supabase.from("content_tags" as any) as any).delete().eq("content_id", id);
    if (input.tagIds.length > 0) {
      const contentTags = input.tagIds.map((tagId) => ({
        content_id: id,
        tag_id: tagId,
      }));
      await (supabase.from("content_tags" as any) as any).insert(contentTags);
    }
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { data };
}

export async function deleteContent(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { error } = await (supabase.from("contents" as any) as any)
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleFavorite(id: string, currentFavoriteStatus: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await (supabase.from("contents" as any) as any)
    .update({ is_favorite: !currentFavoriteStatus })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await (supabase.from("contents" as any) as any)
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  revalidatePath("/review");
  revalidatePath("/dashboard");
  return { data };
}

export async function markContentAsReviewed(id: string, targetStatus: ContentStatus = "completed") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await (supabase.from("contents" as any) as any)
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Record a learning activity for review
  const { logLearningActivity } = await import("./activity");
  await logLearningActivity(id, "review", 60);

  revalidatePath("/library");
  revalidatePath("/review");
  revalidatePath("/dashboard");
  return { data };
}

export async function getContentMetrics() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { totalCount: 0, reviewCount: 0, favoriteCount: 0, recentItems: [] };
  }

  const [totalRes, reviewRes, favoriteRes, recentRes] = await Promise.all([
    (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id),
    (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "review"),
    (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_favorite", true),
    (supabase.from("contents" as any) as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    totalCount: totalRes.count || 0,
    reviewCount: reviewRes.count || 0,
    favoriteCount: favoriteRes.count || 0,
    recentItems: recentRes.data || [],
  };
}
