"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type StatusBreakdown = {
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
};

const STATUS_COLORS: Record<string, string> = {
  Paid: "#16a34a",
  Sent: "#2563eb",
  Overdue: "#dc2626",
  Draft: "#9ca3af",
};

export function InvoiceStatusChart({ breakdown }: { breakdown: StatusBreakdown }) {
  const data = [
    { name: "Paid", value: breakdown.paid },
    { name: "Sent", value: breakdown.sent },
    { name: "Overdue", value: breakdown.overdue },
    { name: "Draft", value: breakdown.draft },
  ].filter((d) => d.value > 0);

  const total = breakdown.draft + breakdown.sent + breakdown.paid + breakdown.overdue;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            No invoices yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                ))}
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground"
                  style={{ fontSize: 22, fontWeight: 700 }}
                >
                  {total}
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                >
                  total
                </text>
              </Pie>
              <Tooltip
                formatter={(value) => [value, ""]}
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                }}
              />
              <Legend
                iconSize={10}
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
