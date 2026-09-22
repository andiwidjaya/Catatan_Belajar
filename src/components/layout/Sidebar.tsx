"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Library,
  Youtube,
  UploadCloud,
  FileText,
  BookOpenCheck,
  Star,
  Sparkles,
  Settings,
  X,
  BookMarked,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { signOutUser } from "@/app/(auth)/actions";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: {
    email?: string;
    name?: string;
  } | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "All Library",
    href: "/library",
    icon: Library,
    subItems: [
      { label: "YouTube Videos", href: "/library/youtube", icon: Youtube },
      { label: "Audio & Video Uploads", href: "/library/upload", icon: UploadCloud },
      { label: "Manual Text Notes", href: "/library/text", icon: FileText },
    ],
  },
  { label: "Review Queue", href: "/review", icon: BookOpenCheck },
  { label: "Favorites", href: "/favorites", icon: Star },
  { label: "AI Knowledge Chat", href: "/ai", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    if (href === "/library") return pathname === "/library";
    return pathname.startsWith(href);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Knowledge User";
  const displayEmail = user?.email || "user@example.com";
  const userInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/60">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <BookMarked className="h-5 w-5" />
            </div>
            <span className="tracking-tight">KnowledgeHub</span>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.href);

              return (
                <div key={item.href} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                    <span>{item.label}</span>
                  </Link>

                  {/* Submenu items if present */}
                  {item.subItems && (
                    <div className="ml-4 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-800">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const subActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                              subActive
                                ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-950/30"
                                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User profile & Logout footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between rounded-lg p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {userInitials || <UserIcon className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
            <button
              onClick={signOutUser}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
