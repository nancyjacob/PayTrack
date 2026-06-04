"use client";

import { useQuery } from "convex/react";
import { CUSTOMER_SESSION_KEY } from "@/components/AuthGuard";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Building2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/analytics") return "Analytics";
  if (pathname === "/invoices/new") return "New Invoice";
  if (/^\/invoices\/[^/]+\/edit$/.test(pathname)) return "Edit Invoice";
  if (/^\/invoices\/[^/]+$/.test(pathname)) return "Invoice";
  if (pathname.startsWith("/invoices")) return "Invoices";
  if (pathname.startsWith("/clients")) return "Clients";
  if (pathname === "/billing") return "Billing";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/support")) return "Support";
  return "Dashboard";
}

export function Topbar() {
  const profile = useQuery(api.users.getMyProfile);
  const router = useRouter();
  const pathname = usePathname();

  const initials = profile?.ownerName
    ? profile.ownerName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PT";

  function handleSignOut() {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    router.replace("/sign-in");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6 shrink-0">
      {/* Page title */}
      <h2 className="text-base font-semibold font-heading">
        {getPageTitle(pathname)}
      </h2>

      {/* Right side: company name + icon + avatar menu */}
      <div className="flex items-center gap-3">
        {profile?.businessName && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 size={14} />
            <span className="font-medium">{profile.businessName}</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {profile?.email && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal truncate">
                  {profile.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings size={14} className="mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut size={14} className="mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
