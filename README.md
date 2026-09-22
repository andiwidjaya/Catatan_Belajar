# Personal Knowledge Library (`Catatan Belajar`)

An intelligent, AI-powered **Personal Knowledge Library** built with Next.js (App Router), Supabase (PostgreSQL, RLS, Storage, Auth), Google Gemini 2.5 Flash, and pgvector.

Process untrusted content from **YouTube transcripts**, **uploaded audio/video media**, **user notes**, and **external content** into a structured, searchable, and interactive knowledge base.

---

## Technical Stack & Architecture

- **Framework**: Next.js 15 (App Router, Server Actions, React 18, TypeScript)
- **Database & Auth**: PostgreSQL (Supabase), Row Level Security (RLS), `@supabase/ssr` Cookies Auth
- **AI Models**: Google Gemini 2.5 Flash (`@google/genai` SDK) for structured summaries & item chat
- **Vector Search & RAG**: `pgvector` (`text-embedding-004` 768-dim embeddings, similarity RPC search)
- **Storage**: Supabase Private Media Storage Bucket (`media`) with short-lived signed URLs
- **Styling & UI**: TailwindCSS, Lucide Icons, Glassmorphism design tokens

---

## Production Deployment & Setup Guide

### 1. Local Development Setup

1. **Clone Repository & Install Dependencies**:
   ```bash
   git clone <repository-url>
   cd "Catatan Belajar"
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your local/staging credentials.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Supabase Setup

1. Create a new Supabase Project at [https://database.new](https://database.new).
2. Retrieve your project credentials from **Project Settings -> API**:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key -> `SUPABASE_SERVICE_ROLE_KEY`

---

### 3. Database Migration

Run the SQL migration scripts located in [`supabase/migrations/`](file:///d:/Catatan%20Belajar/supabase/migrations) in sequential order via Supabase SQL Editor or Supabase CLI (`supabase db push`):

1. [`20260921000000_create_knowledge_library_schema.sql`](file:///d:/Catatan%20Belajar/supabase/migrations/20260921000000_create_knowledge_library_schema.sql): Creates core PostgreSQL tables (`profiles`, `categories`, `contents`, `transcripts`, `transcript_segments`, `ai_summaries`, `tags`, `content_tags`, `notes`, `ai_conversations`, `ai_messages`, `learning_activities`) with full RLS policies.
2. [`20260921000001_create_media_storage_bucket.sql`](file:///d:/Catatan%20Belajar/supabase/migrations/20260921000001_create_media_storage_bucket.sql): Provisions private media storage bucket and RLS policies.
3. [`20260921000002_create_search_function.sql`](file:///d:/Catatan%20Belajar/supabase/migrations/20260921000002_create_search_function.sql): Creates full-text & filtered library search RPC function (`search_knowledge_library`).
4. [`20260921000003_create_vector_embeddings.sql`](file:///d:/Catatan%20Belajar/supabase/migrations/20260921000003_create_vector_embeddings.sql): Enables `pgvector` extension, creates `knowledge_chunks` table, vector HNSW/IVFFlat index, and cosine similarity RPC function (`match_knowledge_chunks`).

---

### 4. Storage Bucket Setup

Media uploads (`.mp3`, `.m4a`, `.wav`, `.mp4`, `.webm`) up to **50MB** are saved to private storage:
- **Bucket Name**: `media`
- **Public Access**: `false` (Private)
- **Path Isolation**: `{user_id}/{content_id}/{filename}`
- **Playback Authorization**: Access via short-lived signed URLs (`mediaStorageService.getSignedUrl()`).

---

### 5. Gemini API Configuration

1. Obtain a Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
2. Add `GEMINI_API_KEY` to process environment on your server / host.
3. **Security Note**: `GEMINI_API_KEY` is strictly server-only. No client-side `NEXT_PUBLIC_GEMINI_API_KEY` is exposed.

---

### 6. Environment Variables Reference

| Variable | Scope | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase Public Client Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Supabase Admin Service Role Key |
| `GEMINI_API_KEY` | Server-Only | Google AI Studio Gemini API Key |

---

### 7. Authentication Configuration

- **Provider**: Supabase Auth (Email & Password, OAuth).
- **Session Management**: Cookie-based server sessions via `@supabase/ssr` and Next.js middleware ([`src/middleware.ts`](file:///d:/Catatan%20Belajar/src/middleware.ts)).
- **Protected Routes**: `/dashboard`, `/library`, `/review`, `/favorites`, `/ai`, `/settings`. Unauthenticated users are redirected to `/login`.

---

### 8. pgvector & RAG Setup

- **Vector Extension**: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Embedding Model**: `text-embedding-004` (768 dimensions).
- **Vector Table**: `knowledge_chunks` (`user_id`, `content_id`, `chunk_index`, `source_type`, `text`, `embedding vector(768)`).
- **Indexing**: `indexAllLibraryContents()` chunks transcript segments (~1200 chars), summaries, and notes, generating embeddings stored in `knowledge_chunks`.
- **Similarity Search**: `match_knowledge_chunks()` RPC searches user chunks using cosine similarity threshold (default `0.25`).

---

### 9. RAG Query Execution Flow

1. User submits question to `askGlobalKnowledgeBase(question)`.
2. System generates vector embedding for question via `embeddingService`.
3. `match_knowledge_chunks` RPC returns top matching chunks for `user_id`.
4. `ragService` wraps chunks inside `<untrusted_rag_context>` boundary tags and invokes Gemini 2.5 Flash to synthesize grounded answer with citations.
5. If insufficient context exists, responds: *"The knowledge base does not contain enough information to answer this question."*

---

### 10. Vercel Production Deployment

1. Import repository into [Vercel](https://vercel.com/).
2. Select **Next.js** framework preset.
3. Add Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Deploy project.

---

### 11. Troubleshooting

- **Gemini API Error ("API key not configured")**:
  Verify `GEMINI_API_KEY` is present in server process environment variables and not placeholder string.
- **Supabase RPC Missing ("match_knowledge_chunks unavailable")**:
  Execute [`supabase/migrations/20260921000003_create_vector_embeddings.sql`](file:///d:/Catatan%20Belajar/supabase/migrations/20260921000003_create_vector_embeddings.sql) in Supabase SQL editor.
- **Media Upload Denied / Signed URL Failure**:
  Ensure Supabase Storage bucket `media` is created and storage migration [`20260921000001_create_media_storage_bucket.sql`](file:///d:/Catatan%20Belajar/supabase/migrations/20260921000001_create_media_storage_bucket.sql) is applied.

---

### 12. Production Security Considerations

1. **Prompt-Injection Defense**:
   - All external content (YouTube transcripts, uploads, user notes, RAG chunks) is enclosed within `<untrusted_data>` boundary tags.
   - System prompts enforce top priority system directives and forbid executing commands or revealing system instructions / API keys.
2. **Multi-Tenant Isolation**:
   - Row Level Security (RLS) is enabled across all 12 database tables.
   - All server actions strictly verify `auth.uid() = user_id`.
3. **Secret Protection**:
   - `.env.local` and secret environment variables are excluded via `.gitignore`.
