"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const ADMIN_SESSION_KEY = "adminSession";

export default function AdminLoginPage() {
  const { signIn } = useAuthActions();
  const isAdmin = useQuery(api.admin.isAdmin);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Set to true after signIn resolves — waits for isAdmin query to catch up
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);

  // If an active admin session already exists, skip straight to the dashboard
  useEffect(() => {
    if (localStorage.getItem(ADMIN_SESSION_KEY) === "1") {
      router.replace("/admin");
    }
  }, [router]);

  // After signIn completes, wait for isAdmin then grant or deny
  useEffect(() => {
    if (!waitingForAdmin) return;
    if (isAdmin === undefined) return; // still resolving

    if (isAdmin === true) {
      localStorage.setItem(ADMIN_SESSION_KEY, "1");
      router.replace("/admin");
    } else {
      toast.error("This account does not have admin privileges.");
      setTimeout(() => {
        setWaitingForAdmin(false);
        setLoading(false);
      }, 0);
    }
  }, [isAdmin, waitingForAdmin, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      setWaitingForAdmin(true);
    } catch {
      toast.error("Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-semibold">Admin Access</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your admin credentials
          </p>
        </div>

        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                    required
                    disabled={loading}
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
                {loading ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" />Signing in…</>
                ) : (
                  "Sign In to Admin"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Not an admin?{" "}
          <a href="/dashboard" className="underline underline-offset-4 hover:text-foreground">
            Go to app
          </a>
        </p>
      </div>
    </div>
  );
}
