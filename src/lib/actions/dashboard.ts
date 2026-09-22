"use server";

import { createClient } from "@/lib/supabase/server";
import { getLearningActivitiesOverview } from "./activity";

export interface DashboardMetrics {
  totalContent: number;
  youtubeContent: number;
  uploadedContent: number;
  completedContent: number;
  contentNeedingReview: number;
  favoritesCount: number;
  recentlyAddedCount: number;
  recentlyViewedCount: number;
  recentlyGeneratedSummariesCount: number;

  continueLearningItems: any[];
  needsReviewItems: any[];
  recentlyAddedItems: any[];
  recentlyViewedItems: any[];
  recentSummariesItems: any[];
  activityOverview: {
    totalActivities: number;
    totalDurationMinutes: number;
    activityBreakdown: Record<string, number>;
    recentLogs: any[];
  };
}

export async function getDashboardData(): Promise<{ data: DashboardMetrics | null; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isPlaceholder =
      !supabaseUrl ||
      supabaseUrl.includes("placeholder") ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder");

    const defaultEmptyData: DashboardMetrics = {
      totalContent: 0,
      youtubeContent: 0,
      uploadedContent: 0,
      completedContent: 0,
      contentNeedingReview: 0,
      favoritesCount: 0,
      recentlyAddedCount: 0,
      recentlyViewedCount: 0,
      recentlyGeneratedSummariesCount: 0,
      continueLearningItems: [],
      needsReviewItems: [],
      recentlyAddedItems: [],
      recentlyViewedItems: [],
      recentSummariesItems: [],
      activityOverview: {
        totalActivities: 0,
        totalDurationMinutes: 0,
        activityBreakdown: {},
        recentLogs: [],
      },
    };

    if (isPlaceholder) {
      return { data: defaultEmptyData };
    }

    const supabase = await createClient();
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const user = authData?.user;

    if (authErr || !user) {
      return { data: defaultEmptyData };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Execute all queries in parallel for maximum optimization with user_id index filtering
    const [
      totalRes,
      youtubeRes,
      uploadRes,
      completedRes,
      reviewRes,
      favoriteRes,
      recentlyAddedCountRes,
      aiSummariesCountRes,
      continueLearningRes,
      needsReviewRes,
      recentlyAddedRes,
      recentlyViewedRes,
      recentSummariesRes,
      activityOverviewData,
    ] = await Promise.all([
      // 1. Total Content
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id),
      // 2. YouTube Content
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("source_type", "youtube"),
      // 3. Uploaded Content
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("source_type", "upload"),
      // 4. Completed Content
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      // 5. Needing Review
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "review"),
      // 6. Favorites
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_favorite", true),
      // 7. Recently Added Count (last 30 days)
      (supabase.from("contents" as any) as any).select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      // 8. Generated Summaries Count (relational join with user contents)
      (supabase.from("ai_summaries" as any) as any).select("id, content:contents!inner(user_id)", { count: "exact", head: true }).eq("content.user_id", user.id),

      // 9. Continue Learning Items (in_progress or recently updated unread)
      (supabase.from("contents" as any) as any)
        .select(`
          *,
          category:categories(id, name, color),
          content_tags(tag:tags(id, name))
        `)
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(6),

      // 10. Needs Review Items
      (supabase.from("contents" as any) as any)
        .select(`
          *,
          category:categories(id, name, color),
          content_tags(tag:tags(id, name))
        `)
        .eq("user_id", user.id)
        .eq("status", "review")
        .order("updated_at", { ascending: false })
        .limit(6),

      // 11. Recently Added Items
      (supabase.from("contents" as any) as any)
        .select(`
          *,
          category:categories(id, name, color),
          content_tags(tag:tags(id, name))
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),

      // 12. Recently Viewed Items (ordered by updated_at)
      (supabase.from("contents" as any) as any)
        .select(`
          *,
          category:categories(id, name, color),
          content_tags(tag:tags(id, name))
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(6),

      // 13. Recently Generated Summaries List (ai_summaries with user contents)
      (supabase.from("ai_summaries" as any) as any)
        .select(`
          id,
          model,
          summary,
          detailed_summary,
          key_points,
          created_at,
          content:contents!inner(
            id,
            user_id,
            title,
            content_type,
            source_type,
            thumbnail_url,
            status,
            category:categories(id, name, color)
          )
        `)
        .eq("content.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),

      // 14. Activity Overview
      getLearningActivitiesOverview(),
    ]);

    // Fallback for Continue Learning items if no in_progress items exist: show recent unread items
    let continueItems = continueLearningRes.data || [];
    if (continueItems.length === 0) {
      const fallbackRes = await (supabase.from("contents" as any) as any)
        .select(`
          *,
          category:categories(id, name, color),
          content_tags(tag:tags(id, name))
        `)
        .eq("user_id", user.id)
        .eq("status", "unread")
        .order("updated_at", { ascending: false })
        .limit(6);
      continueItems = fallbackRes.data || [];
    }

    const recentlyViewedCount = activityOverviewData.totalActivities || (recentlyViewedRes.data?.length || 0);

    return {
      data: {
        totalContent: totalRes.count || 0,
        youtubeContent: youtubeRes.count || 0,
        uploadedContent: uploadRes.count || 0,
        completedContent: completedRes.count || 0,
        contentNeedingReview: reviewRes.count || 0,
        favoritesCount: favoriteRes.count || 0,
        recentlyAddedCount: recentlyAddedCountRes.count || 0,
        recentlyViewedCount: recentlyViewedCount,
        recentlyGeneratedSummariesCount: aiSummariesCountRes.count || 0,

        continueLearningItems: continueItems,
        needsReviewItems: needsReviewRes.data || [],
        recentlyAddedItems: recentlyAddedRes.data || [],
        recentlyViewedItems: recentlyViewedRes.data || [],
        recentSummariesItems: recentSummariesRes.data || [],
        activityOverview: activityOverviewData,
      },
    };
  } catch (err: any) {
    console.error("Error loading dashboard data:", err);
    return { data: null, error: err.message };
  }
}
