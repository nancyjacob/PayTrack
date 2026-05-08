"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

export function RevenueChart() {
  const stats = useQuery(api.invoices.getDashboardStats);
  const data = stats?.monthlyData ?? [];

  if (stats === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue — Last 6 Months</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <TrendingUp size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No revenue data yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Revenue will appear here once invoices are paid.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
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
                  typeof value === "number"
                    ? new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                      }).format(value / 100)
                    : value,
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
                dataKey="revenue"
                stroke="var(--color-primary)"
                fill="url(#revenueGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
