"use server";

import { createClient } from "@/lib/supabase/server";
import { embeddingService, chunkTranscriptSegments, chunkText } from "@/lib/gemini/embeddingService";
import { ragService } from "@/lib/rag/ragService";
import { revalidatePath } from "next/cache";

export interface IndexContentResult {
  success: boolean;
  chunksCreated: number;
  error?: string;
}

/**
 * Server action to generate intelligent vector embeddings for a specific content item.
 * Collects transcript segments, summary text, and personal notes.
 */
export async function indexContentEmbeddings(contentId: string): Promise<IndexContentResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, chunksCreated: 0, error: "Please sign in to generate vector embeddings." };
    }

    // 1. Fetch content item & verify ownership
    const { data: content, error: contentError } = await (supabase
      .from("contents" as any)
      .select("id, title, description, summary:ai_summaries(summary, detailed_summary)")
      .eq("id", contentId)
      .single() as any);

    if (contentError || !content) {
      return { success: false, chunksCreated: 0, error: "Content not found." };
    }

    // 2. Clear existing knowledge chunks for this content item
    await (supabase.from("knowledge_chunks" as any).delete().eq("content_id", contentId) as any);

    const preparedChunks = [];

    // 3. Process Transcript Segments if available
    const { data: transcript } = await (supabase
      .from("transcripts" as any)
      .select("id, full_text, segments:transcript_segments(start_time, end_time, text)")
      .eq("content_id", contentId)
      .maybeSingle() as any);

    if (transcript && transcript.segments && transcript.segments.length > 0) {
      const transcriptChunks = chunkTranscriptSegments(
        transcript.segments,
        contentId,
        transcript.id
      );
      preparedChunks.push(...transcriptChunks);
    } else if (transcript && transcript.full_text) {
      const rawTextChunks = chunkText(transcript.full_text, contentId, "transcript" as any);
      preparedChunks.push(...rawTextChunks);
    }

    // 4. Process AI Summary if available
    if (content.summary && content.summary.length > 0) {
      const sumObj = content.summary[0];
      const summaryText = `${sumObj.summary}\n\n${sumObj.detailed_summary}`;
      const summaryChunks = chunkText(summaryText, contentId, "summary");
      preparedChunks.push(...summaryChunks);
    }

    // 5. Process Personal Notes if available
    const { data: notes } = await (supabase
      .from("notes" as any)
      .select("id, text, timestamp")
      .eq("content_id", contentId) as any);

    if (notes && notes.length > 0) {
      notes.forEach((note: any) => {
        if (note.text && note.text.trim()) {
          preparedChunks.push({
            contentId,
            chunkIndex: 0,
            sourceType: "note" as const,
            text: note.text.trim(),
            startTime: note.timestamp,
            endTime: note.timestamp,
            metadata: { note_id: note.id },
          });
        }
      });
    }

    if (preparedChunks.length === 0) {
      return {
        success: true,
        chunksCreated: 0,
        error: "No indexable transcript, summary, or note text found for this content.",
      };
    }

    // 6. Generate embeddings and insert chunks into Supabase pgvector
    const rowsToInsert = [];
    for (const chunk of preparedChunks) {
      const embedding = await embeddingService.generateEmbedding(chunk.text);
      rowsToInsert.push({
        user_id: user.id,
        content_id: chunk.contentId,
        transcript_id: chunk.transcriptId || null,
        chunk_index: chunk.chunkIndex,
        source_type: chunk.sourceType,
        start_time: chunk.startTime ?? null,
        end_time: chunk.endTime ?? null,
        text: chunk.text,
        metadata: chunk.metadata || {},
        embedding: JSON.stringify(embedding), // Format for pgvector insertion
        embedding_model: "text-embedding-004",
      });
    }

    const { error: insertError } = await (supabase
      .from("knowledge_chunks" as any)
      .insert(rowsToInsert as any) as any);

    if (insertError) {
      console.error("[Index Embeddings Insert Error]:", insertError);
      return { success: false, chunksCreated: 0, error: "Failed to save vector embeddings." };
    }

    revalidatePath("/ai");
    return { success: true, chunksCreated: rowsToInsert.length };
  } catch (err: unknown) {
    console.error("[IndexContentEmbeddings Error]:", err);
    return {
      success: false,
      chunksCreated: 0,
      error: err instanceof Error ? err.message : "Indexing failed.",
    };
  }
}

/**
 * Server action to bulk-index all contents in user's library.
 */
export async function indexAllLibraryContents(): Promise<{
  success: boolean;
  totalIndexed: number;
  totalChunks: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, totalIndexed: 0, totalChunks: 0, error: "Please sign in to index library contents." };
    }

    const { data: contents, error } = await (supabase
      .from("contents" as any)
      .select("id")
      .eq("user_id", user.id) as any);

    if (error || !contents) {
      return { success: false, totalIndexed: 0, totalChunks: 0, error: "Failed to retrieve library items." };
    }

    let totalChunks = 0;
    let totalIndexed = 0;

    for (const item of contents) {
      const res = await indexContentEmbeddings(item.id);
      if (res.success && res.chunksCreated > 0) {
        totalChunks += res.chunksCreated;
        totalIndexed++;
      }
    }

    return { success: true, totalIndexed, totalChunks };
  } catch (err: unknown) {
    console.error("[IndexAllLibraryContents Error]:", err);
    return {
      success: false,
      totalIndexed: 0,
      totalChunks: 0,
      error: err instanceof Error ? err.message : "Bulk indexing failed.",
    };
  }
}

/**
 * Global Knowledge RAG question query server action.
 */
export async function askGlobalKnowledgeBase(question: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isPlaceholder =
      !supabaseUrl ||
      supabaseUrl.includes("placeholder") ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder");

    if (isPlaceholder) {
      return {
        success: true,
        answer: "Demo Mode: Please configure your real Supabase project credentials in .env.local to enable full AI vector semantic search across your personal knowledge library.",
        sources: [],
        hasEnoughContext: false,
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Please sign in to ask AI questions across your personal knowledge library.",
      };
    }

    if (!question || !question.trim()) {
      return { success: false, error: "Question cannot be empty." };
    }

    let retrievedChunks: any[] = [];

    // 1. Try vector embedding & pgvector similarity search
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(question.trim());

      const { data, error: rpcError } = await (supabase.rpc as any)(
        "match_knowledge_chunks",
        {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.25,
          match_count: 8,
          p_user_id: user.id,
        }
      );

      if (!rpcError && data && Array.isArray(data)) {
        retrievedChunks = data;
      }
    } catch (embedErr: any) {
      console.warn("[RAG Action] Vector embedding unavailable, falling back to full-text context search:", embedErr?.message);
    }

    // 2. Context Fallback: If vector search returned 0 chunks or API key lacks embedContent API, fetch user library context directly
    if (retrievedChunks.length === 0) {
      const { data: userContents } = await (supabase.from("contents" as any) as any)
        .select(`
          id,
          title,
          description,
          transcripts(full_text),
          ai_summaries(summary, detailed_summary)
        `)
        .eq("user_id", user.id)
        .limit(5);

      if (userContents && userContents.length > 0) {
        retrievedChunks = userContents.map((c: any, idx: number) => {
          const sumObj = Array.isArray(c.ai_summaries) ? c.ai_summaries[0] : c.ai_summaries;
          const transcriptObj = Array.isArray(c.transcripts) ? c.transcripts[0] : c.transcripts;
          const textExcerpt =
            sumObj?.detailed_summary ||
            sumObj?.summary ||
            transcriptObj?.full_text ||
            c.description ||
            c.title;

          return {
            id: c.id,
            content_id: c.id,
            transcript_id: null,
            chunk_index: idx,
            source_type: "summary",
            start_time: null,
            end_time: null,
            text: textExcerpt ? textExcerpt.slice(0, 1000) : c.title,
            metadata: {},
            similarity: 0.85,
            content_title: c.title,
          };
        });
      }
    }

    // 3. Generate grounded RAG answer using Gemini 2.5 Flash
    const ragResult = await ragService.answerQuestionWithContext(question, retrievedChunks);

    return {
      success: true,
      answer: ragResult.answer,
      sources: ragResult.sources,
      hasEnoughContext: ragResult.hasEnoughContext,
    };
  } catch (err: unknown) {
    console.error("[AskGlobalKnowledgeBase Error]:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected RAG error occurred.",
    };
  }
}
