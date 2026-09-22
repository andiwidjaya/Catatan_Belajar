"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaveTranscriptInput {
  contentId: string;
  fullText: string;
  language?: string;
  segments?: {
    startTime: number;
    endTime: number;
    text: string;
    sequence: number;
  }[];
}

export async function getTranscriptForContent(contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Verify content ownership
  const { data: content } = await (supabase.from("contents" as any) as any)
    .select("id")
    .eq("id", contentId)
    .eq("user_id", user.id)
    .single();

  if (!content) return null;

  const { data: transcript, error } = await (supabase.from("transcripts" as any) as any)
    .select(`
      *,
      transcript_segments(*)
    `)
    .eq("content_id", contentId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching transcript:", error.message);
    return null;
  }

  return transcript;
}

export async function saveRawTranscript(input: SaveTranscriptInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  // Verify user ownership of content item
  const { data: contentItem } = await (supabase.from("contents" as any) as any)
    .select("id")
    .eq("id", input.contentId)
    .eq("user_id", user.id)
    .single();

  if (!contentItem) return { error: "Content item not found or unauthorized." };

  // 1. Insert or update transcripts table (Raw source data saved separately)
  const { data: transcript, error } = await (supabase.from("transcripts" as any) as any)
    .upsert(
      {
        content_id: input.contentId,
        full_text: input.fullText,
        language: input.language || "en",
      },
      { onConflict: "content_id" }
    )
    .select()
    .single();

  if (error) {
    return { error: `Failed to save raw transcript: ${error.message}` };
  }

  // 2. Insert segments if provided
  if (input.segments && input.segments.length > 0) {
    await (supabase.from("transcript_segments" as any) as any).delete().eq("transcript_id", transcript.id);
    const segmentRows = input.segments.map((s) => ({
      transcript_id: transcript.id,
      start_time: s.startTime,
      end_time: s.endTime,
      text: s.text,
      sequence: s.sequence,
    }));
    await (supabase.from("transcript_segments" as any) as any).insert(segmentRows);
  }

  revalidatePath(`/library/${input.contentId}`);
  return { data: transcript };
}
