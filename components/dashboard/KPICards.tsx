"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/lib/utils";
import { TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";

export function KPICards() {
  const stats = useQuery(api.invoices.getDashboardStats);

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
      title: "Overdue Invoices",
      value: String(stats.overdueCount),
      icon: AlertCircle,
      iconColor: "text-red-600",
    },
    {
      title: "Paid Invoices",
      value: String(stats.paidCount),
      icon: CheckCircle,
      iconColor: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, iconColor }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon size={16} className={iconColor} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
