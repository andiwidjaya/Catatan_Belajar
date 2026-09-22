"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTags() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("tags" as any)
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching tags:", error.message);
    return [];
  }

  return data as { id: string; name: string }[];
}

export async function createTag(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await supabase
    .from("tags" as any)
    .insert({
      user_id: user.id,
      name,
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  return { data };
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags" as any).delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  return { success: true };
}
