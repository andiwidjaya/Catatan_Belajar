-- ====================================================================
-- MIGRATION: 20260921000000_create_knowledge_library_schema.sql
-- PROJECT: Personal Knowledge Library
-- PURPOSE: Production PostgreSQL schema with full RLS, indexes, and trigger functions
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Custom Types / Enums
CREATE TYPE content_type AS ENUM ('video', 'audio', 'text');
CREATE TYPE source_type AS ENUM ('youtube', 'upload', 'manual');
CREATE TYPE content_status AS ENUM ('unread', 'in_progress', 'completed', 'review');

-- ====================================================================
-- TABLE 1: PROFILES
-- Links to Supabase auth.users table
-- ====================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 2: CATEGORIES
-- User-defined categories for content organization
-- ====================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4F46E5',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT categories_name_user_id_key UNIQUE (user_id, name)
);

-- ====================================================================
-- TABLE 3: CONTENTS
-- Core registry for YouTube videos, audio/video uploads, & text entries
-- ====================================================================
CREATE TABLE contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    source_type source_type NOT NULL,
    source_url TEXT,
    source_id TEXT,
    thumbnail_url TEXT,
    duration NUMERIC DEFAULT 0, -- Duration in seconds
    language TEXT DEFAULT 'en' NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status content_status DEFAULT 'unread' NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 4: TRANSCRIPTS
-- Raw transcript data for a content item
-- ====================================================================
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE UNIQUE,
    language TEXT DEFAULT 'en' NOT NULL,
    full_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 5: TRANSCRIPT_SEGMENTS
-- Timestamped segments for media playback syncing
-- ====================================================================
CREATE TABLE transcript_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
    start_time NUMERIC NOT NULL,
    end_time NUMERIC NOT NULL,
    text TEXT NOT NULL,
    sequence INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 6: AI_SUMMARIES
-- Gemini AI generated structured summaries, key points, concepts, keywords
-- ====================================================================
CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE UNIQUE,
    model TEXT NOT NULL,
    summary TEXT NOT NULL,
    detailed_summary TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb NOT NULL,
    concepts JSONB DEFAULT '[]'::jsonb NOT NULL,
    keywords TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 7: TAGS
-- User-defined tags
-- ====================================================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT tags_name_user_id_key UNIQUE (user_id, name)
);

-- ====================================================================
-- TABLE 8: CONTENT_TAGS
-- Many-to-many junction table between contents and tags
-- ====================================================================
CREATE TABLE content_tags (
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, tag_id)
);

-- ====================================================================
-- TABLE 9: NOTES
-- User personal notes attached to content items
-- ====================================================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    timestamp NUMERIC, -- Optional media playback timestamp reference
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 10: AI_CONVERSATIONS
-- Chat conversation sessions (item-level or library-wide)
-- ====================================================================
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE, -- NULL for library-wide RAG chat
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 11: AI_MESSAGES
-- Individual messages inside AI chat conversations
-- ====================================================================
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- TABLE 12: LEARNING_ACTIVITIES
-- Activity log for user reviews, reads, and study sessions
-- ====================================================================
CREATE TABLE learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    duration INT DEFAULT 0 NOT NULL, -- Duration in seconds
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ====================================================================
-- INDEXES
-- Optimized indexes for lookup performance & search filters
-- ====================================================================
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_contents_user_id ON contents(user_id);
CREATE INDEX idx_contents_category_id ON contents(category_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX idx_contents_title ON contents(title);
CREATE INDEX idx_contents_source_type ON contents(source_type);
CREATE INDEX idx_contents_content_type ON contents(content_type);
CREATE INDEX idx_transcripts_content_id ON transcripts(content_id);
CREATE INDEX idx_transcript_segments_transcript_id ON transcript_segments(transcript_id);
CREATE INDEX idx_ai_summaries_content_id ON ai_summaries(content_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_content_id ON notes(content_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_content_id ON ai_conversations(content_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_learning_activities_user_id ON learning_activities(user_id);
CREATE INDEX idx_learning_activities_content_id ON learning_activities(content_id);

-- ====================================================================
-- TRIGGER FUNCTIONS
-- 1. Auto-update updated_at timestamps
-- 2. Auto-create profile on auth.users sign-up
-- ====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contents_updated_at BEFORE UPDATE ON contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_summaries_updated_at BEFORE UPDATE ON ai_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically insert a row into profiles when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures complete multi-tenant user data isolation
-- ====================================================================

-- Enable RLS on all 12 tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. CATEGORIES POLICIES
CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- 3. CONTENTS POLICIES
CREATE POLICY "Users can view their own contents" ON contents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contents" ON contents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contents" ON contents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contents" ON contents FOR DELETE USING (auth.uid() = user_id);

-- 4. TRANSCRIPTS POLICIES (Linked via contents)
CREATE POLICY "Users can view transcripts of their contents" ON transcripts FOR SELECT
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = transcripts.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can insert transcripts for their contents" ON transcripts FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM contents WHERE contents.id = transcripts.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can update transcripts of their contents" ON transcripts FOR UPDATE
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = transcripts.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can delete transcripts of their contents" ON transcripts FOR DELETE
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = transcripts.content_id AND contents.user_id = auth.uid()));

-- 5. TRANSCRIPT_SEGMENTS POLICIES (Linked via transcripts -> contents)
CREATE POLICY "Users can view transcript segments of their contents" ON transcript_segments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM transcripts 
        JOIN contents ON contents.id = transcripts.content_id 
        WHERE transcripts.id = transcript_segments.transcript_id AND contents.user_id = auth.uid()
    ));
CREATE POLICY "Users can insert transcript segments for their contents" ON transcript_segments FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM transcripts 
        JOIN contents ON contents.id = transcripts.content_id 
        WHERE transcripts.id = transcript_segments.transcript_id AND contents.user_id = auth.uid()
    ));
CREATE POLICY "Users can delete transcript segments of their contents" ON transcript_segments FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM transcripts 
        JOIN contents ON contents.id = transcripts.content_id 
        WHERE transcripts.id = transcript_segments.transcript_id AND contents.user_id = auth.uid()
    ));

-- 6. AI_SUMMARIES POLICIES (Linked via contents)
CREATE POLICY "Users can view AI summaries of their contents" ON ai_summaries FOR SELECT
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = ai_summaries.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can insert AI summaries for their contents" ON ai_summaries FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM contents WHERE contents.id = ai_summaries.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can update AI summaries of their contents" ON ai_summaries FOR UPDATE
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = ai_summaries.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can delete AI summaries of their contents" ON ai_summaries FOR DELETE
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = ai_summaries.content_id AND contents.user_id = auth.uid()));

-- 7. TAGS POLICIES
CREATE POLICY "Users can view their own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- 8. CONTENT_TAGS POLICIES
CREATE POLICY "Users can view content tags for their contents" ON content_tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = content_tags.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can insert content tags for their contents" ON content_tags FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM contents WHERE contents.id = content_tags.content_id AND contents.user_id = auth.uid()));
CREATE POLICY "Users can delete content tags from their contents" ON content_tags FOR DELETE
    USING (EXISTS (SELECT 1 FROM contents WHERE contents.id = content_tags.content_id AND contents.user_id = auth.uid()));

-- 9. NOTES POLICIES
CREATE POLICY "Users can view their own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- 10. AI_CONVERSATIONS POLICIES
CREATE POLICY "Users can view their own AI conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI conversations" ON ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI conversations" ON ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- 11. AI_MESSAGES POLICIES (Linked via ai_conversations)
CREATE POLICY "Users can view AI messages of their conversations" ON ai_messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));
CREATE POLICY "Users can insert AI messages into their conversations" ON ai_messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));
CREATE POLICY "Users can delete AI messages from their conversations" ON ai_messages FOR DELETE
    USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

-- 12. LEARNING_ACTIVITIES POLICIES
CREATE POLICY "Users can view their own learning activities" ON learning_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own learning activities" ON learning_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own learning activities" ON learning_activities FOR DELETE USING (auth.uid() = user_id);
