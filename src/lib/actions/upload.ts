"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ContentType } from "@/types/database.types";

export interface RegisterUploadedMediaInput {
  title: string;
  description?: string;
  contentType: ContentType;
  storagePath: string;
  categoryId?: string;
}

export async function registerUploadedMedia(input: RegisterUploadedMediaInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to upload media." };
  }

  const { data, error } = await (supabase.from("contents" as any) as any)
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      content_type: input.contentType,
      source_type: "upload",
      source_url: input.storagePath, // Store storage path securely in DB
      category_id: input.categoryId || null,
      status: "unread",
      is_favorite: false,
    })
    .select()
    .single();

  if (error) {
    return { error: `Database error registering upload: ${error.message}` };
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");

  return { success: true, data };
}
