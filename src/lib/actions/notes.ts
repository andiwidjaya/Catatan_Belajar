"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotesForContent(contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Verify user ownership of content
  const { data: content } = await (supabase.from("contents" as any) as any)
    .select("id")
    .eq("id", contentId)
    .eq("user_id", user.id)
    .single();

  if (!content) return [];

  const { data, error } = await (supabase.from("notes" as any) as any)
    .select("*")
    .eq("content_id", contentId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error.message);
    return [];
  }

  return data as {
    id: string;
    user_id: string;
    content_id: string;
    text: string;
    timestamp: number | null;
    created_at: string;
    updated_at: string;
  }[];
}

export async function createNote(contentId: string, text: string, timestamp?: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };
  if (!text || !text.trim()) return { error: "Note text cannot be empty." };

  // Verify user owns content item before creating note
  const { data: content } = await (supabase.from("contents" as any) as any)
    .select("id")
    .eq("id", contentId)
    .eq("user_id", user.id)
    .single();

  if (!content) return { error: "Content item not found or unauthorized." };

  const { data, error } = await (supabase.from("notes" as any) as any)
    .insert({
      user_id: user.id,
      content_id: contentId,
      text: text.trim(),
      timestamp: timestamp !== undefined ? timestamp : null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${contentId}`);
  return { data };
}

export async function updateNote(noteId: string, contentId: string, text: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };
  if (!text || !text.trim()) return { error: "Note text cannot be empty." };

  const { data, error } = await (supabase.from("notes" as any) as any)
    .update({ text: text.trim(), updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${contentId}`);
  return { data };
}

export async function deleteNote(noteId: string, contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { error } = await (supabase.from("notes" as any) as any)
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${contentId}`);
  return { success: true };
}
