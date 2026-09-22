"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserPreferences {
  defaultLanguage: string;
  defaultContentStatus: string;
  summaryLanguage: string;
  preferredSummaryLength: string;
}

export interface UserSettingsData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  preferences: UserPreferences;
}

export async function getUserSettings(): Promise<{ data: UserSettingsData | null; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { data: null, error: "Unauthenticated" };
    }

    // Query profiles table
    const { data: profile } = await (supabase.from("profiles" as any) as any)
      .select("*")
      .eq("id", user.id)
      .single();

    const metadata = user.user_metadata || {};

    const preferences: UserPreferences = {
      defaultLanguage: metadata.default_language || "en",
      defaultContentStatus: metadata.default_content_status || "unread",
      summaryLanguage: metadata.summary_language || "en",
      preferredSummaryLength: metadata.preferred_summary_length || "standard",
    };

    return {
      data: {
        id: user.id,
        email: user.email || profile?.email || "",
        fullName: profile?.full_name || metadata.full_name || "Knowledge User",
        avatarUrl: profile?.avatar_url || undefined,
        preferences,
      },
    };
  } catch (err: any) {
    console.error("Error fetching user settings:", err);
    return { data: null, error: err.message };
  }
}

export async function updateProfile(fullName: string) {
  if (!fullName || !fullName.trim()) {
    return { error: "Full name cannot be empty." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthenticated" };

    const cleanName = fullName.trim();

    // 1. Update auth metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: { full_name: cleanName },
    });

    if (authErr) {
      return { error: authErr.message };
    }

    // 2. Update profiles table
    await (supabase.from("profiles" as any) as any)
      .update({
        full_name: cleanName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating profile:", err);
    return { error: err.message };
  }
}

export async function updateUserPreferences(prefs: Partial<UserPreferences>) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthenticated" };

    const currentMeta = user.user_metadata || {};

    const updatedData: Record<string, any> = { ...currentMeta };

    if (prefs.defaultLanguage !== undefined) updatedData.default_language = prefs.defaultLanguage;
    if (prefs.defaultContentStatus !== undefined) updatedData.default_content_status = prefs.defaultContentStatus;
    if (prefs.summaryLanguage !== undefined) updatedData.summary_language = prefs.summaryLanguage;
    if (prefs.preferredSummaryLength !== undefined) updatedData.preferred_summary_length = prefs.preferredSummaryLength;

    const { error } = await supabase.auth.updateUser({
      data: updatedData,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating preferences:", err);
    return { error: err.message };
  }
}

export async function deleteUserAccountData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthenticated" };

    // Delete user contents (cascades to transcripts, summaries, notes, content_tags, learning_activities)
    await (supabase.from("contents" as any) as any).delete().eq("user_id", user.id);
    // Delete categories
    await (supabase.from("categories" as any) as any).delete().eq("user_id", user.id);
    // Delete tags
    await (supabase.from("tags" as any) as any).delete().eq("user_id", user.id);
    // Delete profile
    await (supabase.from("profiles" as any) as any).delete().eq("id", user.id);

    // Sign out user
    await supabase.auth.signOut();

    return { success: true };
  } catch (err: any) {
    console.error("Error deleting account data:", err);
    return { error: err.message };
  }
}
