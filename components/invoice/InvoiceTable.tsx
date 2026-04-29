"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatNaira, formatDate, type InvoiceStatus } from "@/lib/utils";
import { Eye, Send, Trash2 } from "lucide-react";
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
  client?: { name: string } | null;
};

interface Props {
  invoices: Invoice[];
  loading?: boolean;
}

export function InvoiceTable({ invoices, loading }: Props) {
  const sendInvoice = useMutation(api.invoices.sendInvoice);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);

  async function handleSend(invoiceId: Id<"invoices">) {
    try {
      await sendInvoice({ invoiceId });
      toast.success("Invoice sent to client");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    }
  }

  async function handleDelete(invoiceId: Id<"invoices">) {
    if (!confirm("Delete this draft invoice?")) return;
    try {
      await deleteInvoice({ invoiceId });
      toast.success("Invoice deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">No invoices yet</p>
        <Button asChild className="mt-4">
          <Link href="/invoices/new">Create your first invoice</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv._id}>
              <TableCell className="font-mono text-sm">
                {inv.invoiceNumber}
              </TableCell>
              <TableCell className="font-medium">
                {inv.client?.name ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(inv.issueDate)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(inv.dueDate)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatNaira(inv.total)}
              </TableCell>
              <TableCell>
                <InvoiceStatusBadge status={inv.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/invoices/${inv._id}`}>
                      <Eye size={15} />
                    </Link>
                  </Button>
                  {inv.status === "draft" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSend(inv._id)}
                        title="Send to client"
                      >
                        <Send size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(inv._id)}
                        title="Delete draft"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
