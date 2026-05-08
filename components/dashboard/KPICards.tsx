"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils";
import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Percent,
  Receipt,
  TrendingDown,
  Timer,
} from "lucide-react";

export function KPICards() {
  const stats = useQuery(api.invoices.getDashboardStats);

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const momValue =
    stats.momGrowth === null
      ? "—"
      : `${stats.momGrowth > 0 ? "+" : ""}${stats.momGrowth}%`;
  const momColor =
    stats.momGrowth === null
      ? "text-muted-foreground"
      : stats.momGrowth >= 0
        ? "text-green-600"
        : "text-red-600";
  const MomIcon = stats.momGrowth !== null && stats.momGrowth < 0 ? TrendingDown : TrendingUp;

  const cards = [
    {
      title: "Total Revenue",
      value: formatNaira(stats.totalRevenue),
      icon: TrendingUp,
      iconColor: "text-green-600",
    },
    {
      title: "Outstanding",
      value: formatNaira(stats.outstanding),
      icon: Clock,
      iconColor: "text-blue-600",
    },
    {
      title: "Collection Rate",
      value: `${stats.collectionRate}%`,
      icon: Percent,
      iconColor: "text-indigo-600",
    },
    {
      title: "Avg Invoice Value",
      value: formatNaira(stats.avgInvoiceValue),
      icon: Receipt,
      iconColor: "text-violet-600",
    },
    {
      title: "Overdue Amount",
      value: formatNaira(stats.overdueAmount),
      icon: AlertCircle,
      iconColor: "text-red-600",
    },
    {
      title: "Tax Collected",
      value: formatNaira(stats.taxCollected),
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
    {
      title: "MoM Growth",
      value: momValue,
      icon: MomIcon,
      iconColor: momColor,
      valueColor: momColor,
    },
    {
      title: "Avg Days to Pay",
      value: stats.avgDaysToPay === 0 ? "—" : `${stats.avgDaysToPay}d`,
      icon: Timer,
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, iconColor, valueColor }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon size={16} className={iconColor} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-heading ${valueColor ?? ""}`}>
              {value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
