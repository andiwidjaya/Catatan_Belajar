"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

export interface MediaPlayerProps {
  title: string;
  sourceType: "youtube" | "upload" | "manual";
  contentType: "video" | "audio" | "text";
  sourceId?: string | null;
  signedPlaybackUrl?: string | null;
  thumbnailUrl?: string | null;
  seekTime?: number | null;
  onTimeUpdate?: (currentTime: number) => void;
}

export function MediaPlayer({
  title,
  sourceType,
  contentType,
  sourceId,
  signedPlaybackUrl,
  thumbnailUrl,
  seekTime,
  onTimeUpdate,
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle seeking for HTML5 Video / Audio
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined) {
      if (videoRef.current) {
        videoRef.current.currentTime = seekTime;
        videoRef.current.play().catch(() => {});
      } else if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
        audioRef.current.play().catch(() => {});
      } else if (iframeRef.current && sourceType === "youtube") {
        // Send postMessage seek to YouTube iframe embed
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [seekTime, true] }),
          "*"
        );
      }
    }
  }, [seekTime, sourceType]);

  if (sourceType === "youtube" && sourceId) {
    return (
      <div className="relative aspect-video w-full rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shadow-lg">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${sourceId}?enablejsapi=1`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (sourceType === "upload" && signedPlaybackUrl) {
    if (contentType === "video") {
      return (
        <div className="relative aspect-video w-full rounded-xl bg-slate-900 overflow-hidden border border-slate-800 shadow-lg">
          <video
            ref={videoRef}
            src={signedPlaybackUrl}
            controls
            onTimeUpdate={(e) => onTimeUpdate && onTimeUpdate(e.currentTarget.currentTime)}
            className="h-full w-full object-contain"
          />
        </div>
      );
    }

    return (
      <div className="relative w-full rounded-xl bg-slate-900 p-8 border border-slate-800 shadow-lg flex flex-col items-center justify-center space-y-4 text-white">
        <div className="h-16 w-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
          <PlayCircle className="h-10 w-10 stroke-[1.5]" />
        </div>
        <audio
          ref={audioRef}
          src={signedPlaybackUrl}
          controls
          onTimeUpdate={(e) => onTimeUpdate && onTimeUpdate(e.currentTarget.currentTime)}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  // Static Thumbnail or Icon fallback for manual text content
  return (
    <div className="relative aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
      {thumbnailUrl ? (
        <Image src={thumbnailUrl} alt={title} fill className="object-cover" />
      ) : (
        <div className="text-slate-400 flex flex-col items-center gap-2">
          <PlayCircle className="h-12 w-12 stroke-[1.5]" />
          <span className="text-xs">No media preview available for this item</span>
        </div>
      )}
    </div>
  );
}
