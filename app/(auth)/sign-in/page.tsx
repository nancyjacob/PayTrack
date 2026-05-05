"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("email", { email: otpEmail });
      setOtpStep("code");
      toast.success("Check your email for a 6-digit code");
    } catch {
      toast.error("Failed to send code. Check your email address.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("email", { email: otpEmail, code: otpCode });
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading">Welcome back</CardTitle>
        <CardDescription>Sign in to your PayTrack account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="password" className="flex-1">
              Password
            </TabsTrigger>
            <TabsTrigger value="otp" className="flex-1">
              Magic Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="password">
            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="otp">
            {otpStep === "email" ? (
              <form onSubmit={handleOtpSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="you@example.com"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to <strong>{otpEmail}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Code</Label>
                  <Input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying…" : "Verify Code"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpStep("email");
                    setOtpCode("");
                  }}
                >
                  ← Back
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/sign-up"
            className="text-primary underline-offset-4 hover:underline font-medium"
          >
            Sign up free
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
