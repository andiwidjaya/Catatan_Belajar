"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("categories" as any)
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error.message);
    return [];
  }

  return data as { id: string; name: string; color: string | null }[];
}

export async function createCategory(name: string, color?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthenticated" };

  const { data, error } = await supabase
    .from("categories" as any)
    .insert({
      user_id: user.id,
      name,
      color: color || "#4F46E5",
    } as any)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  return { data };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories" as any).delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/library");
  return { success: true };
}
