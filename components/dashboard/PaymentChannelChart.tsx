"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CreditCard } from "lucide-react";
import { formatNaira } from "@/lib/utils";

type ChannelEntry = {
  channel: string;
  count: number;
  amount: number;
};

function formatChannel(raw: string) {
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PaymentChannelChart({ channels }: { channels: ChannelEntry[] }) {
  const data = channels
    .map((c) => ({ ...c, label: formatChannel(c.channel) }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <CreditCard size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(120, data.length * 52)}>
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  `₦${v >= 100000 ? `${(v / 100000).toFixed(0)}k` : (v / 100).toFixed(0)}`
                }
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <Tooltip
                formatter={(value) => [
                  typeof value === "number" ? formatNaira(value) : value,
                  "Amount",
                ]}
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                }}
              />
              <Bar
                dataKey="amount"
                fill="var(--color-primary)"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
