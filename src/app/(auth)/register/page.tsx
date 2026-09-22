"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { BookMarked, UserPlus, Mail, Lock, User } from "lucide-react";
import { registerWithEmail } from "../actions";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await registerWithEmail(formData);

    setIsLoading(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessMsg("Account created successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
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
            Create Your Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Build your personal AI-powered knowledge library today
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your details to create a new library account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <ErrorState title="Registration Error" message={errorMsg} />}
              {successMsg && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  {successMsg}
                </div>
              )}

              <Input
                name="fullName"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                required
                leftIcon={<User className="h-4 w-4" />}
              />

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
                placeholder="Minimum 6 characters"
                minLength={6}
                required
                leftIcon={<Lock className="h-4 w-4" />}
              />

              <Button
                type="submit"
                variant="default"
                className="w-full"
                isLoading={isLoading}
                icon={<UserPlus className="h-4 w-4" />}
              >
                Register Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-slate-500 dark:text-slate-400">
            <span>Already have an account? </span>
            <Link href="/login" className="ml-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
