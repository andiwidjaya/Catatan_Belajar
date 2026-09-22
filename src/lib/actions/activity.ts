"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function logLearningActivity(
  contentId: string | null,
  activityType: string,
  duration: number = 0
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthenticated" };

    const { data, error } = await (supabase.from("learning_activities" as any) as any)
      .insert({
        user_id: user.id,
        content_id: contentId,
        activity_type: activityType,
        duration: duration,
      })
      .select()
      .single();

    if (error) {
      console.error("Error logging activity:", error.message);
      return { error: error.message };
    }

    revalidatePath("/dashboard");
    return { data };
  } catch (err: any) {
    console.error("Failed to log activity:", err);
    return { error: err.message };
  }
}

export async function getLearningActivitiesOverview() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        totalActivities: 0,
        totalDurationMinutes: 0,
        activityBreakdown: {},
        recentLogs: [],
      };
    }

    // Query recent 30 activities
    const { data: activities, error } = await (supabase.from("learning_activities" as any) as any)
      .select(`
        id,
        activity_type,
        duration,
        created_at,
        content_id,
        content:contents(id, title, content_type)
      `)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching activities overview:", error.message);
      return {
        totalActivities: 0,
        totalDurationMinutes: 0,
        activityBreakdown: {},
        recentLogs: [],
      };
    }

    const totalActivities = activities?.length || 0;
    let totalSeconds = 0;
    const activityBreakdown: Record<string, number> = {};

    (activities || []).forEach((act: any) => {
      totalSeconds += act.duration || 0;
      const type = act.activity_type || "view";
      activityBreakdown[type] = (activityBreakdown[type] || 0) + 1;
    });

    return {
      totalActivities,
      totalDurationMinutes: Math.round(totalSeconds / 60),
      activityBreakdown,
      recentLogs: activities || [],
    };
  } catch (err) {
    console.error("Error in getLearningActivitiesOverview:", err);
    return {
      totalActivities: 0,
      totalDurationMinutes: 0,
      activityBreakdown: {},
      recentLogs: [],
    };
  }
}
