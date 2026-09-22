"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createTag, deleteTag } from "@/lib/actions/tag";
import { Plus, Trash2, Tag as TagIcon } from "lucide-react";

export interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: { id: string; name: string }[];
  onRefresh: () => void;
}

export function TagManagerModal({ isOpen, onClose, tags, onRefresh }: TagManagerModalProps) {
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await createTag(newTagName.trim());
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setNewTagName("");
      onRefresh();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tag "#${name}"?`)) return;
    await deleteTag(id);
    onRefresh();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Tags"
      description="Add or remove keywords for content tagging"
    >
      <div className="space-y-6">
        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="New Tag Name"
              placeholder="e.g. nextjs, architecture, machine-learning"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="default" isLoading={isLoading} icon={<Plus className="h-4 w-4" />}>
            Add Tag
          </Button>
        </form>

        {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Existing Tags ({tags.length})
          </h4>
          {tags.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tags created yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  <span>#{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag.id, tag.name)}
                    className="text-slate-400 hover:text-rose-500 rounded-full"
                    title="Delete Tag"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
