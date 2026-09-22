# Personal Knowledge Library — Database Schema & Architecture

## 1. Overview & Architectural Principles

The **Personal Knowledge Library** database is built on **Supabase PostgreSQL**. It enforces strict Row Level Security (RLS) across all 12 tables to guarantee multi-tenant data isolation.

### Core Database Goals
1. **Multi-Tenant User Isolation**: Every user record is scoped to `auth.uid() = user_id`.
2. **Immutable Provenance**: Raw transcripts (`transcripts`, `transcript_segments`) are decoupled from AI-generated outputs (`ai_summaries`).
3. **Structured & Relational**: Strong foreign key constraints (`ON DELETE CASCADE`) maintain relational integrity.
4. **Optimized Indexing**: Specialized B-tree indexes speed up standard queries on `user_id`, `category_id`, `status`, `created_at`, `title`, `source_type`, and `content_type`.

---

## 2. Entity-Relationship (ER) Schema Overview

```
                      ┌──────────────────┐
                      │    auth.users    │
                      └────────┬─────────┘
                               │ (1:1)
                               ▼
                      ┌──────────────────┐
                      │     profiles     │
                      └──────────────────┘
                               │
            ┌──────────────────┼──────────────────┬──────────────────┐
            │ (1:N)            │ (1:N)            │ (1:N)            │ (1:N)
            ▼                  ▼                  ▼                  ▼
   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
   │   categories   │ │    contents    │ │      tags      │ │ ai_conversations │
   └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └────────┬─────────┘
           │                  │                  │                   │
           │ (0..1:N)         │ (1:N)            │ (1:N)             │ (1:N)
           └────────────────► │ ◄────────────────┘                   ▼
                              │ content_tags                  ┌───────────────┐
                              │                               │  ai_messages  │
                              ├──► transcripts (1:1)          └───────────────┘
                              │        └──► transcript_segments (1:N)
                              │
                              ├──► ai_summaries (1:1)
                              │
                              ├──► notes (1:N)
                              │
                              └──► learning_activities (1:N)
```

---

## 3. Detailed Table Specs

### 1. `profiles`
Links user account metadata to Supabase Auth.
- `id` (UUID, PK, FK `auth.users.id`)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 2. `categories`
User-defined category tags for content grouping.
- `id` (UUID, PK)
- `user_id` (UUID, FK `auth.users.id`)
- `name` (TEXT, UNIQUE per user)
- `color` (TEXT, DEFAULT `#4F46E5`)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 3. `contents`
Central content registry for YouTube videos, audio/video uploads, and text items.
- `id` (UUID, PK)
- `user_id` (UUID, FK `auth.users.id`)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `content_type` (`video` | `audio` | `text`)
- `source_type` (`youtube` | `upload` | `manual`)
- `source_url` (TEXT)
- `source_id` (TEXT)
- `thumbnail_url` (TEXT)
- `duration` (NUMERIC)
- `language` (TEXT, DEFAULT `'en'`)
- `category_id` (UUID, FK `categories.id` ON DELETE SET NULL)
- `status` (`unread` | `in_progress` | `completed` | `review`)
- `is_favorite` (BOOLEAN, DEFAULT `FALSE`)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 4. `transcripts`
Raw full transcript text.
- `id` (UUID, PK)
- `content_id` (UUID, FK `contents.id`, UNIQUE)
- `language` (TEXT)
- `full_text` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 5. `transcript_segments`
Timestamped transcript intervals for synchronized player seeking.
- `id` (UUID, PK)
- `transcript_id` (UUID, FK `transcripts.id`)
- `start_time` (NUMERIC)
- `end_time` (NUMERIC)
- `text` (TEXT)
- `sequence` (INT)
- `created_at` (TIMESTAMPTZ)

### 6. `ai_summaries`
Structured Gemini AI summaries and conceptual extractions.
- `id` (UUID, PK)
- `content_id` (UUID, FK `contents.id`, UNIQUE)
- `model` (TEXT)
- `summary` (TEXT)
- `detailed_summary` (TEXT)
- `key_points` (JSONB)
- `concepts` (JSONB)
- `keywords` (TEXT[])
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 7. `tags`
Custom user tags.
- `id` (UUID, PK)
- `user_id` (UUID, FK `auth.users.id`)
- `name` (TEXT, UNIQUE per user)
- `created_at` (TIMESTAMPTZ)

### 8. `content_tags`
Junction table for content item tagging.
- `content_id` (UUID, FK `contents.id`)
- `tag_id` (UUID, FK `tags.id`)
- PRIMARY KEY (`content_id`, `tag_id`)

### 9. `notes`
Personal user notes with optional timestamp playback references.
- `id` (UUID, PK)
- `user_id` (UUID, FK `auth.users.id`)
- `content_id` (UUID, FK `contents.id`)
- `text` (TEXT)
- `timestamp` (NUMERIC, NULLABLE)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 10. `ai_conversations`
Item-specific or global RAG chat threads.
- `id` (UUID, PK)
- `user_id` (UUID, FK `auth.users.id`)
- `content_id` (UUID, FK `contents.id`, NULLABLE for global chat)
- `title` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### 11. `ai_messages`
Messages exchanged within an AI chat thread.
- `id` (UUID, PK)
- `conversation_id` (UUID, FK `ai_conversations.id`)
- `role` (`user` | `assistant` | `system`)
- `content` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 12. `learning_activities`
Activity log tracking user review events and duration.
- `id` (UUID, PK)
- `user_id` (UUID, FK `auth.users.id`)
- `content_id` (UUID, FK `contents.id`, NULLABLE)
- `activity_type` (TEXT)
- `duration` (INT)
- `created_at` (TIMESTAMPTZ)

---

## 4. Row Level Security (RLS) Policy Blueprint

Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.

| Table | Policy Type | Enforcement Constraint |
|---|---|---|
| `profiles` | SELECT / UPDATE | `auth.uid() = id` |
| `categories` | ALL | `auth.uid() = user_id` |
| `contents` | ALL | `auth.uid() = user_id` |
| `transcripts` | ALL | `EXISTS (SELECT 1 FROM contents WHERE contents.id = transcripts.content_id AND contents.user_id = auth.uid())` |
| `transcript_segments` | ALL | `EXISTS (SELECT 1 FROM transcripts JOIN contents ON contents.id = transcripts.content_id WHERE transcripts.id = transcript_segments.transcript_id AND contents.user_id = auth.uid())` |
| `ai_summaries` | ALL | `EXISTS (SELECT 1 FROM contents WHERE contents.id = ai_summaries.content_id AND contents.user_id = auth.uid())` |
| `tags` | ALL | `auth.uid() = user_id` |
| `content_tags` | ALL | `EXISTS (SELECT 1 FROM contents WHERE contents.id = content_tags.content_id AND contents.user_id = auth.uid())` |
| `notes` | ALL | `auth.uid() = user_id` |
| `ai_conversations` | ALL | `auth.uid() = user_id` |
| `ai_messages` | ALL | `EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid())` |
| `learning_activities` | ALL | `auth.uid() = user_id` |

---

## 5. Performance Indexes

- `idx_categories_user_id`: B-tree on `categories(user_id)`
- `idx_contents_user_id`: B-tree on `contents(user_id)`
- `idx_contents_category_id`: B-tree on `contents(category_id)`
- `idx_contents_status`: B-tree on `contents(status)`
- `idx_contents_created_at`: B-tree on `contents(created_at DESC)`
- `idx_contents_title`: B-tree on `contents(title)`
- `idx_contents_source_type`: B-tree on `contents(source_type)`
- `idx_contents_content_type`: B-tree on `contents(content_type)`
- `idx_transcripts_content_id`: B-tree on `transcripts(content_id)`
- `idx_transcript_segments_transcript_id`: B-tree on `transcript_segments(transcript_id)`
- `idx_ai_summaries_content_id`: B-tree on `ai_summaries(content_id)`
- `idx_tags_user_id`: B-tree on `tags(user_id)`
- `idx_notes_user_id`: B-tree on `notes(user_id)`
- `idx_notes_content_id`: B-tree on `notes(content_id)`
- `idx_ai_conversations_user_id`: B-tree on `ai_conversations(user_id)`
- `idx_ai_conversations_content_id`: B-tree on `ai_conversations(content_id)`
- `idx_ai_messages_conversation_id`: B-tree on `ai_messages(conversation_id)`
- `idx_learning_activities_user_id`: B-tree on `learning_activities(user_id)`
- `idx_learning_activities_content_id`: B-tree on `learning_activities(content_id)`

---

## 6. Trigger Functions

1. **`update_updated_at_column()`**: Automatically updates `updated_at = NOW()` prior to UPDATE operations on mutable tables.
2. **`handle_new_user()`**: Listens to `auth.users` `AFTER INSERT` to populate `public.profiles` automatically with user metadata upon account registration.

---
*Created on 2026-09-21 as Phase 2 database documentation for Personal Knowledge Library.*
