"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export interface TabListProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export interface TabItemProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: string | number;
  children: React.ReactNode;
  className?: string;
  id?: string;
  ariaControls?: string;
}

/**
 * Container wrapper for Tab navigation interface
 */
export function Tabs({ children, className }: TabsProps) {
  return <div className={cn("w-full space-y-4", className)}>{children}</div>;
}

/**
 * Accessible pill/underline Tab List container
 */
export function TabList({ children, className, ariaLabel = "Tab options" }: TabListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80 overflow-x-auto no-scrollbar max-w-full",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Premium Tab Button with active indicator, smooth transitions, and ARIA attributes
 */
export function TabItem({
  active,
  onClick,
  icon,
  badge,
  children,
  className,
  id,
  ariaControls,
}: TabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={ariaControls}
      id={id}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap",
        active
          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/80 dark:border-slate-700/60"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/40",
        className
      )}
    >
      {icon && (
        <span
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
          )}
        >
          {icon}
        </span>
      )}
      <span>{children}</span>
      {badge !== undefined && badge !== null && (
        <span
          className={cn(
            "ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none",
            active
              ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300"
              : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
