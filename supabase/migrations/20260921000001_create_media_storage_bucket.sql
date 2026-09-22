-- ====================================================================
-- MIGRATION: 20260921000001_create_media_storage_bucket.sql
-- PURPOSE: Create private media storage bucket with user RLS isolation
-- ====================================================================

-- 1. Insert private 'media' bucket into storage.buckets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    false, -- Private bucket for secure RLS isolation
    52428800, -- 50MB max file size limit
    ARRAY[
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',
        'video/mp4',
        'video/webm'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800;

-- 2. Enable Storage RLS Policies for user path isolation: {user_id}/{content_id}/{filename}

CREATE POLICY "Users can upload media to their own directory"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view media in their own directory"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update media in their own directory"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete media in their own directory"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
