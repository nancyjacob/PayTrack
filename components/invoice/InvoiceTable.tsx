"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatNaira, formatDate, type InvoiceStatus } from "@/lib/utils";
import { Eye, Send, Trash2, FileText, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Invoice = {
  _id: Id<"invoices">;
  invoiceNumber: string;
  status: InvoiceStatus;
  total: number;
  dueDate: number;
  issueDate: number;
  sentAt?: number;
  client?: { name: string; email?: string } | null;
};

interface Props {
  invoices: Invoice[];
  loading?: boolean;
  header?: React.ReactNode;
}

export function InvoiceTable({ invoices, loading, header }: Props) {
  const sendInvoice   = useMutation(api.invoices.sendInvoice);
  const resendInvoice = useMutation(api.invoices.resendInvoice);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);

  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"invoices"> | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSend(inv: Invoice) {
    try {
      await sendInvoice({ invoiceId: inv._id });
      toast.success(
        inv.client?.email
          ? `Invoice emailed to ${inv.client.email}`
          : "Invoice sent to client"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    }
  }

  async function handleResend(inv: Invoice) {
    try {
      await resendInvoice({ invoiceId: inv._id });
      toast.success(
        inv.client?.email
          ? `Invoice re-sent to ${inv.client.email}`
          : "Invoice email resent"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    }
  }

  async function executeDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await deleteInvoice({ invoiceId: pendingDeleteId });
      toast.success("Invoice deleted");
      setPendingDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
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
        id: "client",
        accessorFn: (row) => row.client?.name ?? "",
        header: ({ column }) => (
          <SortableHeader column={column}>Client</SortableHeader>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-sm leading-tight">
              {row.original.client?.name ?? "—"}
            </p>
            {row.original.client?.email && (
              <p className="text-xs text-muted-foreground leading-tight">
                {row.original.client.email}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "issueDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Issue Date</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.issueDate)}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Due Date</SortableHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.dueDate)}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <SortableHeader column={column} className="ml-auto">
            Amount
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
        cell: ({ row }) => (
          <div>
            <InvoiceStatusBadge status={row.original.status} />
            {row.original.status === "sent" && row.original.sentAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                {formatDate(row.original.sentAt)}
              </p>
            )}
          </div>
        ),
        size: 110,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const inv = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" asChild title="View invoice">
                <Link href={`/invoices/${inv._id}`}>
                  <Eye size={15} />
                </Link>
              </Button>

              {inv.status === "draft" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs px-2"
                    onClick={() => handleSend(inv)}
                    title="Send invoice via email"
                  >
                    <Send size={13} />
                    Send
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setPendingDeleteId(inv._id)}
                    title="Delete draft"
                  >
                    <Trash2 size={15} />
                  </Button>
                </>
              )}

              {(inv.status === "sent" || inv.status === "overdue") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs px-2"
                  onClick={() => handleResend(inv)}
                  title="Resend email to client"
                >
                  <RefreshCw size={13} />
                  Resend
                </Button>
              )}
            </div>
          );
        },
        size: 140,
        enableSorting: false,
        enableGlobalFilter: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const emptyComponent = (
    <Card className="border-dashed border-0 shadow-none">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
          <FileText size={22} className="text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">No invoices yet</h3>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Create your first invoice to start tracking payments and get paid faster.
        </p>
        <Button asChild className="mt-6">
          <Link href="/invoices/new">
            <Plus size={15} />
            Create your first invoice
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {header && (
        <div className="flex items-center justify-between mb-3">{header}</div>
      )}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Search invoices…"
        emptyComponent={emptyComponent}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(v) => !v && setPendingDeleteId(null)}
        title="Delete invoice?"
        description="This draft invoice will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDelete}
        loading={deleting}
      />
    </div>
  );
}
