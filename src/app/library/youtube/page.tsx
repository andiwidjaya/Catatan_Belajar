"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { importYoutubeVideo } from "@/lib/actions/youtube";
import { getCategories } from "@/lib/actions/category";
import { extractYoutubeVideoId } from "@/lib/youtube/youtubeMetadataService";
import { Youtube, Link as LinkIcon, CheckCircle2, PlayCircle, Loader2 } from "lucide-react";

export default function YoutubeLibraryPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [extractedVideoId, setExtractedVideoId] = useState<string | null>(null);
  const [importStep, setImportStep] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then((data) => setCategories(data));
  }, []);

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setErrorMsg(null);
    const id = extractYoutubeVideoId(val);
    setExtractedVideoId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setErrorMsg(null);
    setImportStep("Validating YouTube URL & Fetching Metadata...");

    const res = await importYoutubeVideo({
      url: url.trim(),
      customTitle: customTitle.trim() || undefined,
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
    });

    if (res.error) {
      setErrorMsg(res.error);
      setImportStep(null);
    } else {
      setImportStep("Successfully saved! Redirecting to library...");
      setTimeout(() => {
        router.push("/library");
        router.refresh();
      }, 1000);
    }
  };

  const previewThumbnail = extractedVideoId
    ? `https://img.youtube.com/vi/${extractedVideoId}/hqdefault.jpg`
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import YouTube Video"
        description="Extract real metadata, video thumbnails, and channel details from YouTube links."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                Add YouTube Video Link
              </CardTitle>
              <CardDescription>
                Supports standard watch links, shortened links (youtu.be), embeds, and YouTube Shorts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && <ErrorState title="Import Error" message={errorMsg} />}

                {importStep && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 p-3 text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0 text-indigo-600" />
                    <span>{importStep}</span>
                  </div>
                )}

                <Input
                  label="YouTube URL"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                  leftIcon={<LinkIcon className="h-4 w-4" />}
                  helperText={
                    extractedVideoId
                      ? `Valid YouTube Video ID: ${extractedVideoId}`
                      : "Enter a YouTube link to fetch metadata automatically"
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Custom Title (Optional)"
                    placeholder="Leave empty to use official video title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Assign Category
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

                <Textarea
                  label="Personal Context / Notes (Optional)"
                  placeholder="Add study notes or context about this video..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    isLoading={!!importStep}
                    disabled={!extractedVideoId}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Import Video
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Video Thumbnail Preview Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Video Thumbnail Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {previewThumbnail ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={previewThumbnail}
                      alt="YouTube thumbnail preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Video Detected</p>
                    <p className="font-mono text-[10px]">ID: {extractedVideoId}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400">
                  <PlayCircle className="h-10 w-10 mb-2 stroke-[1.5]" />
                  <p className="text-xs">Paste a YouTube link to preview video thumbnail</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
