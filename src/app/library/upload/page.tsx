"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { registerUploadedMedia } from "@/lib/actions/upload";
import { getCategories } from "@/lib/actions/category";
import { createClient } from "@/lib/supabase/client";
import {
  mediaStorageService,
  validateMediaFile,
  detectContentTypeFromFile,
  ALLOWED_EXTENSIONS,
  UploadProgressInfo,
} from "@/lib/storage/mediaStorageService";
import { UploadCloud, FileAudio, FileVideo, X, CheckCircle2, AlertCircle } from "lucide-react";

export default function UploadLibraryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    getCategories().then((data) => setCategories(data));
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setErrorMsg(null);
    setIsCancelled(false);

    const validation = validateMediaFile(selectedFile);
    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || "Invalid file selection.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto-populate title from file name without extension
      const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) || selectedFile.name;
      setTitle(nameWithoutExt.replace(/[-_]/g, " "));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleCancelUpload = () => {
    setIsCancelled(true);
    setIsUploading(false);
    setUploadProgress(null);
    setErrorMsg("Upload cancelled by user.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select an audio or video file to upload.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Please enter a title for this content item.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setIsCancelled(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User session expired. Please sign in again.");
      }

      const contentId = crypto.randomUUID();
      const contentType = detectContentTypeFromFile(file);

      // Upload file to Supabase Storage using service abstraction
      const uploadRes = await mediaStorageService.uploadFile({
        userId: user.id,
        contentId,
        file,
        onProgress: (p) => {
          if (!isCancelled) setUploadProgress(p);
        },
      });

      if (isCancelled) return;

      // Register content record in database
      const dbRes = await registerUploadedMedia({
        title: title.trim(),
        description: description.trim() || undefined,
        contentType,
        storagePath: uploadRes.storagePath,
        categoryId: categoryId || undefined,
      });

      setIsUploading(false);

      if (dbRes.error) {
        setErrorMsg(dbRes.error);
      } else {
        router.push("/library");
        router.refresh();
      }
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadProgress(null);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to upload file due to an unexpected error.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Personal Audio / Video"
        description="Upload personal recordings directly to your secure private library."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-sky-600" />
            Media File Ingestion
          </CardTitle>
          <CardDescription>
            Supported formats: {ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(", ")} (Max 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && <ErrorState title="Upload Error" message={errorMsg} />}

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                  : file
                  ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : "border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-indigo-400"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".mp3,.m4a,.wav,.mp4,.webm"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                    {file.name.endsWith(".mp4") || file.name.endsWith(".webm") ? (
                      <FileVideo className="h-6 w-6" />
                    ) : (
                      <FileAudio className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500 hover:text-rose-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Click to select file or drag & drop here
                  </p>
                  <p className="text-xs text-slate-500">Audio or Video format up to 50MB</p>
                </div>
              )}
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && uploadProgress && (
              <div className="space-y-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-4 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  <span>Uploading to private storage...</span>
                  <span>{uploadProgress.percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-200 dark:bg-indigo-900">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Cancel Upload
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <Input
              label="Title"
              placeholder="e.g. Personal Audio Note on Distributed Systems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category (Optional)
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

            <Textarea
              label="Description / Meeting Notes (Optional)"
              placeholder="Add details, topics covered, or summary notes..."
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
                isLoading={isUploading}
                disabled={!file || isUploading}
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                Start Upload & Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
