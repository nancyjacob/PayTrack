"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Crown,
  Shield,
  Headphones,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

function roleInfo(role: string) {
  if (role === "super_admin")
    return { label: "Super Admin", icon: Crown, description: "Full platform control and admin management" };
  if (role === "admin")
    return { label: "Admin", icon: Shield, description: "Access to users, invoices, and support management" };
  return { label: "Support Agent", icon: Headphones, description: "Access to support ticket management" };
}

function AcceptInviteContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const invitation = useQuery(api.admin.getInvitationByToken, token ? { token } : "skip");
  const acceptInvitation = useMutation(api.admin.acceptAdminInvitation);

  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isNewAccount, setIsNewAccount] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      const result = await acceptInvitation({ token });
      localStorage.setItem("adminSession", "1");
      setAccepted(true);
      toast.success(`Welcome! You now have ${roleInfo(result.role).label} access.`);
      setTimeout(() => router.replace("/admin"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invitation");
      setAccepting(false);
    }
  }

  async function handleSignUpAndAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!invitation) return;
    setAccepting(true);
    try {
      if (isNewAccount) {
        await signIn("password", {
          email: invitation.email,
          name: name.trim(),
          password,
          flow: "signUp",
        });
      } else {
        await signIn("password", {
          email: invitation.email,
          password,
          flow: "signIn",
        });
      }
      const result = await acceptInvitation({ token });
      localStorage.setItem("adminSession", "1");
      setAccepted(true);
      toast.success(`Welcome! You now have ${roleInfo(result.role).label} access.`);
      setTimeout(() => router.replace("/admin"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials or invitation error");
      setAccepting(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <XCircle size={36} className="mx-auto text-destructive/60" />
            <p className="font-semibold">Invalid Link</p>
            <p className="text-sm text-muted-foreground">
              This invitation link is missing a token. Please use the full link from your invitation email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || invitation === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <XCircle size={36} className="mx-auto text-destructive/60" />
            <p className="font-semibold">Invitation Not Found</p>
            <p className="text-sm text-muted-foreground">
              This invitation link is invalid or has already been used.
            </p>
            <Button variant="outline" size="sm" onClick={() => router.replace("/")}>
              Go to PayTrack
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <XCircle size={36} className="mx-auto text-amber-500/60" />
            <p className="font-semibold">Invitation Expired</p>
            <p className="text-sm text-muted-foreground">
              This invitation has expired or been revoked. Ask a Super Admin to send a new one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    const info = roleInfo(invitation.role);
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-green-500" />
            <p className="font-semibold">Invitation Accepted!</p>
            <p className="text-sm text-muted-foreground">
              You now have <strong>{info.label}</strong> access. Redirecting to the admin panel…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const info = roleInfo(invitation.role);
  const RoleIcon = info.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-semibold">Admin Invitation</h1>
          <p className="text-sm text-muted-foreground">
            You've been invited to join the PayTrack admin team
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-primary/10 p-2.5">
                <RoleIcon size={18} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{info.label}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {info.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm">
              <p className="text-muted-foreground text-xs mb-0.5">Invited email</p>
              <p className="font-medium">{invitation.email}</p>
            </div>

            {isAuthenticated ? (
              <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                {accepting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Accepting…
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            ) : (
              <form onSubmit={handleSignUpAndAccept} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation.email}
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                {isNewAccount && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required={isNewAccount}
                      autoFocus
                    />
                  </div>
                )}

                <div className="space-y-1.5">
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
                      autoFocus={!isNewAccount}
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

                <Button type="submit" className="w-full" disabled={accepting}>
                  {accepting ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      {isNewAccount ? "Creating account…" : "Signing in…"}
                    </>
                  ) : isNewAccount ? (
                    "Create Account & Accept"
                  ) : (
                    "Sign In & Accept"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNewAccount((v) => !v);
                    setPassword("");
                  }}
                  className="text-xs text-center text-muted-foreground underline underline-offset-4 hover:text-foreground w-full"
                >
                  {isNewAccount
                    ? "Already have a PayTrack account? Sign in instead"
                    : "New to PayTrack? Create an account instead"}
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <a href="/" className="underline underline-offset-4 hover:text-foreground">
            Go to PayTrack
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
