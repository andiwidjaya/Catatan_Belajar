"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchYoutubeMetadata, isValidYoutubeUrl } from "@/lib/youtube/youtubeMetadataService";
import { revalidatePath } from "next/cache";

export interface ImportYoutubeVideoInput {
  url: string;
  customTitle?: string;
  categoryId?: string;
  description?: string;
}

export async function importYoutubeVideo(input: ImportYoutubeVideoInput) {
  const { url, customTitle, categoryId, description } = input;

  if (!url || !isValidYoutubeUrl(url)) {
    return { error: "Please enter a valid YouTube video link (e.g., https://www.youtube.com/watch?v=...)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to import content." };
  }

  try {
    // 1. Fetch real metadata from YouTube oEmbed API
    const metadata = await fetchYoutubeMetadata(url);

    // 2. Check for duplicate YouTube video import for this user
    const { data: existing } = await (supabase.from("contents" as any) as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("source_type", "youtube")
      .eq("source_id", metadata.videoId)
      .maybeSingle();

    if (existing) {
      return { error: "This YouTube video has already been imported to your library." };
    }

    // 3. Prepare description with channel attribution if available
    let fullDescription = description?.trim() || "";
    if (metadata.authorName) {
      const channelInfo = `Channel: ${metadata.authorName}`;
      fullDescription = fullDescription ? `${fullDescription}\n\n${channelInfo}` : channelInfo;
    }

    const finalTitle = customTitle?.trim() || metadata.title;

    // 4. Insert into Supabase contents table
    const { data: content, error: dbError } = await (supabase.from("contents" as any) as any)
      .insert({
        user_id: user.id,
        title: finalTitle,
        description: fullDescription || null,
        content_type: "video",
        source_type: "youtube",
        source_url: metadata.sourceUrl,
        source_id: metadata.videoId,
        thumbnail_url: metadata.thumbnailUrl,
        category_id: categoryId || null,
        status: "unread",
        is_favorite: false,
      })
      .select()
      .single();

    if (dbError) {
      return { error: `Database error saving video: ${dbError.message}` };
    }

    revalidatePath("/library");
    revalidatePath("/dashboard");

    return { success: true, data: content };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Failed to import YouTube video due to an unexpected error." };
  }
}
