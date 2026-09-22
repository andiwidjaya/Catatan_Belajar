"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SourceCitationCard } from "@/components/rag/SourceCitationCard";
import { askGlobalKnowledgeBase, indexAllLibraryContents } from "@/lib/actions/rag";
import { Sparkles, Send, RefreshCw, Database, AlertCircle, CheckCircle2 } from "lucide-react";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    contentId: string;
    contentTitle: string;
    sourceType: string;
    startTime: number | null;
    endTime: number | null;
    snippet: string;
    similarity: number;
  }>;
  hasEnoughContext?: boolean;
}

export default function GlobalKnowledgeRAGPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState<string | null>(null);

  const handleIndexLibrary = async () => {
    setIndexing(true);
    setIndexStatus("Indexing library contents into vector embeddings...");
    try {
      const res = await indexAllLibraryContents();
      if (res.success) {
        setIndexStatus(`Successfully indexed ${res.totalIndexed} items (${res.totalChunks} chunks)`);
      } else {
        setIndexStatus(`Indexing failed: ${res.error}`);
      }
    } catch {
      setIndexStatus("An error occurred during vector indexing.");
    } finally {
      setIndexing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userMessageText = inputQuery.trim();
    setInputQuery("");

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      role: "user",
      content: userMessageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await askGlobalKnowledgeBase(userMessageText);
      if (res.success) {
        const assistantMsg: MessageItem = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.answer || "No response generated.",
          sources: res.sources,
          hasEnoughContext: res.hasEnoughContext,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: MessageItem = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${res.error || "Failed to process question."}`,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "An unexpected error occurred while communicating with the AI service.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ask My Knowledge"
        description="Global vector semantic search & grounded AI assistant across your entire personal library."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Main RAG Chat Interface */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="flex min-h-[560px] flex-col justify-between">
            {/* Messages Area */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[600px]">
              {messages.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-10 w-10 text-cyan-400" />}
                  title="Ask your Personal Library"
                  description='Try asking: "What have I learned about virtue ethics?" or "Summarize key concepts from my notes."'
                />
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 shadow-sm ${
                        msg.role === "user"
                          ? "bg-cyan-600 text-white rounded-br-none"
                          : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                      {msg.role === "assistant" && msg.hasEnoughContext === false && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-400 border border-amber-500/20">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>The AI strictly used only retrieved library context.</span>
                        </div>
                      )}
                    </div>

                    {/* Source References */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 w-full max-w-[88%] space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          <Database className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Retrieved Sources ({msg.sources.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {msg.sources.map((src, i) => (
                            <SourceCitationCard key={i} source={src} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-center gap-3 text-sm text-cyan-400 animate-pulse">
                  <Sparkles className="h-5 w-5 animate-spin" />
                  <span>Generating answer with retrieved library sources...</span>
                </div>
              )}
            </CardContent>

            {/* Input Prompt Bar */}
            <div className="border-t border-slate-800 bg-slate-900/50 p-4 rounded-b-xl">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask a question across your transcripts, summaries & notes..."
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-700"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !inputQuery.trim()}
                  variant="default"
                  icon={<Send className="h-4 w-4" />}
                >
                  Ask
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar Info & Vector Re-indexing */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-cyan-400" />
                pgvector Indexing
              </CardTitle>
              <CardDescription>
                Convert your library transcripts and notes into vector embeddings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <Button
                onClick={handleIndexLibrary}
                disabled={indexing}
                variant="outline"
                className="w-full justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${indexing ? "animate-spin" : ""}`} />
                {indexing ? "Indexing Vector Store..." : "Re-embed Entire Library"}
              </Button>

              {indexStatus && (
                <div className="flex items-start gap-2 rounded-lg bg-slate-900 p-2.5 text-slate-300 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{indexStatus}</span>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-800 text-slate-400">
                <div className="flex justify-between py-1">
                  <span>Embedding Model:</span>
                  <span className="font-mono text-slate-200">text-embedding-004</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Vector Dimensions:</span>
                  <span className="font-mono text-slate-200">768</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Vector Index:</span>
                  <span className="font-mono text-slate-200">HNSW Cosine</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
