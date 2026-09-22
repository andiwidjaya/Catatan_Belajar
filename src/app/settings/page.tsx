"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { signOutUser } from "@/app/(auth)/actions";
import {
  getUserSettings,
  updateProfile,
  updateUserPreferences,
  deleteUserAccountData,
  UserSettingsData,
} from "@/lib/actions/userSettings";
import {
  User,
  Sliders,
  Sparkles,
  ShieldCheck,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preferences Form state
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [defaultContentStatus, setDefaultContentStatus] = useState("unread");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Settings Form state
  const [summaryLanguage, setSummaryLanguage] = useState("en");
  const [preferredSummaryLength, setPreferredSummaryLength] = useState("standard");
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [aiMsg, setAiMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account Deletion Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    const res = await getUserSettings();
    setIsLoading(false);
    if (res.data) {
      setSettings(res.data);
      setFullName(res.data.fullName);
      setDefaultLanguage(res.data.preferences.defaultLanguage);
      setDefaultContentStatus(res.data.preferences.defaultContentStatus);
      setSummaryLanguage(res.data.preferences.summaryLanguage);
      setPreferredSummaryLength(res.data.preferences.preferredSummaryLength);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsSavingProfile(true);

    const res = await updateProfile(fullName);
    setIsSavingProfile(false);

    if (res.error) {
      setProfileMsg({ type: "error", text: res.error });
    } else {
      setProfileMsg({ type: "success", text: "Profile name updated successfully!" });
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefsMsg(null);
    setIsSavingPrefs(true);

    const res = await updateUserPreferences({
      defaultLanguage,
      defaultContentStatus,
    });
    setIsSavingPrefs(false);

    if (res.error) {
      setPrefsMsg({ type: "error", text: res.error });
    } else {
      setPrefsMsg({ type: "success", text: "Default preferences saved in Supabase!" });
      setTimeout(() => setPrefsMsg(null), 3000);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiMsg(null);
    setIsSavingAi(true);

    const res = await updateUserPreferences({
      summaryLanguage,
      preferredSummaryLength,
    });
    setIsSavingAi(false);

    if (res.error) {
      setAiMsg({ type: "error", text: res.error });
    } else {
      setAiMsg({ type: "success", text: "AI summary settings saved!" });
      setTimeout(() => setAiMsg(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== "DELETE") return;
    setIsDeletingAccount(true);
    setDeleteError(null);

    const res = await deleteUserAccountData();
    setIsDeletingAccount(false);

    if (res.error) {
      setDeleteError(res.error);
    } else {
      window.location.href = "/login";
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading user settings & preferences..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <PageHeader
        title="Settings & Preferences"
        description="Manage your user profile, content ingestion defaults, AI summary preferences, and security options."
      />

      <div className="space-y-6">
        {/* SECTION 1: PROFILE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>Update your personal account details.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  value={settings?.email || ""}
                  disabled
                  helperText="Managed by Supabase Auth service."
                />
              </div>

              {profileMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200"
                      : "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200"
                  }`}
                >
                  {profileMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {profileMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SECTION 2: PREFERENCES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Sliders className="h-5 w-5" />
              System Preferences
            </CardTitle>
            <CardDescription>Configure default language and content status for new items.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Content Language
                  </label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English (en)</option>
                    <option value="id">Indonesian (id)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="zh">Chinese (zh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Default Ingestion Status
                  </label>
                  <select
                    value={defaultContentStatus}
                    onChange={(e) => setDefaultContentStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="unread">Unread</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Send to Review Queue</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {prefsMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    prefsMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200"
                      : "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200"
                  }`}
                >
                  {prefsMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {prefsMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={isSavingPrefs}>
                  {isSavingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SECTION 3: AI SETTINGS & SECURITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
              AI Summary Settings
            </CardTitle>
            <CardDescription>Customize Google Gemini 2.5 Flash analysis and summary formats.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSaveAiSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Summary Output Language
                  </label>
                  <select
                    value={summaryLanguage}
                    onChange={(e) => setSummaryLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="id">Indonesian</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Preferred Summary Detail Level
                  </label>
                  <select
                    value={preferredSummaryLength}
                    onChange={(e) => setPreferredSummaryLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="brief">Brief (Executive Overview & 3 Key Points)</option>
                    <option value="standard">Standard (Comprehensive Summary & Concepts)</option>
                    <option value="detailed">Detailed (Deep Technical Extraction)</option>
                  </select>
                </div>
              </div>

              {aiMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    aiMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200"
                      : "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200"
                  }`}
                >
                  {aiMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {aiMsg.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm" disabled={isSavingAi}>
                  {isSavingAi ? "Saving..." : "Save AI Settings"}
                </Button>
              </div>
            </form>

            {/* Secure Gemini Server Key Badge */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Google Gemini API Key Security
                  </span>
                </div>
                <Badge variant="success" className="font-mono text-[10px]">
                  Server Environment Secured
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The Google Gemini 2.5 Flash API key is securely managed on the backend server environment (`GEMINI_API_KEY`). Client-side API key inputs are prohibited to prevent secret exposure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: ACCOUNT */}
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Lock className="h-5 w-5" />
              Account & Danger Zone
            </CardTitle>
            <CardDescription>Manage session authentication and permanent account actions.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Sign Out Session</h4>
                <p className="text-xs text-slate-500">Safely log out of your personal knowledge account session.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={signOutUser} icon={<LogOut className="h-4 w-4 text-slate-600" />}>
                Sign Out
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
              <div>
                <h4 className="text-xs font-semibold text-red-600 dark:text-red-400">Delete Account & Knowledge Base</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanently erase your library items, transcripts, notes, summaries, and activity history.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Account Deletion Flow Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setConfirmText("");
          setDeleteError(null);
        }}
        title="Permanently Delete Account & Knowledge Data"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 text-xs text-red-600 dark:text-red-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="h-4 w-4" /> Warning: Irreversible Action
            </div>
            <p>
              Deleting your account will purge all stored videos, audio transcripts, AI summaries, personal notes, categories, tags, and activity history from Supabase.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              To confirm, type <span className="font-mono text-red-600">DELETE</span> below:
            </label>
            <input
              type="text"
              placeholder="Type DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />
          </div>

          {deleteError && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{deleteError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmText.trim() !== "DELETE" || isDeletingAccount}
              onClick={handleDeleteAccount}
              icon={<Trash2 className="h-4 w-4" />}
            >
              {isDeletingAccount ? "Deleting..." : "Permanently Delete Account"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
