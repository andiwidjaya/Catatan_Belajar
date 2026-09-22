export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  sequence: number;
}

export interface YoutubeTranscriptResult {
  videoId: string;
  language: string;
  fullText: string;
  segments: TranscriptSegment[];
  isAvailable: boolean;
  errorMessage?: string;
}

export interface IYoutubeTranscriptProvider {
  fetchTranscript(videoId: string): Promise<YoutubeTranscriptResult>;
}

export class YoutubeTranscriptService implements IYoutubeTranscriptProvider {
  /**
   * Attempts transcript retrieval contract.
   * If external captions API or Whisper transcriber is unconfigured, returns isAvailable: false
   * clearly indicating transcript acquisition requires external configuration without inventing fake transcripts.
   */
  async fetchTranscript(videoId: string): Promise<YoutubeTranscriptResult> {
    if (!videoId) {
      return {
        videoId: "",
        language: "en",
        fullText: "",
        segments: [],
        isAvailable: false,
        errorMessage: "Invalid video ID",
      };
    }

    // Default status when automated caption provider is pending API integration in future phase
    return {
      videoId,
      language: "en",
      fullText: "",
      segments: [],
      isAvailable: false,
      errorMessage: "Automated YouTube caption extraction service pending transcript API integration.",
    };
  }
}

export const youtubeTranscriptService = new YoutubeTranscriptService();
