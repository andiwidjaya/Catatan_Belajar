"use server";

import { createClient } from "@/lib/supabase/server";
import { geminiService } from "@/lib/gemini/geminiService";
import { revalidatePath } from "next/cache";
import { ContentStatus } from "@/types/database.types";

export async function getAISummaryForContent(contentId: string) {
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

  const { data, error } = await (supabase.from("ai_summaries" as any) as any)
    .select("*")
    .eq("content_id", contentId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching AI summary:", error.message);
    return null;
  }

  return data;
}

export async function triggerGeminiSummarization(contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  // 1. Fetch content item & verify user ownership
  const { data: content, error: contentError } = await (supabase.from("contents" as any) as any)
    .select("*")
    .eq("id", contentId)
    .eq("user_id", user.id)
    .single();

  if (contentError || !content) {
    return { error: "Content item not found." };
  }

  const { data: transcript, error: transcriptError } = await (supabase.from("transcripts" as any) as any)
    .select("full_text")
    .eq("content_id", contentId)
    .maybeSingle();

  const rawTranscriptText = transcript?.full_text || content.description || content.title;

  if (!rawTranscriptText || !rawTranscriptText.trim()) {
    return { error: "No transcript or text content available to summarize. Please add transcript or notes first." };
  }

  // Normalize excessive whitespace/newlines to optimize payload size & AI processing efficiency
  const normalizedText = rawTranscriptText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  // 2. Mark processing status as 'in_progress'
  await (supabase.from("contents" as any) as any)
    .update({ status: "in_progress" as ContentStatus })
    .eq("id", contentId);

  try {
    // 3. Invoke server-side Gemini service
    const { summary, model } = await geminiService.generateStructuredSummary({
      title: content.title,
      transcriptText: normalizedText,
    });

    // 4. Upsert structured AI summary into ai_summaries table
    const { data: aiSummary, error: summaryError } = await (supabase.from("ai_summaries" as any) as any)
      .upsert(
        {
          content_id: contentId,
          model,
          summary: summary.summary,
          detailed_summary: summary.detailed_summary,
          key_points: summary.key_points,
          concepts: summary.concepts,
          keywords: summary.keywords,
        },
        { onConflict: "content_id" }
      )
      .select()
      .single();

    if (summaryError) {
      await (supabase.from("contents" as any) as any)
        .update({ status: "unread" as ContentStatus })
        .eq("id", contentId);
      return { error: `Failed to save AI summary: ${summaryError.message}` };
    }

    // 5. Update content status to 'completed'
    await (supabase.from("contents" as any) as any)
      .update({ status: "completed" as ContentStatus })
      .eq("id", contentId);

    revalidatePath(`/library/${contentId}`);
    revalidatePath("/library");
    revalidatePath("/dashboard");

    return { success: true, data: aiSummary };
  } catch (err: unknown) {
    // Mark status back to unread on failure to allow retry
    await (supabase.from("contents" as any) as any)
      .update({ status: "unread" as ContentStatus })
      .eq("id", contentId);

    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "An unexpected error occurred during AI processing." };
  }
}
