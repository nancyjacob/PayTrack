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

  const momGrowth = stats.momGrowth ?? null;
  const momValue =
    momGrowth === null
      ? "0%"
      : `${momGrowth > 0 ? "+" : ""}${momGrowth}%`;
  const momColor =
    momGrowth === null
      ? "text-muted-foreground"
      : momGrowth >= 0
        ? "text-green-600"
        : "text-red-600";
  const MomIcon = momGrowth !== null && momGrowth < 0 ? TrendingDown : TrendingUp;

  const safeNaira = (v: number | undefined | null) =>
    formatNaira(v ?? 0);

  const cards = [
    {
      title: "Total Revenue",
      value: safeNaira(stats.totalRevenue),
      icon: TrendingUp,
      iconColor: "text-green-600",
    },
    {
      title: "Outstanding",
      value: safeNaira(stats.outstanding),
      icon: Clock,
      iconColor: "text-blue-600",
    },
    {
      title: "Collection Rate",
      value: `${stats.collectionRate ?? 0}%`,
      icon: Percent,
      iconColor: "text-indigo-600",
    },
    {
      title: "Avg Invoice Value",
      value: safeNaira(stats.avgInvoiceValue),
      icon: Receipt,
      iconColor: "text-violet-600",
    },
    {
      title: "Overdue Amount",
      value: safeNaira(stats.overdueAmount),
      icon: AlertCircle,
      iconColor: "text-red-600",
    },
    {
      title: "Tax Collected",
      value: safeNaira(stats.taxCollected),
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
      value: stats.avgDaysToPay ? `${stats.avgDaysToPay}d` : "0",
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
