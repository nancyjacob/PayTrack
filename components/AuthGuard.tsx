"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const CUSTOMER_SESSION_KEY = "customerSession";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile);
  const router = useRouter();
  const pathname = usePathname();

  // Read the portal-level session flag from localStorage (client-only).
  // null = not yet read; true/false = resolved.
  const [customerSession, setCustomerSession] = useState<boolean | null>(null);

  useEffect(() => {
    setCustomerSession(localStorage.getItem(CUSTOMER_SESSION_KEY) === "1");
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (customerSession === null) return; // flag not yet read from storage

    if (!isAuthenticated || !customerSession) {
      router.replace("/sign-in");
      return;
    }
    if (profile === null && pathname !== "/settings") {
      router.replace("/settings");
    }
  }, [isAuthenticated, isLoading, customerSession, profile, pathname, router]);

  // Show spinner while auth or session flag is still resolving.
  if (isLoading || customerSession === null || (isAuthenticated && customerSession && profile === undefined)) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !customerSession) return null;

  return <>{children}</>;
}
