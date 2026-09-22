"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { createContent } from "@/lib/actions/content";
import { getCategories } from "@/lib/actions/category";
import { FileText, Save, FileCode } from "lucide-react";

export default function TextLibraryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then((data) => setCategories(data));
  }, []);

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const charCount = description.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a title for your note.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Please enter text content or notes.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await createContent({
      title: title.trim(),
      description: description.trim() || undefined,
      contentType: "text",
      sourceType: "manual",
      sourceUrl: sourceUrl.trim() || undefined,
      categoryId: categoryId || undefined,
    });

    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      router.push("/library");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual Text Note"
        description="Save article excerpts, raw notes, transcripts, or study documentation."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Add Text Content
          </CardTitle>
          <CardDescription>
            Store raw study notes or article text for future AI processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && <ErrorState title="Creation Failed" message={errorMsg} />}

            <Input
              label="Title"
              placeholder="e.g. Next.js 15 App Router Architecture Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Source URL (Optional)"
                placeholder="https://example.com/article"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assign Category (Optional)
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
            </div>

            <div className="space-y-1">
              <Textarea
                label="Raw Text Content / Notes"
                placeholder="Paste article text or personal notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                required
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono px-1">
                <span className="flex items-center gap-1">
                  <FileCode className="h-3 w-3 text-slate-400" /> Note Length
                </span>
                <span>
                  {wordCount} words | {charCount} characters
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="default" isLoading={isLoading} icon={<Save className="h-4 w-4" />}>
                Save Note
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
