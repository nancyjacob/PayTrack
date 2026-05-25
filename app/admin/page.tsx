"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, DollarSign, MessageSquare } from "lucide-react";
import { formatNaira } from "@/lib/utils";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
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

export default function AdminOverviewPage() {
  const stats = useQuery(api.admin.getPlatformStats);

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time platform metrics</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time metrics across all users</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          sub={`${stats.proUsers} on Pro`}
          icon={Users}
        />
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          sub={`${stats.paidInvoices} paid`}
          icon={FileText}
        />
        <StatCard
          title="Total Revenue"
          value={formatNaira(stats.totalRevenue)}
          sub="All-time collected"
          icon={DollarSign}
        />
        <StatCard
          title="Open Tickets"
          value={stats.openTickets}
          sub="Awaiting response"
          icon={MessageSquare}
        />
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
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/50 rounded-full"
                    style={{ width: `${stats.totalUsers ? ((stats.totalUsers - stats.proUsers) / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.totalUsers - stats.proUsers}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pro</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${stats.totalUsers ? (stats.proUsers / stats.totalUsers) * 100 : 0}%` }}
                  />
                </div>
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
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${stats.totalInvoices ? (stats.paidInvoices / stats.totalInvoices) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.paidInvoices}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Other</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/50 rounded-full"
                    style={{ width: `${stats.totalInvoices ? ((stats.totalInvoices - stats.paidInvoices) / stats.totalInvoices) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{stats.totalInvoices - stats.paidInvoices}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
