"use server";

import { createClient } from "@/lib/supabase/server";
import { geminiChatService, ChatMessageContext } from "@/lib/gemini/geminiChatService";
import { revalidatePath } from "next/cache";

export async function getOrCreateItemConversation(contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  // 1. Check if an existing conversation exists for this user and content_id
  const { data: existing, error: fetchErr } = await (supabase.from("ai_conversations" as any) as any)
    .select("*")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { data: existing };
  }

  // 2. Fetch content title to set conversation title
  const { data: contentItem } = await (supabase.from("contents" as any) as any)
    .select("title")
    .eq("id", contentId)
    .single();

  const convTitle = contentItem ? `Chat: ${contentItem.title}` : "Item Discussion";

  // 3. Create new conversation record
  const { data: newConv, error: createErr } = await (supabase.from("ai_conversations" as any) as any)
    .insert({
      user_id: user.id,
      content_id: contentId,
      title: convTitle,
    })
    .select()
    .single();

  if (createErr) {
    return { error: createErr.message };
  }

  return { data: newConv };
}

export async function getItemConversationMessages(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Verify conversation belongs to user
  const { data: conv } = await (supabase.from("ai_conversations" as any) as any)
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conv) return [];

  const { data, error } = await (supabase.from("ai_messages" as any) as any)
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching chat messages:", error.message);
    return [];
  }

  return data as {
    id: string;
    conversation_id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
  }[];
}

export async function sendItemChatMessage(conversationId: string, contentId: string, userQuery: string) {
  if (!userQuery || !userQuery.trim()) {
    return { error: "Query message cannot be empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  // 1. Fetch content item, verifying ownership
  const { data: contentItem } = await (supabase.from("contents" as any) as any)
    .select("title, description")
    .eq("id", contentId)
    .eq("user_id", user.id)
    .single();

  if (!contentItem) return { error: "Content item not found." };

  const { data: transcript } = await (supabase.from("transcripts" as any) as any)
    .select("full_text")
    .eq("content_id", contentId)
    .maybeSingle();

  const { data: summary } = await (supabase.from("ai_summaries" as any) as any)
    .select("summary, detailed_summary")
    .eq("content_id", contentId)
    .maybeSingle();

  const rawTranscriptText = transcript?.full_text || contentItem.description || contentItem.title || "";
  const transcriptText = rawTranscriptText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const summaryText = summary ? `${summary.summary}\n\n${summary.detailed_summary}` : "";

  // 2. Fetch existing message history
  const existingMsgs = await getItemConversationMessages(conversationId);
  const history: ChatMessageContext[] = existingMsgs.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // 3. Save user message to database
  const { data: userMsg, error: userMsgErr } = await (supabase.from("ai_messages" as any) as any)
    .insert({
      conversation_id: conversationId,
      role: "user",
      content: userQuery.trim(),
    })
    .select()
    .single();

  if (userMsgErr) {
    return { error: `Failed to save user message: ${userMsgErr.message}` };
  }

  try {
    // 4. Call server-side Gemini chat service
    const aiAnswer = await geminiChatService.generateItemChatResponse({
      title: contentItem.title,
      transcriptText,
      summaryText,
      history,
      userQuery: userQuery.trim(),
    });

    // 5. Save assistant message to database
    const { data: assistantMsg, error: assistErr } = await (supabase.from("ai_messages" as any) as any)
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: aiAnswer,
      })
      .select()
      .single();

    if (assistErr) {
      return { error: `Failed to save assistant response: ${assistErr.message}` };
    }

    revalidatePath(`/library/${contentId}`);
    return { success: true, userMessage: userMsg, assistantMessage: assistantMsg };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "An error occurred while generating AI response." };
  }
}

export async function clearItemConversation(conversationId: string, contentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  // Verify user owns conversation
  const { data: conv } = await (supabase.from("ai_conversations" as any) as any)
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conv) return { error: "Conversation not found or unauthorized." };

  const { error } = await (supabase.from("ai_messages" as any) as any)
    .delete()
    .eq("conversation_id", conversationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/library/${contentId}`);
  return { success: true };
}
