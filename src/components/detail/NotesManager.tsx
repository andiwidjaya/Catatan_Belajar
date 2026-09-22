"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { createNote, updateNote, deleteNote } from "@/lib/actions/notes";
import { StickyNote, Plus, Trash2, Edit3, Save, Clock, Play } from "lucide-react";

export interface NoteItem {
  id: string;
  user_id: string;
  content_id: string;
  text: string;
  timestamp: number | null;
  created_at: string;
  updated_at: string;
}

export interface NotesManagerProps {
  contentId: string;
  notes: NoteItem[];
  currentTime?: number;
  onSeekTime?: (seconds: number) => void;
  onRefresh: () => void;
}

export function NotesManager({
  contentId,
  notes,
  currentTime = 0,
  onSeekTime,
  onRefresh,
}: NotesManagerProps) {
  const [newNoteText, setNewNoteText] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const ts = includeTimestamp && currentTime > 0 ? Math.floor(currentTime) : undefined;
    const res = await createNote(contentId, newNoteText.trim(), ts);

    setIsLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setNewNoteText("");
      onRefresh();
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editText.trim()) return;

    const res = await updateNote(noteId, contentId, editText.trim());
    if (!res.error) {
      setEditingNoteId(null);
      onRefresh();
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this personal note?")) return;
    await deleteNote(noteId, contentId);
    onRefresh();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <StickyNote className="h-4 w-4 text-amber-500" />
          Personal Study Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Note Form */}
        <form onSubmit={handleCreate} className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
          {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

          <Textarea
            placeholder="Type your personal note or insight here..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            rows={3}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Attach media timestamp ({formatSeconds(currentTime)})</span>
            </label>

            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={isLoading}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Note
            </Button>
          </div>
        </form>

        {/* Existing Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">
              No personal notes created yet. Use the box above to capture study notes.
            </p>
          ) : (
            notes.map((note) => {
              const isEditingThis = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {note.timestamp !== null && note.timestamp !== undefined && (
                        <button
                          onClick={() => onSeekTime && onSeekTime(note.timestamp!)}
                          className="flex items-center gap-1 font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 hover:bg-amber-600 hover:text-white transition-colors"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          {formatSeconds(note.timestamp)}
                        </button>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(note.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isEditingThis ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditText(note.text);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title="Edit Note"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete Note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          onClick={() => handleUpdate(note.id)}
                          icon={<Save className="h-3 w-3" />}
                        >
                          Save
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditingThis ? (
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {note.text}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
