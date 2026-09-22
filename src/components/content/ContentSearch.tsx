"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Search, X } from "lucide-react";

export interface ContentSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ContentSearch({ value, onChange, placeholder = "Search knowledge titles..." }: ContentSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, onChange]);

  return (
    <div className="relative w-full sm:w-72">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                onChange("");
              }}
              className="pointer-events-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null
        }
      />
    </div>
  );
}
