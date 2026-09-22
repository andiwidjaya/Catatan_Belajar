-- Migration: 20260921000003_create_vector_embeddings.sql
-- Description: Create knowledge_chunks table with pgvector embeddings and similarity search RPC

CREATE EXTENSION IF NOT EXISTS vector;

-- Create knowledge_chunks table
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    transcript_id UUID REFERENCES public.transcripts(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    source_type TEXT NOT NULL CHECK (source_type IN ('transcript', 'summary', 'note')),
    start_time NUMERIC(10, 2),
    end_time NUMERIC(10, 2),
    text TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(768),
    embedding_model TEXT NOT NULL DEFAULT 'text-embedding-004',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on knowledge_chunks
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_chunks
CREATE POLICY "Users can view own knowledge_chunks"
    ON public.knowledge_chunks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own knowledge_chunks"
    ON public.knowledge_chunks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge_chunks"
    ON public.knowledge_chunks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge_chunks"
    ON public.knowledge_chunks FOR DELETE
    USING (auth.uid() = user_id);

-- Create HNSW vector index for cosine similarity
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
    ON public.knowledge_chunks 
    USING hnsw (embedding vector_cosine_ops);

-- Create indexes for lookups and user isolation
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_user_id ON public.knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_content_id ON public.knowledge_chunks(content_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_transcript_id ON public.knowledge_chunks(transcript_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_type ON public.knowledge_chunks(source_type);

-- Updated_at trigger
CREATE TRIGGER update_knowledge_chunks_modtime
    BEFORE UPDATE ON public.knowledge_chunks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function for similarity search
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 10,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content_id UUID,
    transcript_id UUID,
    chunk_index INT,
    source_type TEXT,
    start_time NUMERIC,
    end_time NUMERIC,
    text TEXT,
    metadata JSONB,
    similarity FLOAT,
    content_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kc.id,
        kc.content_id,
        kc.transcript_id,
        kc.chunk_index,
        kc.source_type,
        kc.start_time,
        kc.end_time,
        kc.text,
        kc.metadata,
        1 - (kc.embedding <=> query_embedding) AS similarity,
        c.title AS content_title
    FROM public.knowledge_chunks kc
    JOIN public.contents c ON c.id = kc.content_id
    WHERE (p_user_id IS NULL OR kc.user_id = p_user_id)
      AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
    ORDER BY kc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
