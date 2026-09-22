import { GoogleGenAI } from "@google/genai";

export interface ChunkInput {
  contentId: string;
  transcriptId?: string | null;
  sourceType: "transcript" | "summary" | "note";
  text: string;
  startTime?: number | null;
  endTime?: number | null;
  metadata?: Record<string, unknown>;
}

export interface PreparedChunk {
  contentId: string;
  transcriptId?: string | null;
  chunkIndex: number;
  sourceType: "transcript" | "summary" | "note";
  text: string;
  startTime?: number | null;
  endTime?: number | null;
  metadata: Record<string, unknown>;
}

export interface SegmentItem {
  start_time: number;
  end_time: number;
  text: string;
}

/**
 * Intelligent text chunker:
 * Breaks segment sequences or raw prose into coherent chunks of ~200-400 words (~500 tokens).
 */
export function chunkTranscriptSegments(
  segments: SegmentItem[],
  contentId: string,
  transcriptId: string,
  maxCharsPerChunk = 1200
): PreparedChunk[] {
  if (!segments || segments.length === 0) return [];

  const chunks: PreparedChunk[] = [];
  let currentText = "";
  let chunkStartTime: number | null = null;
  let chunkEndTime: number | null = null;
  let chunkIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (chunkStartTime === null) chunkStartTime = seg.start_time;
    chunkEndTime = seg.end_time;

    if (currentText.length > 0) {
      currentText += " " + seg.text.trim();
    } else {
      currentText = seg.text.trim();
    }

    // Flush chunk if size limit reached or last segment
    if (currentText.length >= maxCharsPerChunk || i === segments.length - 1) {
      chunks.push({
        contentId,
        transcriptId,
        chunkIndex,
        sourceType: "transcript",
        text: currentText,
        startTime: chunkStartTime,
        endTime: chunkEndTime,
        metadata: {
          char_length: currentText.length,
          segment_count: i + 1,
        },
      });

      chunkIndex++;
      currentText = "";
      chunkStartTime = null;
      chunkEndTime = null;
    }
  }

  return chunks;
}

export function chunkText(
  text: string,
  contentId: string,
  sourceType: "summary" | "note",
  maxCharsPerChunk = 1000
): PreparedChunk[] {
  if (!text || !text.trim()) return [];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: PreparedChunk[] = [];
  let currentChunkText = "";
  let chunkIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();

    if (currentChunkText.length > 0 && currentChunkText.length + p.length > maxCharsPerChunk) {
      chunks.push({
        contentId,
        chunkIndex,
        sourceType,
        text: currentChunkText,
        metadata: { char_length: currentChunkText.length },
      });
      chunkIndex++;
      currentChunkText = p;
    } else {
      currentChunkText = currentChunkText ? `${currentChunkText}\n\n${p}` : p;
    }
  }

  if (currentChunkText.trim().length > 0) {
    chunks.push({
      contentId,
      chunkIndex,
      sourceType,
      text: currentChunkText,
      metadata: { char_length: currentChunkText.length },
    });
  }

  return chunks;
}

export class EmbeddingService {
  private getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("placeholder")) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    return apiKey;
  }

  /**
   * Generates a 768-dimensional vector embedding for a query or text chunk.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    if (!text || !text.trim()) {
      throw new Error("Cannot generate embedding for empty text.");
    }

    const candidateModels = [
      "text-embedding-004",
      "embedding-001",
      "models/text-embedding-004",
      "models/embedding-001",
    ];

    let lastError: unknown = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.embedContent({
          model,
          contents: text.trim(),
        });

        const resAny = response as any;
        const embeddingValues =
          resAny.embedding?.values || resAny.embeddings?.[0]?.values || resAny.values;
        if (embeddingValues && Array.isArray(embeddingValues)) {
          return embeddingValues;
        }
      } catch (err: unknown) {
        lastError = err;
      }
    }

    console.error("[EmbeddingService Error]: All candidate models failed. Last error:", lastError);
    if (lastError instanceof Error) {
      throw new Error(`Embedding Generation Failed: ${lastError.message}`);
    }
    throw new Error("Failed to generate vector embedding.");
  }
}

export const embeddingService = new EmbeddingService();
