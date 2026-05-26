"use client";

import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  LogOut,
  ShieldCheck,
  ChevronRight,
  UserCog,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2, Crown, Shield, Headphones } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2, exact: false },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/invoices", label: "Invoices", icon: FileText, exact: false },
  { href: "/admin/support", label: "Support", icon: MessageSquare, exact: false },
  { href: "/admin/admins", label: "Admins", icon: UserCog, exact: false },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  async function handleSignOut() {
    localStorage.removeItem("adminSession");
    await signOut();
    router.replace("/admin/login");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-sidebar h-svh">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
        <ShieldCheck size={18} className="text-primary" />
        <span className="font-heading font-semibold text-sidebar-foreground">Admin Panel</span>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {adminNav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2 space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <ChevronRight size={16} className="rotate-180 shrink-0" />
          Back to App
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut size={16} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar() {
  const profile = useQuery(api.users.getMyProfile);
  const adminRole = useQuery(api.admin.getMyAdminRole);

  const initials = profile?.ownerName
    ? profile.ownerName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  function RoleBadge() {
    const isSuperAdmin = adminRole?.isSuperAdmin;
    const role = adminRole?.adminRole;
    if (isSuperAdmin)
      return (
        <Badge variant="default" className="gap-1 text-[10px] h-5 px-1.5">
          <Crown size={9} />
          Super Admin
        </Badge>
      );
    if (role === "admin")
      return (
        <Badge variant="secondary" className="gap-1 text-[10px] h-5 px-1.5">
          <Shield size={9} />
          Admin
        </Badge>
      );
    if (role === "support")
      return (
        <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5">
          <Headphones size={9} />
          Support
        </Badge>
      );
    return null;
  }

  return (
    <header className="h-12 shrink-0 flex items-center justify-end gap-3 px-6 border-b border-border bg-background">
      {profile && (
        <div className="flex items-center gap-2.5">
          <RoleBadge />
          <span className="text-sm font-medium">{profile.ownerName}</span>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const isAdmin = useQuery(api.admin.isAdmin);
  const router = useRouter();
  const pathname = usePathname();

  // null = not yet read from localStorage (SSR safe)
  const [adminSession, setAdminSession] = useState<boolean | null>(null);

  const isPublicAdminPage =
    pathname === "/admin/login" || pathname.startsWith("/admin/accept-invite");

  // Read the admin session flag on the client
  useEffect(() => {
    setAdminSession(localStorage.getItem("adminSession") === "1");
  }, []);

  useEffect(() => {
    if (isPublicAdminPage) return;
    if (authLoading || adminSession === null) return;

    if (!isAuthenticated || !isAdmin || !adminSession) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, adminSession, router, isPublicAdminPage]);

  // Public pages render without the admin shell
  if (isPublicAdminPage) return <>{children}</>;

  // Wait for all async checks before rendering
  if (authLoading || isAdmin === undefined || adminSession === null) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Blank while redirect fires
  if (!isAuthenticated || !isAdmin || !adminSession) return null;

  return (
    <div className="flex h-svh overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4">{children}</main>
      </div>
    </div>
  );
}
