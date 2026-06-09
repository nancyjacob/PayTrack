"use client";

import { Suspense, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

function ForgotPasswordForm() {
  const { signIn } = useAuthActions();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/sign-in";
  const backHref = returnTo === "/admin/login" ? "/admin/login" : "/sign-in";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("password", { email, flow: "reset" });
      setSent(true);
    } catch {
      toast.error("Could not send reset email. Check your email address.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    const resetHref = `/reset-password?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`;
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pb-8 pt-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">Check your email</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a reset code to <strong>{email}</strong>
            </p>
          </div>
          <Link href={resetHref} className="w-full">
            <Button className="w-full">Enter reset code</Button>
          </Link>
          <Link
            href={backHref}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? "Sending…" : "Send reset code"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href={backHref}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
