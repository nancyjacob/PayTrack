"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const CUSTOMER_SESSION_KEY = "customerSession";

type Profile = {
  emailVerified?: boolean;
  isDeleted?: boolean;
  [key: string]: unknown;
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const profile = useQuery(api.users.getMyProfile) as Profile | null | undefined;
  const router = useRouter();
  const pathname = usePathname();

  const [customerSession, setCustomerSession] = useState<boolean | null>(null);

  useEffect(() => {
    setCustomerSession(localStorage.getItem(CUSTOMER_SESSION_KEY) === "1");

    function onStorage(e: StorageEvent) {
      if (e.key === CUSTOMER_SESSION_KEY) {
        setCustomerSession(e.newValue === "1");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Deleted accounts: sign out and redirect.
  useEffect(() => {
    if (!profile?.isDeleted) return;
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    signOut().then(() => {
      toast.error("This account has been deleted.");
      router.replace("/sign-in");
    });
  }, [profile, signOut, router]);

  useEffect(() => {
    if (isLoading) return;
    if (customerSession === null) return;

    if (!isAuthenticated || !customerSession) {
      router.replace("/sign-in");
      return;
    }

    if (profile === undefined) return; // still loading

    // emailVerified === false means a brand-new account that has not yet gone
    // through verification. undefined means the field was never set (existing
    // account created before this feature) — those users are let straight through.
    if (profile !== null && profile.emailVerified === false) {
      router.replace("/verify-email");
      return;
    }

    if (profile === null && pathname !== "/settings") {
      router.replace("/settings");
    }
  }, [isAuthenticated, isLoading, customerSession, profile, pathname, router]);

  if (
    isLoading ||
    customerSession === null ||
    (isAuthenticated && customerSession && profile === undefined)
  ) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !customerSession) return null;
  if (profile?.isDeleted) return null;

  return <>{children}</>;
}
