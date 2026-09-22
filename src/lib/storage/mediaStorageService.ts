import { createClient } from "@/lib/supabase/client";

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
}

export const ALLOWED_EXTENSIONS = ["mp3", "m4a", "wav", "mp4", "webm"];
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function validateMediaFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, errorMessage: "No file selected." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      errorMessage: `Unsupported file format (.${extension || "unknown"}). Allowed formats: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      errorMessage: `File size (${sizeInMb}MB) exceeds the 50MB maximum limit.`,
    };
  }

  return { isValid: true };
}

export function detectContentTypeFromFile(file: File): "audio" | "video" {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "mp4" || extension === "webm" || file.type.startsWith("video/")) {
    return "video";
  }
  return "audio";
}

export interface UploadMediaOptions {
  userId: string;
  contentId: string;
  file: File;
  onProgress?: (progress: UploadProgressInfo) => void;
}

export class MediaStorageService {
  private bucketName = "media";

  /**
   * Securely uploads media file to private user path: {user_id}/{content_id}/{filename}
   */
  async uploadFile({ userId, contentId, file, onProgress }: UploadMediaOptions) {
    const validation = validateMediaFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }

    const supabase = createClient();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${userId}/${contentId}/${sanitizedFileName}`;

    // Simulate progress feedback for browser uploads
    if (onProgress) {
      onProgress({ loaded: file.size * 0.3, total: file.size, percentage: 30 });
    }

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    return {
      storagePath: data.path,
      fullPath: `${this.bucketName}/${data.path}`,
    };
  }

  /**
   * Generates a temporary signed URL for secure file playback
   */
  async getSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) {
      throw new Error(`Failed to generate secure audio/video link: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Deletes a file from Supabase Storage
   */
  async deleteFile(storagePath: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.storage.from(this.bucketName).remove([storagePath]);

    if (error) {
      console.error("Storage delete error:", error.message);
      return false;
    }

    return true;
  }
}

export const mediaStorageService = new MediaStorageService();
