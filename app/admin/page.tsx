"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePermissions, type Resource } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/admin/PermissionGate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, DollarSign, MessageSquare, Crown, Shield, Headphones, CheckCircle2, XCircle } from "lucide-react";
import { formatNaira } from "@/lib/utils";

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon: Icon,
}: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-md bg-primary/10 p-2.5">
            <Icon size={18} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── My Access panel (shown for non-super-admins) ──────────────────────────

const RESOURCE_META: { id: Resource; label: string }[] = [
  { id: "overview",  label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "users",     label: "Admin Users" },
  { id: "invoices",  label: "Invoices" },
  { id: "support",   label: "Support Tickets" },
  { id: "roles",     label: "Roles & Permissions" },
  { id: "settings",  label: "System Configuration" },
];

const ACTIONS = ["view", "create", "edit", "delete"] as const;

function MyAccessPanel() {
  const { can, isSuperAdmin, role } = usePermissions();

  if (isSuperAdmin) return null; // super admin sees the full stats, no need for access panel

  const roleLabel =
    role === "admin" ? "Admin"
    : role === "support" ? "Support"
    : role ?? "Unknown";

  const RoleIcon =
    role === "super_admin" ? Crown
    : role === "admin" ? Shield
    : Headphones;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RoleIcon size={16} className="text-primary" />
          My Access Level
          <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
        </CardTitle>
        <CardDescription>
          Modules and actions you have permission to access in this admin panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground text-xs">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="text-center py-2 px-2 font-medium text-muted-foreground text-xs capitalize w-16">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCE_META.map(({ id, label }) => (
                <tr key={id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-sm">{label}</td>
                  {ACTIONS.map((action) => {
                    const allowed = can(id, action);
                    return (
                      <td key={action} className="text-center py-2 px-2">
                        {allowed
                          ? <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                          : <XCircle size={14} className="text-muted-foreground/30 mx-auto" />
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Contact a Super Admin to request additional access.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Progress bar helper ───────────────────────────────────────────────────

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { can, isLoading, isSuperAdmin } = usePermissions();
  const stats = useQuery(api.admin.getPlatformStats);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time platform metrics</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!can("overview", "view")) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isSuperAdmin ? "Real-time metrics across all users" : "Welcome to the admin panel"}
        </p>
      </div>

      {/* My Access panel shown to non-super-admins */}
      <MyAccessPanel />

      {/* Stats — only when data is loaded */}
      {stats && isSuperAdmin && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard title="Total Users"    value={stats.totalUsers}         sub={`${stats.proUsers} on Pro`}    icon={Users}        />
            <StatCard title="Total Invoices" value={stats.totalInvoices}      sub={`${stats.paidInvoices} paid`} icon={FileText}     />
            <StatCard title="Total Revenue"  value={formatNaira(stats.totalRevenue)} sub="All-time collected"   icon={DollarSign}   />
            <StatCard title="Open Tickets"   value={stats.openTickets}        sub="Awaiting response"            icon={MessageSquare}/>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Breakdown</CardTitle>
                <CardDescription>User distribution by plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Free</span>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={stats.totalUsers - stats.proUsers} total={stats.totalUsers} color="bg-muted-foreground/50" />
                    <span className="text-sm font-medium w-8 text-right">{stats.totalUsers - stats.proUsers}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pro</span>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={stats.proUsers} total={stats.totalUsers} color="bg-primary" />
                    <span className="text-sm font-medium w-8 text-right">{stats.proUsers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Breakdown</CardTitle>
                <CardDescription>Status distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Paid</span>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={stats.paidInvoices} total={stats.totalInvoices} color="bg-green-500" />
                    <span className="text-sm font-medium w-8 text-right">{stats.paidInvoices}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Other</span>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={stats.totalInvoices - stats.paidInvoices} total={stats.totalInvoices} color="bg-muted-foreground/50" />
                    <span className="text-sm font-medium w-8 text-right">{stats.totalInvoices - stats.paidInvoices}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Stats for admins with view permission but not super-admin */}
      {stats && !isSuperAdmin && can("overview", "view") && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Total Users"    value={stats.totalUsers}    sub={`${stats.proUsers} on Pro`}    icon={Users}        />
          <StatCard title="Total Invoices" value={stats.totalInvoices} sub={`${stats.paidInvoices} paid`} icon={FileText}     />
          <StatCard title="Total Revenue"  value={formatNaira(stats.totalRevenue)} sub="All-time collected" icon={DollarSign} />
          <StatCard title="Open Tickets"   value={stats.openTickets}   sub="Awaiting response"             icon={MessageSquare}/>
        </div>
      )}
    </div>
  );
}
