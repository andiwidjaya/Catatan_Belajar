-- ====================================================================
-- MIGRATION: 20260921000002_create_search_function.sql
-- PURPOSE: Global PostgreSQL full-text & relational search RPC function
-- ====================================================================

-- 1. Create text search indexes for high performance
CREATE INDEX IF NOT EXISTS idx_contents_fts ON contents
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_transcripts_fts ON transcripts
USING gin(to_tsvector('english', full_text));

CREATE INDEX IF NOT EXISTS idx_ai_summaries_fts ON ai_summaries
USING gin(to_tsvector('english', summary || ' ' || detailed_summary));

-- 2. Create search RPC function
CREATE OR REPLACE FUNCTION search_knowledge_library(
  p_user_id UUID,
  p_query TEXT,
  p_content_type TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_tag_id UUID DEFAULT NULL,
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'relevance',
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  content_type content_type,
  source_type source_type,
  source_url TEXT,
  source_id TEXT,
  thumbnail_url TEXT,
  duration NUMERIC,
  language TEXT,
  category_id UUID,
  status content_status,
  is_favorite BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  match_source TEXT,
  match_snippet TEXT,
  relevance_rank REAL,
  total_count BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_search_pattern TEXT;
BEGIN
  v_search_pattern := '%' || p_query || '%';

  RETURN QUERY
  WITH matched_items AS (
    SELECT DISTINCT ON (c.id)
      c.id,
      c.user_id,
      c.title,
      c.description,
      c.content_type,
      c.source_type,
      c.source_url,
      c.source_id,
      c.thumbnail_url,
      c.duration,
      c.language,
      c.category_id,
      c.status,
      c.is_favorite,
      c.created_at,
      c.updated_at,
      CASE
        WHEN c.title ILIKE v_search_pattern THEN 'title'
        WHEN c.description ILIKE v_search_pattern THEN 'description'
        WHEN t.full_text ILIKE v_search_pattern THEN 'transcript'
        WHEN s.summary ILIKE v_search_pattern OR s.detailed_summary ILIKE v_search_pattern THEN 'ai_summary'
        WHEN n.text ILIKE v_search_pattern THEN 'note'
        WHEN tg.name ILIKE v_search_pattern THEN 'tag'
        ELSE 'general'
      END AS match_source,
      CASE
        WHEN c.title ILIKE v_search_pattern THEN c.title
        WHEN c.description ILIKE v_search_pattern THEN c.description
        WHEN t.full_text ILIKE v_search_pattern THEN SUBSTRING(t.full_text FROM GREATEST(1, POSITION(p_query IN LOWER(t.full_text)) - 40) FOR 150)
        WHEN s.summary ILIKE v_search_pattern THEN SUBSTRING(s.summary FROM GREATEST(1, POSITION(p_query IN LOWER(s.summary)) - 40) FOR 150)
        WHEN n.text ILIKE v_search_pattern THEN SUBSTRING(n.text FROM GREATEST(1, POSITION(p_query IN LOWER(n.text)) - 40) FOR 150)
        WHEN tg.name ILIKE v_search_pattern THEN tg.name
        ELSE c.title
      END AS match_snippet,
      (
        CASE WHEN c.title ILIKE v_search_pattern THEN 1.0 ELSE 0.0 END +
        CASE WHEN c.description ILIKE v_search_pattern THEN 0.8 ELSE 0.0 END +
        CASE WHEN s.summary ILIKE v_search_pattern THEN 0.6 ELSE 0.0 END +
        CASE WHEN t.full_text ILIKE v_search_pattern THEN 0.4 ELSE 0.0 END +
        CASE WHEN n.text ILIKE v_search_pattern THEN 0.3 ELSE 0.0 END
      )::REAL AS relevance_rank
    FROM contents c
    LEFT JOIN transcripts t ON t.content_id = c.id
    LEFT JOIN ai_summaries s ON s.content_id = c.id
    LEFT JOIN notes n ON n.content_id = c.id
    LEFT JOIN content_tags ct ON ct.content_id = c.id
    LEFT JOIN tags tg ON tg.id = ct.tag_id
    WHERE c.user_id = p_user_id
      AND (
        p_query = '' OR
        c.title ILIKE v_search_pattern OR
        c.description ILIKE v_search_pattern OR
        t.full_text ILIKE v_search_pattern OR
        s.summary ILIKE v_search_pattern OR
        s.detailed_summary ILIKE v_search_pattern OR
        n.text ILIKE v_search_pattern OR
        tg.name ILIKE v_search_pattern
      )
      AND (p_content_type IS NULL OR c.content_type::TEXT = p_content_type)
      AND (p_source_type IS NULL OR c.source_type::TEXT = p_source_type)
      AND (p_status IS NULL OR c.status::TEXT = p_status)
      AND (p_category_id IS NULL OR c.category_id = p_category_id)
      AND (p_tag_id IS NULL OR ct.tag_id = p_tag_id)
      AND (p_is_favorite IS NULL OR c.is_favorite = p_is_favorite)
      AND (p_date_from IS NULL OR c.created_at >= p_date_from)
      AND (p_date_to IS NULL OR c.created_at <= p_date_to)
  ),
  counted_items AS (
    SELECT COUNT(*) AS full_count FROM matched_items
  )
  SELECT
    m.id,
    m.user_id,
    m.title,
    m.description,
    m.content_type,
    m.source_type,
    m.source_url,
    m.source_id,
    m.thumbnail_url,
    m.duration,
    m.language,
    m.category_id,
    m.status,
    m.is_favorite,
    m.created_at,
    m.updated_at,
    m.match_source,
    m.match_snippet,
    m.relevance_rank,
    c.full_count AS total_count
  FROM matched_items m, counted_items c
  ORDER BY
    CASE WHEN p_sort_by = 'relevance' THEN m.relevance_rank END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN m.created_at END DESC,
    CASE WHEN p_sort_by = 'oldest' THEN m.created_at END ASC,
    CASE WHEN p_sort_by = 'title_asc' THEN m.title END ASC,
    CASE WHEN p_sort_by = 'title_desc' THEN m.title END DESC,
    m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
