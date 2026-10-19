"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { createClient } from "@/lib/supabase/client";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    if (isAuthPage) return;

    try {
      const supabase = createClient();
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (user) {
            setUser({
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name,
            });
          }
        })
        .catch((err) => {
          console.warn("Could not retrieve auth user in AppShell:", err);
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (err) {
      console.warn("Supabase auth client init failed in AppShell:", err);
    }
  }, [isAuthPage]);

  if (isAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        user={user}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header onMobileMenuToggle={() => setIsMobileSidebarOpen(true)} user={user} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
