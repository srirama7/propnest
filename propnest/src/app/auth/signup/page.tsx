"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p>Loading...</p></div>}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validatePhone(value: string): boolean {
    return /^[6-9]\d{9}$/.test(value);
  }

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleEmailSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error(t("auth.name_error"));
      return;
    }

    if (!phone.trim() || !validatePhone(phone.trim())) {
      toast.error(t("auth.phone_error"));
      return;
    }

    if (!email.trim() || !validateEmail(email.trim())) {
      toast.error(t("auth.email_error"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("auth.password_length_error"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("auth.password_match_error"));
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Create profile document in Firestore
      try {
        await setDoc(doc(db, "profiles", user.uid), {
          id: user.uid,
          full_name: fullName.trim(),
          phone: phone.trim(),
          avatar_url: null,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (profileError) {
        console.error("Failed to create profile:", profileError);
      }

      toast.success(t("auth.account_created"));
      router.push(redirectTo);
      router.refresh();
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/email-already-in-use") {
        toast.error(t("auth.email_in_use"));
      } else if (firebaseError.code === "auth/weak-password") {
        toast.error(t("auth.weak_password"));
      } else if (firebaseError.code === "auth/invalid-email") {
        toast.error(t("auth.invalid_email"));
      } else if (firebaseError.code === "auth/network-request-failed") {
        toast.error(t("auth.network_error"));
      } else {
        toast.error(t("auth.signup_failed"));
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/30 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/10 px-4 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/20 dark:bg-blue-800/10 blur-3xl" /><div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-200/20 dark:bg-indigo-800/10 blur-3xl" /></div>
      <Card className="relative w-full max-w-md rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 inline-block">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              BhoomiTayi
            </h1>
          </Link>
          <CardTitle className="text-xl">{t("auth.create_account")}</CardTitle>
          <CardDescription>
            {t("auth.get_started")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("auth.full_name")}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t("auth.full_name_placeholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("auth.phone_number")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t("auth.phone_placeholder")}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(val);
                }}
                required
                disabled={isLoading}
                autoComplete="tel"
                maxLength={10}
              />
              {phone && !validatePhone(phone) && (
                <p className="text-xs text-red-500">{t("auth.valid_phone_error")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirm_password")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.confirm_password_placeholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">{t("auth.passwords_not_match")}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t("auth.creating_account") : t("auth.create_account_btn")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.already_have_account")}{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              {t("auth.sign_in")}
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("auth.or")}{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              {t("auth.sign_in_with_google")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
