# Personal Knowledge Library — System Architecture & Technical Blueprint

## 1. Application Architecture

The **Personal Knowledge Library** is built as a highly performant, accessible, and secure full-stack web application powered by **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL, Auth, Storage, pgvector)**, and **Google Gemini API**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Browser (React)                        │
│   ┌─────────────────────────────────┐   ┌───────────────────────────┐   │
│   │    Server Components (RSC)      │   │  Interactive Client Comps │   │
│   │  (Direct DB read, initial HTML) │   │ (UI state, forms, audio)  │   │
│   └────────────────┬────────────────┘   └─────────────┬─────────────┘   │
└────────────────────┼──────────────────────────────────┼─────────────────┘
                     │                                  │
                     ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Next.js App Router Server                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │      Server Actions / Route Handlers (Edge & Node.js Runtime)    │   │
│   │   - Supabase SSR Client (Auth Cookie Check & RLS Enforcement)   │   │
│   │   - Server-only Secrets (GEMINI_API_KEY, SUPABASE_SERVICE_ROLE) │   │
│   └────────────────┬────────────────────────────────┬───────────────┘   │
└────────────────────┼────────────────────────────────┼───────────────────┘
                     │                                │
                     ▼                                ▼
┌───────────────────────────────────────┐  ┌──────────────────────────────┐
│        Supabase Cloud Backend         │  │      Google Gemini API       │
│  - PostgreSQL + pgvector              │  │  - gemini-2.5-flash         │
│  - Row Level Security (RLS)           │  │  - text-embedding-004       │
│  - Supabase Auth (JWT Sessions)       │  │  - Structured JSON Outputs  │
│  - Supabase Storage (Audio/Video)     │  │                              │
└───────────────────────────────────────┘  └──────────────────────────────┘
```

### Architectural Principles

1. **Server-First Paradigm**:
   - Web pages render as **React Server Components (RSC)** by default for low bundle footprint and instant initial data loads.
   - Client components are strictly reserved for user interactivity (player controls, form inputs, modal dialogs, chat inputs).
2. **Strict Server-Only Secrets**:
   - `GEMINI_API_KEY` and Supabase Service Role keys are loaded via server environment variables (`process.env`) and never exposed in `NEXT_PUBLIC_` variables or sent to the browser.
3. **Immutability & Data Provenance**:
   - Raw source transcripts and user inputs are strictly separated from AI-generated data (`ai_summaries`, `embeddings`).
   - AI summaries and key points never overwrite the original raw transcripts.
4. **Data Isolation**:
   - Supabase Row Level Security (RLS) is applied to every single table, enforcing `auth.uid() = user_id` for read/write queries.

---

## 2. Folder Structure

```
d:/Catatan Belajar/
├── ARCHITECTURE.md                  # High-level architecture documentation
├── package.json                     # Project dependencies & scripts
├── tsconfig.json                    # Strict TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS theme & utility configs
├── next.config.ts                   # Next.js configuration (security headers, remote images)
├── .env.example                     # Environment variables template
├── supabase/
│   ├── migrations/                  # SQL schema migrations & pgvector setup
│   ├── seed.sql                     # Seed data for testing/development
│   └── config.toml                  # Local Supabase CLI configuration
├── src/
│   ├── app/                         # Next.js App Router pages & routes
│   │   ├── (auth)/                  # Auth route group (login, signup, callback)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/             # Authenticated main layout group
│   │   │   ├── layout.tsx           # Dashboard navigation sidebar & header
│   │   │   ├── page.tsx             # Library Overview / Stats Dashboard
│   │   │   ├── content/             # Content Management Routes
│   │   │   │   ├── page.tsx         # Content Library grid/list view with filter & search
│   │   │   │   ├── new/             # Add content (YouTube URL, Audio upload, Manual text)
│   │   │   │   └── [id]/            # Content detail page (Transcript, AI Summary, Notes, Chat)
│   │   │   ├── categories/          # Category management
│   │   │   ├── tags/                # Tag management
│   │   │   └── search/              # Hybrid & semantic search page
│   │   └── api/                     # Route Handlers for streaming / webhooks
│   │       ├── ai/
│   │       │   ├── summarize/route.ts
│   │       │   └── chat/route.ts
│   │       └── transcribe/route.ts
│   ├── components/                  # Modular & Reusable UI Components
│   │   ├── ui/                      # Base primitive components (Buttons, Inputs, Modals, Badges)
│   │   ├── content/                 # Content Cards, Filter Bar, YouTube Player, Audio Player
│   │   ├── transcript/              # Timestamped Segment Viewer, Active Segment Highlighter
│   │   ├── ai/                      # AI Summary Tabs, Key Points List, AI Chat Widget
│   │   ├── notes/                   # Personal Notes Editor & Autosave Status
│   │   └── layout/                  # Sidebar, Header, User Menu, Theme Toggle
│   ├── lib/                         # Core Libraries & Integrations
│   │   ├── supabase/                # Supabase SSR client helpers (server.ts, client.ts, middleware.ts)
│   │   ├── gemini/                  # Google Gemini API client, prompts, structured output schemas
│   │   ├── youtube/                 # YouTube metadata extraction & transcript fetching
│   │   └── utils/                   # Time formatters, text chunkers, validation schemas
│   ├── types/                       # Centralized TypeScript interfaces & DB types
│   │   ├── database.types.ts        # Supabase generated database types
│   │   ├── content.ts               # Core content domain types
│   │   ├── ai.ts                    # Summary, key points, concept schemas
│   │   └── rag.ts                   # Search & embedding query types
│   └── middleware.ts                # Supabase session refresh & auth protection middleware
```

---

## 3. Data Flow

```
[User Action: Add YouTube / Upload Video]
       │
       ▼
[Server Action: `createContentItem`]
       │
       ├─► 1. Save raw record to `content_items` in Supabase (status: 'processing')
       ├─► 2. Extract Transcript (YouTube API / Whisper / Gemini Multimodal)
       ├─► 3. Save raw transcript segments to `transcripts` & `transcript_segments`
       │
       ▼
[Async Server Action: `generateAISummary`]
       │
       ├─► 1. Fetch transcript text from Supabase
       ├─► 2. Send transcript to Google Gemini API with Structured Output Schema
       ├─► 3. Receive Summary, Key Points, Concepts, Keywords
       ├─► 4. Store result into `ai_summaries` table linked to `content_id`
       │
       ▼
[Async Server Action: `generateEmbeddings`]
       │
       ├─► 1. Chunk transcript & summary text into 500-token chunks with overlap
       ├─► 2. Batch call Gemini Embedding API (`text-embedding-004`)
       ├─► 3. Save vector embeddings into `content_embeddings` table (pgvector)
       └─► 4. Update `content_items` status to 'completed'
```

---

## 4. Database Architecture (Supabase PostgreSQL + pgvector)

```sql
-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. User Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Categories & Tags
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Content Items (Core Registry)
CREATE TYPE content_type AS ENUM ('youtube', 'audio', 'video', 'text');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE learning_status AS ENUM ('to_learn', 'in_progress', 'completed');

CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type content_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    storage_path TEXT, -- For Supabase storage files (audio/video uploads)
    duration_seconds INT,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    learning_status learning_status DEFAULT 'to_learn' NOT NULL,
    status processing_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE content_tags (
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (content_id, tag_id)
);

-- 5. Raw Transcripts (Separated from AI Data)
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_text TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE transcript_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE NOT NULL,
    start_time NUMERIC(10, 2) NOT NULL, -- seconds
    end_time NUMERIC(10, 2) NOT NULL,   -- seconds
    text TEXT NOT NULL,
    segment_index INT NOT NULL
);

-- 6. AI Generated Data
CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL UNIQUE,
    short_summary TEXT NOT NULL,
    detailed_summary TEXT NOT NULL,
    key_points JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings/objects
    concepts JSONB NOT NULL DEFAULT '[]'::jsonb,   -- Key concepts with definitions
    keywords TEXT[] NOT NULL DEFAULT '{}',
    model_version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Personal Notes
CREATE TABLE personal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    timestamp_seconds NUMERIC(10, 2), -- Optional timestamp reference
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Vector Embeddings (RAG Database Infrastructure)
CREATE TABLE content_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    start_time NUMERIC(10, 2),
    end_time NUMERIC(10, 2),
    embedding vector(768) NOT NULL, -- Gemini text-embedding-004 output dimension
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX content_embeddings_vector_idx ON content_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 9. AI Chat Messages (Item level & Global RAG Chat)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE, -- NULL for global RAG chat
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb, -- Referenced chunks & timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## 5. AI Architecture (Google Gemini Integration)

### Gemini API Usage Strategy
1. **Model Choices**:
   - **Summarization & Concepts**: `gemini-2.5-flash` for fast, cost-effective structured JSON analysis.
   - **Transcript Processing / Audio Reasoning**: `gemini-2.5-flash` multimodal support for direct audio/video analysis when native transcription is needed.
   - **RAG QA Chat**: `gemini-2.5-flash` with retrieved context chunks.
   - **Embeddings**: `text-embedding-004` (768 dimensions).

280. **Structured Output & Security Guarantees**:
   - Uses Gemini JSON schema mode (`responseSchema`) to enforce strict return types for summaries, key points, concept definitions, and study questions.
   - **Untrusted Data Framing**: Untrusted text inputs (YouTube transcripts, file uploads, notes, RAG context) are wrapped in explicit XML boundary tags (`<untrusted_transcript>`, `<untrusted_content>`, `<untrusted_rag_context>`).
   - **System Instruction Precedence**: System instructions take top priority over untrusted content or user questions, preventing instruction injection, persona switches, or system prompt/secret leakage.

3. **Rate Limit & Resiliency Handling**:
   - Exponential backoff retry handler for Gemini API invocations.
   - Async background processing pattern with status updates on `contents` table (`status: unread -> in_progress -> completed`). On AI failure, automatically reverts status back to `unread` to allow user retry.

---

## 6. Security Principles

1. **Supabase Row Level Security (RLS)**:
   - RLS is ENABLED on every single database table (12 tables).
   - Server Actions enforce explicit `.eq("user_id", user.id)` checks for defense-in-depth data isolation.
2. **Server Action & API Authorization**:
   - Every Server Action extracts user identity using `supabase.auth.getUser()`. If unauthenticated, access is rejected immediately.
3. **Storage Security**:
   - Supabase Storage bucket `media` uses private access policies restricted to `(storage.foldername(name))[1] = auth.uid()::text`.
   - Access to uploaded audio/video files is served via short-lived signed URLs.
4. **Input Sanitation & XSS Prevention**:
   - User notes and Markdown content are rendered safely using React JSX with HTML escaping.

---

## 7. RAG Vector Architecture (Retrieval-Augmented Generation)

```
[User Query: "What did I learn about transformer architecture?"]
                           │
                           ▼
     [Generate Query Vector (`text-embedding-004`)]
                           │
                           ▼
     [Execute Supabase RPC Vector Search (`match_knowledge_chunks`)]
     (Cosine Similarity + User RLS Filter + Top K Chunks)
                           │
                           ▼
     [Assemble Grounded Prompt Context inside `<untrusted_rag_context>`]
                           │
                           ▼
     [Gemini 2.5 Flash Response with Source Citations & Timestamps]
```

### Vector Search Function (Supabase RPC)
```sql
CREATE OR REPLACE FUNCTION match_knowledge_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content_id uuid,
  transcript_id uuid,
  chunk_index int,
  source_type text,
  start_time numeric,
  end_time numeric,
  text text,
  metadata jsonb,
  similarity float,
  content_title text
)
LANGUAGE sql STABLE
AS $$
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
  FROM knowledge_chunks kc
  JOIN contents c ON c.id = kc.content_id
  WHERE kc.user_id = p_user_id
    AND 1 - (kc.embedding <=> query_embedding) >= match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 8. Development & Implementation Roadmap

- **Phase 0-16**: Core Library, Auth, Content Ingestion, Summarization, RAG Chat & Security Hardening (**COMPLETED**)
- **Phase 17**: Production Readiness, Performance Optimization & Verification Pipeline (**COMPLETED**)

---
*Updated on 2026-09-22 as the primary architectural reference for Personal Knowledge Library.*
