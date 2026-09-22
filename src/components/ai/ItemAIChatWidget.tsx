"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  getOrCreateItemConversation,
  getItemConversationMessages,
  sendItemChatMessage,
  clearItemConversation,
} from "@/lib/actions/chat";
import { Sparkles, Send, Trash2, User, Bot, ShieldCheck, RefreshCw, Copy, Check } from "lucide-react";

export interface ItemAIChatWidgetProps {
  contentId: string;
  contentTitle: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export function ItemAIChatWidget({ contentId, contentTitle }: ItemAIChatWidgetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const suggestedQuestions = [
    "What are the main takeaways from this content?",
    "Explain the core technical concepts mentioned.",
    "Summarize the key points in 3 simple sentences.",
  ];

  const initializeChat = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const convRes = await getOrCreateItemConversation(contentId);
    if (convRes.error || !convRes.data) {
      setErrorMsg(convRes.error || "Failed to initialize conversation.");
      setIsLoading(false);
      return;
    }

    const convId = convRes.data.id;
    setConversationId(convId);

    const msgs = await getItemConversationMessages(convId);
    setMessages(msgs as ChatMessage[]);
    setIsLoading(false);
  }, [contentId]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || !conversationId || isSending) return;

    setInputQuery("");
    setErrorMsg(null);
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: query.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const res = await sendItemChatMessage(conversationId, contentId, query.trim());
    setIsSending(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.assistantMessage) {
      setMessages((prev) => [...prev, res.assistantMessage as ChatMessage]);
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleClearHistory = async () => {
    if (!conversationId) return;
    if (!confirm("Clear this conversation history?")) return;
    await clearItemConversation(conversationId, contentId);
    setMessages([]);
  };

  if (isLoading) {
    return <LoadingState label="Initializing AI chat assistant..." />;
  }

  return (
    <Card className="flex flex-col h-[550px] border-indigo-200 dark:border-indigo-900/60 shadow-md">
      {/* Widget Header */}
      <CardHeader className="py-3 px-5 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/30 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Ask AI about this Content
            </CardTitle>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" />
              <span>Grounded strictly in &quot;{contentTitle}&quot;</span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </CardHeader>

      {/* Message Stream Body */}
      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {errorMsg && <ErrorState title="Chat Error" message={errorMsg} />}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Have a question about this content?
              </p>
              <p className="text-slate-500 max-w-sm">
                Ask questions to extract specific facts, definitions, or insights from the transcript.
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full max-w-sm space-y-2 pt-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Suggested Questions
              </p>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300 text-xs transition-colors"
                >
                  &quot;{q}&quot;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className="relative group max-w-[85%]">
                  <div
                    className={`rounded-2xl p-3.5 leading-relaxed whitespace-pre-line ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="absolute -bottom-2 right-2 p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy response text"
                    >
                      {copiedMsgId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
                {isUser && (
                  <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex gap-3 justify-start items-center text-slate-500">
            <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              <span>Thinking based on content transcript...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Ask a question about this content..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isSending}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-700"
          />
          <Button
            type="submit"
            variant="default"
            disabled={!inputQuery.trim() || isSending}
            isLoading={isSending}
            icon={<Send className="h-4 w-4" />}
          >
            Ask
          </Button>
        </form>
      </div>
    </Card>
  );
}
