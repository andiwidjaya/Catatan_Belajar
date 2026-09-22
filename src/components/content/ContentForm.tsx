"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ContentType, SourceType, ContentStatus } from "@/types/database.types";
import { updateContent } from "@/lib/actions/content";

export interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    description: string | null;
    content_type: ContentType;
    source_type: SourceType;
    source_url: string | null;
    thumbnail_url: string | null;
    category_id: string | null;
    status: ContentStatus;
    is_favorite: boolean;
  } | null;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onSuccess: () => void;
}

export function ContentForm({ isOpen, onClose, content, categories, tags, onSuccess }: ContentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ContentStatus>("unread");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (content) {
      setTitle(content.title || "");
      setDescription(content.description || "");
      setCategoryId(content.category_id || "");
      setStatus(content.status || "unread");
    }
  }, [content]);

  if (!content) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await updateContent(content.id, {
      title,
      description,
      categoryId: categoryId || undefined,
      status,
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Content Details"
      description="Update title, description, category, or status"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit} isLoading={isLoading}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Learning Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="unread">Unread</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="review">Review Queue</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
