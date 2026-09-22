"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { BookMarked, LogIn, Mail, Lock } from "lucide-react";
import { loginWithEmail } from "../actions";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginWithEmail(formData);

    setIsLoading(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <BookMarked className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Personal Knowledge Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your video transcripts, AI summaries, & notes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your email and password to log in</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <ErrorState title="Authentication Failed" message={errorMsg} />}

              <Input
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                required
                leftIcon={<Mail className="h-4 w-4" />}
              />

              <Input
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                required
                leftIcon={<Lock className="h-4 w-4" />}
              />

              <Button
                type="submit"
                variant="default"
                className="w-full"
                isLoading={isLoading}
                icon={<LogIn className="h-4 w-4" />}
              >
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-slate-500 dark:text-slate-400">
            <span>Don&apos;t have an account yet? </span>
            <Link href="/register" className="ml-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create Account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
