"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira, getStatusConfig } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  FileCheck,
  Users,
  Percent,
  BarChart2,
} from "lucide-react";

type Range = "7d" | "30d" | "12m";

const RANGES: { key: Range; label: string; granularity: "day" | "month"; days: number }[] = [
  { key: "7d", label: "Last 7 Days", granularity: "day", days: 7 },
  { key: "30d", label: "Last 30 Days", granularity: "day", days: 30 },
  { key: "12m", label: "Last 12 Months", granularity: "month", days: 365 },
];

const STATUS_COLORS: Record<string, string> = {
  Paid: "#16a34a",
  Sent: "#2563eb",
  Overdue: "#dc2626",
  Draft: "#9ca3af",
};

function GrowthBadge({
  value,
  suffix = "%",
  inverse = false,
}: {
  value: number | null;
  suffix?: string;
  inverse?: boolean;
}) {
  if (value === null)
    return <span className="text-xs text-muted-foreground">vs prev period</span>;
  const positive = inverse ? value < 0 : value > 0;
  const neutral = value === 0;
  return (
    <span
      className={
        neutral
          ? "text-xs text-muted-foreground flex items-center gap-0.5"
          : positive
            ? "text-xs text-green-600 flex items-center gap-0.5"
            : "text-xs text-red-600 flex items-center gap-0.5"
      }
    >
      {neutral ? (
        <Minus size={11} />
      ) : positive ? (
        <TrendingUp size={11} />
      ) : (
        <TrendingDown size={11} />
      )}
      {value > 0 ? "+" : ""}
      {value}
      {suffix} vs prev
    </span>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  iconColor,
  growth,
  growthSuffix,
  inverseGrowth,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  growth: number | null;
  growthSuffix?: string;
  inverseGrowth?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon size={16} className={iconColor} />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-2xl font-bold font-heading">{value}</div>
        <div className="mt-1">
          <GrowthBadge value={growth} suffix={growthSuffix} inverse={inverseGrowth} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState<Range>("30d");
  const [since, setSince] = useState(() => Date.now() - 30 * 24 * 60 * 60 * 1000);

  const granularity =
    RANGES.find((r) => r.key === activeRange)?.granularity ?? "day";

  const data = useQuery(api.analytics.getAnalytics, { since, granularity });

  function handleRangeChange(r: Range) {
    const days = RANGES.find((x) => x.key === r)!.days;
    setActiveRange(r);
    setSince(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  const statusData =
    data
      ? [
          { name: "Paid", value: data.statusBreakdown.paid },
          { name: "Sent", value: data.statusBreakdown.sent },
          { name: "Overdue", value: data.statusBreakdown.overdue },
          { name: "Draft", value: data.statusBreakdown.draft },
        ].filter((d) => d.value > 0)
      : [];

  const totalStatusCount = data
    ? data.statusBreakdown.draft +
      data.statusBreakdown.sent +
      data.statusBreakdown.paid +
      data.statusBreakdown.overdue
    : 0;

  return (
    <div className="space-y-6">
      {/* Header + Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance overview across your invoicing activity
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRangeChange(r.key)}
              className={
                activeRange === r.key
                  ? "rounded-md bg-background px-3 py-1.5 text-xs font-semibold shadow-sm"
                  : "rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {data === undefined ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data ? null : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard
            title="Revenue Collected"
            value={formatNaira(data.revenue)}
            icon={DollarSign}
            iconColor="text-green-600"
            growth={data.revenueGrowth}
            growthSuffix="%"
          />
          <KPICard
            title="Invoices Paid"
            value={String(data.invoicesPaidCount)}
            icon={FileCheck}
            iconColor="text-blue-600"
            growth={data.invoicesPaidDelta}
            growthSuffix=""
          />
          <KPICard
            title="New Clients"
            value={String(data.newClientsCount)}
            icon={Users}
            iconColor="text-violet-600"
            growth={data.newClientsDelta}
            growthSuffix=""
          />
          <KPICard
            title="Collection Rate"
            value={data.collectionRate !== null ? `${data.collectionRate}%` : "—"}
            icon={Percent}
            iconColor="text-indigo-600"
            growth={data.collectionRateDelta}
            growthSuffix=" pts"
          />
        </div>
      )}

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data === undefined ? (
            <Skeleton className="h-56 w-full" />
          ) : !data || data.revenueOverTime.every((d) => d.value === 0) ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <TrendingUp size={28} className="opacity-30" />
              <p className="text-sm">No revenue in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart
                data={data.revenueOverTime}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="analyticsRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    `₦${v >= 100000 ? `${(v / 100000).toFixed(0)}k` : (v / 100).toFixed(0)}`
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number" ? formatNaira(value) : value,
                    "Revenue",
                  ]}
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  fill="url(#analyticsRevenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Invoice Status + Top Clients */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data === undefined ? (
              <Skeleton className="h-52 w-full" />
            ) : !data || totalStatusCount === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                No invoices created in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground"
                      style={{ fontSize: 20, fontWeight: 700 }}
                    >
                      {totalStatusCount}
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    >
                      invoices
                    </text>
                  </Pie>
                  <Tooltip
                    formatter={(v) => [v, ""]}
                    contentStyle={{
                      fontSize: 12,
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                    }}
                  />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {data === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !data || data.topClients.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                No paid invoices in this period
              </div>
            ) : (
              <div className="space-y-2">
                {data.topClients.map((client, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client!.name}</p>
                      <p className="text-xs text-muted-foreground">{client!.invoiceCount} invoice{client!.invoiceCount !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-sm font-semibold shrink-0 tabular-nums">
                      {formatNaira(client!.totalPaid)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" />
            Invoice Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : !data || data.invoicesOverTime.every((d) => d.value === 0) ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <BarChart2 size={24} className="opacity-30" />
              <p className="text-sm">No invoices created in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart
                data={data.invoicesOverTime}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => [v, "Invoices Created"]}
                  contentStyle={{
                    fontSize: 12,
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[3, 3, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices in Period */}
      {(data?.recentInvoices?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices in Period</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {data!.recentInvoices.map((inv) => {
                const cfg = getStatusConfig(inv.status as "draft" | "sent" | "paid" | "overdue");
                return (
                  <div
                    key={inv._id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatNaira(inv.total)}
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {new Date(inv.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
