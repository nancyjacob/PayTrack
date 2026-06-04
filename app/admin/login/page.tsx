"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useConvexAuth } from "convex/react";
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
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Only set to true after the user explicitly submits the login form.
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);

  // Single effect that handles both redirect and error — but only after
  // the user explicitly signed in (waitingForAdmin) and auth has fully settled.
  // Guarding on isAuthenticated prevents firing against stale isAdmin=false values
  // that appear during the session transition (sign-out-then-sign-in cycle),
  // which caused the spurious "no admin privileges" toast and blocked Issue 2 logins.
  // Not running unless waitingForAdmin fixes Issue 3: visiting /admin/login while
  // already authenticated as an admin no longer auto-grants admin access.
  useEffect(() => {
    if (!waitingForAdmin) return;
    if (isLoading) return;
    if (!isAuthenticated) return;   // auth is still transitioning — wait
    if (isAdmin === undefined) return; // isAdmin query still loading

    if (isAdmin === true) {
      localStorage.setItem(ADMIN_SESSION_KEY, "1");
      router.replace("/admin");
    } else {
      toast.error("This account does not have admin privileges.");
      setWaitingForAdmin(false);
      setLoading(false);
    }
  }, [isAdmin, isAuthenticated, isLoading, router, waitingForAdmin]);

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
