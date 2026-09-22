export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentType = "video" | "audio" | "text";
export type SourceType = "youtube" | "upload" | "manual";
export type ContentStatus = "unread" | "in_progress" | "completed" | "review";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          content_type: ContentType;
          source_type: SourceType;
          source_url: string | null;
          source_id: string | null;
          thumbnail_url: string | null;
          duration: number | null;
          language: string;
          category_id: string | null;
          status: ContentStatus;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          content_type: ContentType;
          source_type: SourceType;
          source_url?: string | null;
          source_id?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          language?: string;
          category_id?: string | null;
          status?: ContentStatus;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          content_type?: ContentType;
          source_type?: SourceType;
          source_url?: string | null;
          source_id?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          language?: string;
          category_id?: string | null;
          status?: ContentStatus;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          content_id: string;
          language: string;
          full_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          language?: string;
          full_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          language?: string;
          full_text?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcript_segments: {
        Row: {
          id: string;
          transcript_id: string;
          start_time: number;
          end_time: number;
          text: string;
          sequence: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transcript_id: string;
          start_time: number;
          end_time: number;
          text: string;
          sequence: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transcript_id?: string;
          start_time?: number;
          end_time?: number;
          text?: string;
          sequence?: number;
          created_at?: string;
        };
      };
      ai_summaries: {
        Row: {
          id: string;
          content_id: string;
          model: string;
          summary: string;
          detailed_summary: string;
          key_points: Json;
          concepts: Json;
          keywords: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          model: string;
          summary: string;
          detailed_summary: string;
          key_points?: Json;
          concepts?: Json;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          model?: string;
          summary?: string;
          detailed_summary?: string;
          key_points?: Json;
          concepts?: Json;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      content_tags: {
        Row: {
          content_id: string;
          tag_id: string;
        };
        Insert: {
          content_id: string;
          tag_id: string;
        };
        Update: {
          content_id?: string;
          tag_id?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          text: string;
          timestamp: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          text: string;
          timestamp?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          text?: string;
          timestamp?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          content_id: string | null;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id?: string | null;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          created_at?: string;
        };
      };
      knowledge_chunks: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          transcript_id: string | null;
          chunk_index: number;
          source_type: "transcript" | "summary" | "note";
          start_time: number | null;
          end_time: number | null;
          text: string;
          metadata: Json;
          embedding: number[] | null;
          embedding_model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          transcript_id?: string | null;
          chunk_index?: number;
          source_type: "transcript" | "summary" | "note";
          start_time?: number | null;
          end_time?: number | null;
          text: string;
          metadata?: Json;
          embedding?: number[] | string | null;
          embedding_model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          transcript_id?: string | null;
          chunk_index?: number;
          source_type?: "transcript" | "summary" | "note";
          start_time?: number | null;
          end_time?: number | null;
          text?: string;
          metadata?: Json;
          embedding?: number[] | string | null;
          embedding_model?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      learning_activities: {
        Row: {
          id: string;
          user_id: string;
          content_id: string | null;
          activity_type: string;
          duration: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id?: string | null;
          activity_type: string;
          duration?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string | null;
          activity_type?: string;
          duration?: number;
          created_at?: string;
        };
      };
    };
    Enums: {
      content_type: ContentType;
      source_type: SourceType;
      content_status: ContentStatus;
    };
  };
}
