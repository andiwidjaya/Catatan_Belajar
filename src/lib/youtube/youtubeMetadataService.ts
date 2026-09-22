export interface YoutubeMetadata {
  videoId: string;
  sourceUrl: string;
  title: string;
  authorName?: string;
  authorUrl?: string;
  thumbnailUrl: string;
  providerName?: string;
}

export function extractYoutubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Pattern for youtube.com/watch?v=ID, youtube.com/embed/ID, youtube.com/shorts/ID, youtu.be/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null;
}

export async function fetchYoutubeMetadata(url: string): Promise<YoutubeMetadata> {
  const videoId = extractYoutubeVideoId(url);

  if (!videoId) {
    throw new Error("Invalid YouTube URL. Please provide a valid YouTube video link.");
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const response = await fetch(oembedUrl, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "PersonalKnowledgeLibrary/1.0",
      },
    });

    if (response.status === 404) {
      throw new Error("YouTube video not found. The video may be private, unlisted, or deleted.");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube metadata (Status ${response.status}).`);
    }

    const data = await response.json();

    const hqThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      sourceUrl: canonicalUrl,
      title: data.title || `YouTube Video (${videoId})`,
      authorName: data.author_name,
      authorUrl: data.author_url,
      thumbnailUrl: hqThumbnailUrl,
      providerName: data.provider_name || "YouTube",
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("An unexpected error occurred while contacting YouTube services.");
  }
}
