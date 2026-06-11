"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CheckCircle2, Clock, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

type Payment = {
  _id: Id<"payments">;
  invoiceId: Id<"invoices">;
  amount: number;
  subtotal: number;
  tax: number;
  paystackReference: string;
  paystackStatus: string;
  channel?: string;
  paidAt: number;
  invoiceNumber: string;
  currency: string;
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "success" || s === "paid")
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Success
      </Badge>
    );
  if (s === "pending")
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        Pending
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground">{status}</Badge>
  );
}

export default function PaymentsPage() {
  const payments = useQuery(api.payments.listMyPayments) as Payment[] | undefined;

  const stats = useMemo(() => {
    if (!payments) return null;
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const successful = payments.filter(
      (p) => p.paystackStatus.toLowerCase() === "success" || p.paystackStatus.toLowerCase() === "paid"
    );
    const thisMonth = successful.filter((p) => {
      const d = new Date(p.paidAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      totalCount: payments.length,
      successCount: successful.length,
      totalReceived: successful.reduce((s, p) => s + p.amount, 0),
      thisMonthTotal: thisMonth.reduce((s, p) => s + p.amount, 0),
    };
  }, [payments]);

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
          <SortableHeader column={column}>Invoice</SortableHeader>
        ),
        cell: ({ row }) => (
          <Link
            href={`/invoices/${row.original.invoiceId}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.invoiceNumber}
          </Link>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <SortableHeader column={column}>Amount</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "tax",
        header: ({ column }) => (
          <SortableHeader column={column}>Tax</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatCurrency(row.original.tax ?? 0, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: "paystackStatus",
        header: () => (
          <span className="text-xs font-medium text-muted-foreground">Status</span>
        ),
        cell: ({ row }) => <StatusBadge status={row.original.paystackStatus} />,
        enableSorting: false,
      },
      {
        accessorKey: "channel",
        header: () => (
          <span className="text-xs font-medium text-muted-foreground">Channel</span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm capitalize">
            {row.original.channel ?? "—"}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "paystackReference",
        header: () => (
          <span className="text-xs font-medium text-muted-foreground">Reference</span>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs font-mono">
            {row.original.paystackReference}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "paidAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Date</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.paidAt)}
          </span>
        ),
        size: 120,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-semibold">Payments</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Received",
            icon: TrendingUp,
            value: stats ? formatCurrency(stats.totalReceived, "NGN") : null,
            sub: "all time",
          },
          {
            label: "This Month",
            icon: Wallet,
            value: stats ? formatCurrency(stats.thisMonthTotal, "NGN") : null,
            sub: "current month",
          },
          {
            label: "Successful",
            icon: CheckCircle2,
            value: stats ? String(stats.successCount) : null,
            sub: "transactions",
          },
          {
            label: "Total Transactions",
            icon: Clock,
            value: stats ? String(stats.totalCount) : null,
            sub: "all time",
          },
        ].map(({ label, icon: Icon, value, sub }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon size={16} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {value === null ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <>
                  <p className="text-xl font-bold font-heading">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={payments ?? []}
        loading={payments === undefined}
        searchPlaceholder="Search by invoice or reference…"
        emptyMessage="No payments yet. Payments will appear here once clients pay their invoices."
      />
    </div>
  );
}
