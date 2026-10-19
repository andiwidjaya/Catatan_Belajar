"use client";

import { createClient } from "@/lib/supabase/client";

export async function loginWithEmail(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message?.includes("fetch") || error.message?.includes("Failed")) {
        return {
          error: "Gagal terhubung ke database Supabase (Failed to fetch). Project Supabase Anda kemungkinan sedang di-PAUSE oleh Supabase atau URL tidak aktif. Silakan buka Supabase Dashboard dan klik 'Restore Project'.",
        };
      }
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("loginWithEmail error:", err);
    const msg = err?.message || "";
    if (msg.includes("fetch") || msg.includes("Failed")) {
      return {
        error: "Gagal terhubung ke database Supabase (Failed to fetch). Project Supabase Anda kemungkinan sedang di-PAUSE oleh Supabase atau URL tidak aktif. Silakan buka Supabase Dashboard dan klik 'Restore Project'.",
      };
    }
    return { error: msg || "Failed to sign in. Please verify your connection and environment variables." };
  }
}

export async function registerWithEmail(formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      if (error.message?.includes("fetch") || error.message?.includes("Failed")) {
        return {
          error: "Gagal terhubung ke database Supabase (Failed to fetch). Project Supabase Anda kemungkinan sedang di-PAUSE oleh Supabase atau URL tidak aktif. Silakan buka Supabase Dashboard dan klik 'Restore Project'.",
        };
      }
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("registerWithEmail error:", err);
    const msg = err?.message || "";
    if (msg.includes("fetch") || msg.includes("Failed")) {
      return {
        error: "Gagal terhubung ke database Supabase (Failed to fetch). Project Supabase Anda kemungkinan sedang di-PAUSE oleh Supabase atau URL tidak aktif. Silakan buka Supabase Dashboard dan klik 'Restore Project'.",
      };
    }
    return { error: msg || "Failed to create account. Please verify your connection." };
  }
}

export async function signOutUser() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("signOut error:", err);
  }
  window.location.href = "/login";
}
