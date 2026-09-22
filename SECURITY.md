# Personal Knowledge Library — Security Architecture & Threat Model (`SECURITY.md`)

## 1. Executive Summary & Security Model

The **Personal Knowledge Library** employs a **defense-in-depth security model** combining multi-tenant Row Level Security (RLS) in PostgreSQL, server-side authentication verification, strict user ownership assertions, and isolated API execution environments.

### Core Security Guarantees
1. **Multi-Tenant Isolation**: Every database operation is bound strictly to `auth.uid() = user_id`.
2. **Zero Client Secret Exposure**: Server secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept exclusively on the server side and never sent to or accessible from browser clients.
3. **No Service-Role Escalation**: Standard user requests operate exclusively using authenticated client sessions subject to PostgreSQL RLS rules.
4. **Secure Media Storage**: Uploaded files are stored in private Supabase buckets (`media-files`), accessible solely via short-lived signed URLs generated after owner authorization.

---

## 2. In-Depth Security Controls Audit

### 1. Supabase Row Level Security (RLS)
- **RLS Status**: `ENABLED` on all 12 PostgreSQL tables (`profiles`, `categories`, `contents`, `transcripts`, `transcript_segments`, `ai_summaries`, `tags`, `content_tags`, `notes`, `ai_conversations`, `ai_messages`, `learning_activities`).
- **Isolation Directives**:
  - Direct user tables (`contents`, `categories`, `tags`, `notes`, `ai_conversations`, `learning_activities`) check `auth.uid() = user_id`.
  - Dependent child tables (`transcripts`, `ai_summaries`, `content_tags`, `ai_messages`, `transcript_segments`) verify ownership via relational `EXISTS` queries referencing parent content records owned by `auth.uid()`.

---

### 2. Authentication & Authorization
- **Session Enforcement**: Handled via `@supabase/ssr` cookies and `src/middleware.ts`.
- **Protected Routes**: `/dashboard`, `/library`, `/review`, `/favorites`, `/ai`, `/settings` strictly require valid authenticated user sessions. Unauthenticated requests are redirected to `/login`.
- **Server Action Authorization**: Every server action in `src/lib/actions/` asserts `const { data: { user } } = await supabase.auth.getUser()`. Unauthenticated calls immediately return `{ error: "Unauthenticated" }`.

---

### 3. Server Actions & Insecure Direct Object Reference (IDOR) Protection
- Every data access method explicitly filters by `user_id = user.id` in addition to primary keys (e.g. `getContentById`, `updateContent`, `deleteContent`, `getTranscriptForContent`, `getAISummaryForContent`, `sendItemChatMessage`).
- **Cross-Tenant Prevention**: User A cannot read, edit, delete, or invoke AI processing on User B's content by guessing UUIDs.

---

### 4. Gemini API & Service Credentials Handling
- **Environment Isolation**: `GEMINI_API_KEY` is loaded strictly inside server-only modules (`src/lib/gemini/geminiService.ts`, `geminiChatService.ts`, `embeddingService.ts`).
- **No Client Exposure**: No `NEXT_PUBLIC_GEMINI_API_KEY` exists. Client components invoke server actions or protected API routes (`/api/ai/summarize`, `/api/ai/chat`) which execute API calls server-side.

---

### 5. Supabase Storage & File Upload Validation
- **Private Bucket**: `media-files` storage bucket is set to `public = false`.
- **File Validation**: `validateMediaFile()` enforces strict MIME type checks (`audio/mpeg`, `audio/mp4`, `audio/wav`, `video/mp4`, `video/webm`) and a 50MB file size limit before upload.
- **Access Control**: Media files are retrieved via short-lived signed URLs (`mediaStorageService.getSignedUrl()`), valid only for authorized content owners.

---

### 6. Input Sanitization, Prompt Injection & XSS Defense
- **SQL Injection**: All database interactions use Supabase parameterized query builders and parameterized RPC functions (`search_knowledge_library`).
- **XSS Defense**: React JSX automatically escapes dynamic string outputs in transcripts, notes, and AI summaries.
- **AI Prompt Injection Defense**:
  - All untrusted input sources (YouTube transcripts, uploaded transcripts, user notes, and external web content) are strictly treated as **untrusted DATA** and wrapped in explicit data boundary tags (`<untrusted_transcript>`, `<untrusted_content>`, `<untrusted_rag_context>`).
  - System instructions possess absolute priority over user messages, transcripts, and retrieved RAG context.
  - Gemini system prompts across Summarization (`geminiService.ts`), Single-Content Chat (`geminiChatService.ts`), and Global RAG Chat (`ragService.ts`) explicitly forbid execution of instructions, directives, jailbreak attempts, or persona switches contained within untrusted content.
  - System prompt directives explicitly forbid revealing system prompts, internal system directives, or server secrets/API keys under any circumstances.

---

## 3. Threat Matrix & Mitigation Summary

| Threat / Risk | Risk Level | Applied Mitigation | Status |
|---|---|---|---|
| **Cross-Tenant Data Leakage (IDOR)** | Critical | Database RLS + Server Action `user_id` ownership checks | **VERIFIED & SECURED** |
| **Exposing Gemini API Key** | Critical | Server-side execution only; key stored in process environment + system prompt confidentiality directives | **VERIFIED & SECURED** |
| **Unauthorized File Download** | High | Private storage bucket + short-lived signed URL authorization | **VERIFIED & SECURED** |
| **Prompt Injection & Instruction Override** | High | Untrusted data boundaries (`<untrusted_data>`), system instruction priority, anti-execution directives | **VERIFIED & SECURED** |
| **Excessive Error Exposure** | Medium | Generic error synthesis for end-users; internal logs kept server-side | **VERIFIED & SECURED** |

---
*Documented on 2026-09-22 as AI Pipeline Prompt-Injection Security Architecture Specification.*
