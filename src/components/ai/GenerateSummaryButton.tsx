"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { triggerGeminiSummarization } from "@/lib/actions/ai";

export interface GenerateSummaryButtonProps {
  contentId: string;
  hasExistingSummary?: boolean;
  onSuccess?: () => void;
}

export type ProcessState = "idle" | "processing" | "completed" | "failed" | "retry";

export function GenerateSummaryButton({ contentId, hasExistingSummary, onSuccess }: GenerateSummaryButtonProps) {
  const [state, setState] = useState<ProcessState>(hasExistingSummary ? "completed" : "idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setState("processing");
    setErrorMsg(null);

    const res = await triggerGeminiSummarization(contentId);

    if (res.error) {
      setState("failed");
      setErrorMsg(res.error);
    } else {
      setState("completed");
      if (onSuccess) onSuccess();
    }
  };

  if (state === "processing") {
    return (
      <Button variant="default" size="sm" isLoading disabled className="bg-indigo-600">
        Generating Gemini AI Summary...
      </Button>
    );
  }

  if (state === "failed") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {errorMsg || "Summarization failed"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          className="border-rose-300 text-rose-600 hover:bg-rose-50"
        >
          Retry Summary
        </Button>
      </div>
    );
  }

  if (state === "completed") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Regenerate AI Summary
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleGenerate}
      icon={<Sparkles className="h-4 w-4 text-amber-300" />}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      Generate AI Summary
    </Button>
  );
}
