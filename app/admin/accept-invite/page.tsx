"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Crown, Shield, Headphones, Loader2, CheckCircle2, XCircle } from "lucide-react";
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
  const invitation = useQuery(api.admin.getInvitationByToken, token ? { token } : "skip");
  const acceptInvitation = useMutation(api.admin.acceptAdminInvitation);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      const result = await acceptInvitation({ token });
      setAccepted(true);
      toast.success(`Welcome! You now have ${roleInfo(result.role).label} access.`);
      setTimeout(() => router.replace("/admin"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
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

            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in to your PayTrack account with{" "}
                  <strong>{invitation.email}</strong> to accept this invitation.
                </p>
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(
                      `/sign-in?redirect=${encodeURIComponent(`/admin/accept-invite?token=${token}`)}`
                    )
                  }
                >
                  Sign In to Accept
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  No account?{" "}
                  <a href="/sign-up" className="underline underline-offset-4 hover:text-foreground">
                    Create one first
                  </a>
                </p>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Accepting…
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
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
