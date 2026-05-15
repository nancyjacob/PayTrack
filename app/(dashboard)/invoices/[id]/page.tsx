"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { formatNaira, formatDate, type InvoiceStatus } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Trash2,
  ExternalLink,
  Pencil,
  Copy,
  RefreshCw,
  Download,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const InvoicePDFDownload = dynamic(
  () =>
    import("@/components/invoice/InvoicePDF").then((m) => m.InvoicePDFDownload),
  { ssr: false, loading: () => <Skeleton className="h-9 w-36" /> }
);

class PDFErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return (
        <Button variant="outline" size="sm" disabled>
          <Download size={14} className="mr-1.5" />
          PDF unavailable
        </Button>
      );
    return this.props.children;
  }
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const invoice = useQuery(api.invoices.getInvoiceById, {
    invoiceId: id as Id<"invoices">,
  });
  const profile = useQuery(api.users.getMyProfile);
  const logoUrl = useQuery(api.users.getLogoUrl);
  const sendInvoice = useMutation(api.invoices.sendInvoice);
  const resendInvoice = useMutation(api.invoices.resendInvoice);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);
  const duplicateInvoice = useMutation(api.invoices.duplicateInvoice);

  if (invoice === undefined) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (invoice === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button asChild className="mt-4">
          <Link href="/invoices">Back to invoices</Link>
        </Button>
      </div>
    );
  }

  async function handleSend() {
    if (!invoice) return;
    try {
      await sendInvoice({ invoiceId: invoice._id });
      toast.success("Invoice sent to client");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    }
  }

  async function handleResend() {
    if (!invoice) return;
    try {
      await resendInvoice({ invoiceId: invoice._id });
      toast.success("Invoice email resent to client");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    }
  }

  async function handleDelete() {
    if (!invoice) return;
    if (!confirm("Delete this draft invoice?")) return;
    try {
      await deleteInvoice({ invoiceId: invoice._id });
      toast.success("Invoice deleted");
      router.push("/invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleDuplicate() {
    if (!invoice) return;
    try {
      const newId = await duplicateInvoice({ invoiceId: invoice._id });
      toast.success("Invoice duplicated as draft");
      router.push(`/invoices/${newId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  }

  const payLink = `/pay/${invoice._id}`;
  const canEdit = invoice.status !== "paid";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-semibold whitespace-nowrap">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <PDFErrorBoundary>
                <InvoicePDFDownload
                  invoice={{
                    ...invoice,
                    brandColor: profile?.brandColor ?? undefined,
                    brandFont: profile?.brandFont ?? undefined,
                    invoiceFooter: profile?.invoiceFooter ?? undefined,
                    logoUrl: logoUrl ?? undefined,
                  }}
                />
              </PDFErrorBoundary>

          {invoice.status !== "paid" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={payLink} target="_blank">
                <ExternalLink size={14} className="mr-1.5" />
                Pay Link
              </Link>
            </Button>
          )}

          {/* Edit — available for draft, sent, overdue */}
          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/invoices/${invoice._id}/edit`}>
                <Pencil size={14} className="mr-1.5" />
                Edit
              </Link>
            </Button>
          )}

          {/* Duplicate — always available */}
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy size={14} className="mr-1.5" />
            Duplicate
          </Button>

          {/* Send — draft only */}
          {invoice.status === "draft" && (
            <Button size="sm" onClick={handleSend}>
              <Send size={14} className="mr-1.5" />
              Send
            </Button>
          )}

          {/* Resend — sent / overdue */}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button variant="outline" size="sm" onClick={handleResend}>
              <RefreshCw size={14} className="mr-1.5" />
              Resend
            </Button>
          )}

          {/* Delete — draft only */}
          {invoice.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        {/* Bill To / Dates */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase text-muted-foreground font-medium mb-2">
              Bill To
            </p>
            <p className="font-semibold">{invoice.client?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.client?.email ?? "—"}
            </p>
            {invoice.client?.address && (
              <p className="text-sm text-muted-foreground mt-1">
                {invoice.client.address}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground font-medium mb-2">
              Dates
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Issued:</span>{" "}
              {formatDate(invoice.issueDate)}
            </p>
            <p className="text-sm mt-1">
              <span className="text-muted-foreground">Due:</span>{" "}
              <span
                className={
                  invoice.status === "overdue" ? "text-red-600 font-medium" : ""
                }
              >
                {formatDate(invoice.dueDate)}
              </span>
            </p>
            {invoice.paidAt && (
              <p className="text-sm mt-1 text-green-600">
                Paid: {formatDate(invoice.paidAt)}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Line items */}
        <div>
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase mb-2 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Unit Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {invoice.items.map(
            (
              item: {
                description: string;
                quantity: number;
                unitPrice: number;
                total: number;
              },
              i: number
            ) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 py-3 border-b border-border last:border-0 px-1"
              >
                <span className="col-span-6 text-sm">{item.description}</span>
                <span className="col-span-2 text-center text-sm text-muted-foreground">
                  {item.quantity}
                </span>
                <span className="col-span-2 text-right text-sm text-muted-foreground">
                  {formatNaira(item.unitPrice)}
                </span>
                <span className="col-span-2 text-right text-sm font-medium">
                  {formatNaira(item.total)}
                </span>
              </div>
            )
          )}
        </div>

        <Separator />

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-56 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatNaira(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({invoice.taxRate}%)
              </span>
              <span>{formatNaira(invoice.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-primary">{formatNaira(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs uppercase text-muted-foreground font-medium mb-2">
                Notes
              </p>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          </>
        )}

        {/* Payment link */}
        {invoice.status !== "paid" && (
          <>
            <Separator />
            <div>
              <p className="text-xs uppercase text-muted-foreground font-medium mb-2">
                Payment Link
              </p>
              <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}${payLink}`
                  : payLink}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
