"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { AccessDenied } from "@/components/admin/PermissionGate";

type AdminInvoice = {
  _id: Id<"invoices">;
  invoiceNumber: string;
  businessName: string;
  clientName: string;
  total: number;
  status: string;
  createdAt: number;
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  paid: "default",
  sent: "secondary",
  draft: "outline",
  overdue: "destructive",
};

const columns: ColumnDef<AdminInvoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <SortableHeader column={column}>Invoice #</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.invoiceNumber}</span>
    ),
    size: 130,
  },
  {
    accessorKey: "businessName",
    header: ({ column }) => (
      <SortableHeader column={column}>Business</SortableHeader>
    ),
    cell: ({ row }) => <span className="text-sm">{row.original.businessName}</span>,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => (
      <SortableHeader column={column}>Client</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.clientName}</span>
    ),
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <SortableHeader column={column} className="ml-auto">
        Total
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-right block">
        {formatNaira(row.original.total)}
      </span>
    ),
    size: 120,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <Badge variant={STATUS_VARIANT[s] ?? "outline"}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </Badge>
      );
    },
    size: 100,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column}>Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })}
      </span>
    ),
    size: 110,
  },
];

export default function AdminInvoicesPage() {
  const { can, isLoading } = usePermissions();
  const invoices = useQuery(api.admin.listAllInvoices) as
    | AdminInvoice[]
    | undefined;

  if (isLoading) return null;
  if (!can("invoices", "view")) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All invoices across the platform
        </p>
      </div>

      <DataTable
        columns={columns}
        data={invoices ?? []}
        loading={invoices === undefined}
        searchPlaceholder="Search by invoice #, business, or client…"
        emptyMessage="No invoices found."
        defaultPageSize={20}
      />
    </div>
  );
}
