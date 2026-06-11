"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MailCheck, RefreshCw } from "lucide-react";

const OTP_LENGTH = 6;

const getVerificationStatus = makeFunctionReference<"query">(
  "emailVerification:getVerificationStatus"
);
const verifyEmailToken = makeFunctionReference<"mutation">(
  "emailVerification:verifyEmailToken"
);
const resendVerification = makeFunctionReference<"action">(
  "emailVerification:resendVerification"
);

export default function VerifyEmailPage() {
  const router = useRouter();
  const status = useQuery(getVerificationStatus);
  const verifyToken = useMutation(verifyEmailToken);
  const resend = useAction(resendVerification);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // If already verified, go to settings
  useEffect(() => {
    if (status?.verified) {
      router.replace("/settings");
    }
  }, [status, router]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resendCooldown]);

  function handleDigitChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = digits.join("");
    if (token.length < OTP_LENGTH) {
      toast.error("Please enter all 6 digits.");
      return;
    }
    setSubmitting(true);
    try {
      await verifyToken({ token });
      toast.success("Email verified! Welcome to PayTrack.");
      router.replace("/settings");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resend({});
      toast.success("A new code has been sent to your email.");
      setDigits(Array(OTP_LENGTH).fill(""));
      setResendCooldown(120);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  if (status === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck size={24} className="text-primary" />
        </div>
        <CardTitle className="font-heading text-2xl">Check your inbox</CardTitle>
        <CardDescription>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">
            {status?.email ?? "your email"}
          </span>
          . Enter it below to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 text-center text-lg font-bold tracking-widest"
                aria-label={`Digit ${i + 1}`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || digits.join("").length < OTP_LENGTH}
          >
            {submitting ? "Verifying…" : "Verify Email"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Didn't receive a code?</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="gap-2"
          >
            <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : resending
              ? "Sending…"
              : "Resend code"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          The code expires in 30 minutes. Check your spam folder if you don't see it.
        </p>
      </CardContent>
    </Card>
  );
}
