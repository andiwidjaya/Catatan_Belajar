"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, Plus, Bell, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { signOutUser } from "@/app/(auth)/actions";

export interface HeaderProps {
  onMobileMenuToggle: () => void;
  user?: {
    email?: string;
    name?: string;
  } | null;
}

export function Header({ onMobileMenuToggle, user }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts, summaries, notes, tags..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/library/youtube">
          <Button size="sm" icon={<Plus className="h-4 w-4" />}>
            Add Content
          </Button>
        </Link>

        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User Account Dropdown */}
        <Dropdown
          trigger={
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-indigo-500/20 hover:opacity-90 transition-opacity">
              {userInitials || <UserIcon className="h-4 w-4" />}
            </button>
          }
          items={[
            {
              id: "profile-email",
              label: user?.email || "user@example.com",
              icon: <UserIcon className="h-4 w-4 text-slate-400" />,
              onClick: () => {},
            },
            {
              id: "logout",
              label: "Sign Out",
              icon: <LogOut className="h-4 w-4" />,
              danger: true,
              onClick: signOutUser,
            },
          ]}
        />
      </div>
    </header>
  );
}
