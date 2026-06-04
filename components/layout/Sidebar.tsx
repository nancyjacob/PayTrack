"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  LogOut,
  BarChart2,
  CreditCard,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CUSTOMER_SESSION_KEY } from "@/components/AuthGuard";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  function handleSignOut() {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    router.replace("/sign-in");
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark size={30} className="shrink-0" />
            <span className="font-heading text-sm font-semibold text-sidebar-foreground tracking-tight">
              PayTrack
            </span>
          </div>
        )}
        {collapsed && (
          <LogoMark size={26} className="mx-auto" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-0.5">
        <Link
          href="/support"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/support"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          title={collapsed ? "Support" : undefined}
        >
          <HelpCircle size={18} className="shrink-0" />
          {!collapsed && <span>Support</span>}
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {!collapsed && (
          <p className="px-3 pt-1 text-xs text-sidebar-foreground/40">PayTrack v1.0</p>
        )}
      </div>
    </aside>
  );
}
