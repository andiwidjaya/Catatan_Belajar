"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createCategory, deleteCategory } from "@/lib/actions/category";
import { Plus, Trash2, Tag } from "lucide-react";

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; color: string | null }[];
  onRefresh: () => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onRefresh,
}: CategoryManagerModalProps) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#4F46E5");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const res = await createCategory(newCatName.trim(), newCatColor);
    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setNewCatName("");
      onRefresh();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Content items using this category will become uncategorized.`)) return;
    await deleteCategory(id);
    onRefresh();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Categories"
      description="Add or remove content organization categories"
    >
      <div className="space-y-6">
        {/* Create Form */}
        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="New Category Name"
              placeholder="e.g. Artificial Intelligence"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
          </div>
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded-lg border border-slate-300 p-1 dark:border-slate-700 bg-white dark:bg-slate-900"
            title="Category Color"
          />
          <Button type="submit" variant="default" isLoading={isLoading} icon={<Plus className="h-4 w-4" />}>
            Add
          </Button>
        </form>

        {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

        {/* Existing Categories List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Existing Categories ({categories.length})
          </h4>
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No categories created yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color || "#4F46E5" }} />
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
