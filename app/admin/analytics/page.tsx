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
import { formatNaira } from "@/lib/utils";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  FileText,
  MessageSquare,
  TrendingUp,
  Users,
  CreditCard,
} from "lucide-react";

// ── Shared colours ────────────────────────────────────────
const PRIMARY = "oklch(0.491 0.27 292.581)";
const PRIMARY_LIGHT = "oklch(0.606 0.25 292.717)";

// ── KPI card ─────────────────────────────────────────────
function KpiCard({
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
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold mt-1 font-heading">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-md bg-primary/10 p-2">
            <Icon size={16} className="text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Horizontal status bar ─────────────────────────────────
function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium w-10 text-right tabular-nums">{count}</span>
      <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-primary font-bold">{formatNaira(payload[0].value)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label, dataKey }: { active?: boolean; payload?: { value: number }[]; label?: string; dataKey: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-primary font-bold">{payload[0].value} {dataKey}</p>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56 mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
        <Skeleton className="h-52" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const data = useQuery(api.admin.getAnalyticsData);

  if (!data) return <AnalyticsSkeleton />;

  const invoiceTotal =
    data.invoicesByStatus.draft +
    data.invoicesByStatus.sent +
    data.invoicesByStatus.paid +
    data.invoicesByStatus.overdue;

  const ticketTotal =
    data.ticketsByStatus.open +
    data.ticketsByStatus.in_progress +
    data.ticketsByStatus.resolved;

  const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Platform performance and activity metrics
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={formatNaira(data.totalRevenue)}
          sub={`${data.totalPayments} payments`}
          icon={DollarSign}
        />
        <KpiCard
          title="Avg Invoice Value"
          value={formatNaira(data.avgInvoiceValue)}
          sub={`${data.totalInvoices} invoices`}
          icon={FileText}
        />
        <KpiCard
          title="Collection Rate"
          value={`${data.collectionRate}%`}
          sub={`${data.invoicesByStatus.paid} of ${invoiceTotal} paid`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Ticket Resolution"
          value={`${data.ticketResolutionRate}%`}
          sub={`${data.ticketsByStatus.resolved} of ${ticketTotal} resolved`}
          icon={MessageSquare}
        />
      </div>

      {/* Revenue + Signups charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Revenue</CardTitle>
            <CardDescription>Last 6 months · collected payments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyRevenue} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${(v / 100000).toFixed(0)}k`}
                />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: "oklch(0.97 0 0)" }} />
                <Bar dataKey="revenue" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">User Signups</CardTitle>
            <CardDescription>Last 6 months · new accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.monthlySignups} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CountTooltip dataKey="users" />} cursor={{ stroke: PRIMARY, strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  fill="url(#userGrad)"
                  dot={{ r: 3, fill: PRIMARY, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoices created chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Invoices Created</CardTitle>
          <CardDescription>Last 6 months · total invoices issued per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.monthlyInvoices} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CountTooltip dataKey="invoices" />} cursor={{ fill: "oklch(0.97 0 0)" }} />
              <Bar dataKey="invoices" fill={PRIMARY_LIGHT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status breakdowns */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Invoice status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Invoice Status</CardTitle>
            <CardDescription>{invoiceTotal} total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBar label="Paid" count={data.invoicesByStatus.paid} total={invoiceTotal} color="bg-green-500" />
            <StatusBar label="Sent" count={data.invoicesByStatus.sent} total={invoiceTotal} color="bg-blue-500" />
            <StatusBar label="Overdue" count={data.invoicesByStatus.overdue} total={invoiceTotal} color="bg-red-500" />
            <StatusBar label="Draft" count={data.invoicesByStatus.draft} total={invoiceTotal} color="bg-muted-foreground/40" />
          </CardContent>
        </Card>

        {/* Ticket status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Support Tickets</CardTitle>
            <CardDescription>{ticketTotal} total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBar label="Resolved" count={data.ticketsByStatus.resolved} total={ticketTotal} color="bg-green-500" />
            <StatusBar label="In Progress" count={data.ticketsByStatus.in_progress} total={ticketTotal} color="bg-amber-500" />
            <StatusBar label="Open" count={data.ticketsByStatus.open} total={ticketTotal} color="bg-red-400" />
          </CardContent>
        </Card>

        {/* Users + plan split */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">User Plans</CardTitle>
            <CardDescription>{data.totalUsers} total users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBar
              label="Pro"
              count={data.proUsers}
              total={data.totalUsers}
              color="bg-primary"
            />
            <StatusBar
              label="Free"
              count={data.totalUsers - data.proUsers}
              total={data.totalUsers}
              color="bg-muted-foreground/40"
            />
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users size={12} />
                <span>
                  {data.proUsers > 0
                    ? `${Math.round((data.proUsers / data.totalUsers) * 100)}% conversion to Pro`
                    : "No Pro users yet"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment channels */}
      {data.paymentChannels.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Channels</CardTitle>
            <CardDescription>Revenue and transaction count by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.paymentChannels.map((ch) => (
                <div key={ch.channel} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <CreditCard size={13} className="text-muted-foreground" />
                    <span className="text-sm capitalize">{ch.channel}</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(ch.amount / Math.max(...data.paymentChannels.map(c => c.amount))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium tabular-nums w-28 text-right">
                    {formatNaira(ch.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right tabular-nums">
                    {ch.count} txns
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
