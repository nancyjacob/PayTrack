"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { usePermissions, type Resource } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/admin/PermissionGate";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  MessageSquare,
  LogOut,
  ShieldCheck,
  ChevronRight,
  BarChart2,
  KeyRound,
  Settings2,
  Lock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2, Crown, Headphones } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// ── Nav definition ─────────────────────────────────────────────────────────

type NavChild = {
  href: string;
  label: string;
  icon: React.ElementType;
  resource: Resource;
};

type NavItem = {
  href?: string;
  label: string;
  icon: React.ElementType;
  resource: Resource;
  exact?: boolean;
  superAdminOnly?: boolean;
  children?: NavChild[];
};

const BASE_NAV: NavItem[] = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard, resource: "overview",  exact: true  },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2,       resource: "analytics", exact: false },
  { href: "/admin/users",     label: "Users",     icon: Users,           resource: "users",     exact: false },
  { href: "/admin/admins",    label: "Admins",    icon: UserCog,         resource: "users",     exact: false, superAdminOnly: true },
  { href: "/admin/invoices",  label: "Invoices",  icon: FileText,        resource: "invoices",  exact: false },
  { href: "/admin/support",   label: "Support",   icon: MessageSquare,   resource: "support",   exact: false },
  {
    label: "Admin", icon: Lock, resource: "roles",
    children: [
      { href: "/admin/roles",       label: "Roles",       icon: KeyRound, resource: "roles" },
      { href: "/admin/permissions", label: "Permissions", icon: Shield,   resource: "roles" },
    ],
  },
  { href: "/admin/settings",  label: "Settings",  icon: Settings2,       resource: "settings",  exact: false },
];

/** Build visible nav items filtered by role and permissions. */
function buildNavItems(
  isSuperAdmin: boolean,
  can: (resource: Resource, action: "view") => boolean
): NavItem[] {
  return BASE_NAV.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (item.href === "/admin/users") return true;
    return isSuperAdmin || can(item.resource, "view");
  });
}

// ── Route & title helpers ──────────────────────────────────────────────────

function getRouteResource(pathname: string): Resource | null {
  if (pathname === "/admin") return "overview";
  if (pathname.startsWith("/admin/analytics")) return "analytics";
  // /admin/users, /admin/admins — pages handle their own access
  if (pathname.startsWith("/admin/invoices")) return "invoices";
  if (pathname.startsWith("/admin/support")) return "support";
  if (pathname.startsWith("/admin/roles")) return "roles";
  if (pathname.startsWith("/admin/permissions")) return "roles";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return null;
}

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Overview";
  if (pathname.startsWith("/admin/analytics")) return "Analytics";
  if (pathname.startsWith("/admin/admins")) return "Admins";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/invoices")) return "Invoices";
  if (pathname.startsWith("/admin/support")) return "Support";
  if (pathname.startsWith("/admin/permissions")) return "Permissions";
  if (pathname.startsWith("/admin/roles")) return "Roles";
  if (pathname.startsWith("/admin/settings")) return "System Configuration";
  return "Admin";
}

// ── Expandable nav group ───────────────────────────────────────────────────

function NavGroupItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const childActive = item.children?.some((c) => pathname.startsWith(c.href)) ?? false;
  const [open, setOpen] = useState(childActive);

  // Auto-open when navigating into a child route
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const GroupIcon = item.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
          childActive
            ? "text-sidebar-foreground bg-sidebar-accent"
            : "text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <div className="flex items-center gap-3">
          <GroupIcon size={16} className="shrink-0" />
          {item.label}
        </div>
        <ChevronRight
          size={13}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-border/60 space-y-0.5">
          {item.children?.map((child) => {
            const active = pathname.startsWith(child.href);
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <ChildIcon size={14} className="shrink-0" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function AdminSidebar({ navItems }: { navItems: NavItem[] }) {
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
        <span className="font-heading font-semibold text-sidebar-foreground">
          Admin Panel
        </span>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.children) {
            return <NavGroupItem key={item.label} item={item} />;
          }
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href ?? "");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {item.label}
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

// ── Topbar ─────────────────────────────────────────────────────────────────

function AdminTopbar({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const profile = useQuery(api.users.getMyProfile);
  const { role } = usePermissions();
  const pathname = usePathname();

  const initials = profile?.ownerName
    ? profile.ownerName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  function RoleBadge() {
    if (isSuperAdmin)
      return <Badge variant="default" className="gap-1 text-[10px] h-5 px-1.5"><Crown size={9} /> Super Admin</Badge>;
    if (role === "admin")
      return <Badge variant="secondary" className="gap-1 text-[10px] h-5 px-1.5"><Shield size={9} /> Admin</Badge>;
    if (role === "support")
      return <Badge variant="outline" className="gap-1 text-[10px] h-5 px-1.5"><Headphones size={9} /> Support</Badge>;
    return null;
  }

  return (
    <header className="h-12 shrink-0 flex items-center justify-between gap-3 px-6 border-b border-border bg-background">
      <h2 className="text-sm font-semibold font-heading">
        {getPageTitle(pathname)}
      </h2>
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

// ── Layout ─────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const isAdmin = useQuery(api.admin.isAdmin);
  const { can, isLoading: permsLoading, isSuperAdmin } = usePermissions();
  const initPerms = useMutation(api.permissions.initDefaultPermissions);
  const router = useRouter();
  const pathname = usePathname();

  const [adminSession, setAdminSession] = useState<boolean | null>(null);

  const isPublicAdminPage =
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/accept-invite");

  useEffect(() => {
    setAdminSession(localStorage.getItem("adminSession") === "1");
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) initPerms();
  }, [isAuthenticated, isAdmin, initPerms]);

  useEffect(() => {
    if (isPublicAdminPage) return;
    if (authLoading || adminSession === null) return;
    if (!isAuthenticated || !isAdmin || !adminSession) {
      router.replace("/admin/login");
    }
  }, [isAuthenticated, isAdmin, authLoading, adminSession, router, isPublicAdminPage]);

  if (isPublicAdminPage) return <>{children}</>;

  if (authLoading || isAdmin === undefined || adminSession === null) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin || !adminSession) return null;

  const navItems = buildNavItems(isSuperAdmin, (r) => can(r, "view"));

  // Route-level guard — /admin/users is excluded (page handles its own access)
  const routeResource = getRouteResource(pathname);
  const routeAllowed =
    permsLoading ||
    !routeResource ||
    isSuperAdmin ||
    can(routeResource, "view");

  return (
    <div className="flex h-svh overflow-hidden">
      <AdminSidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar isSuperAdmin={isSuperAdmin} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4">
          {!routeAllowed ? <AccessDenied /> : children}
        </main>
      </div>
    </div>
  );
}
