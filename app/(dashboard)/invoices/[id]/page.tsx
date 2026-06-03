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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { formatCurrency, formatDate, type InvoiceStatus } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Trash2,
  ExternalLink,
  Pencil,
  Copy,
  RefreshCw,
  Download,
  Mail,
  CheckCircle2,
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
      toast.success(
        invoice.client?.email
          ? `Invoice emailed to ${invoice.client.email}`
          : "Invoice sent to client"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    }
  }

  async function handleResend() {
    if (!invoice) return;
    try {
      await resendInvoice({ invoiceId: invoice._id });
      toast.success(
        invoice.client?.email
          ? `Invoice re-sent to ${invoice.client.email}`
          : "Invoice email resent"
      );
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

          {canEdit && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/invoices/${invoice._id}/edit`}>
                <Pencil size={14} className="mr-1.5" />
                Edit
              </Link>
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy size={14} className="mr-1.5" />
            Duplicate
          </Button>

          {invoice.status === "draft" && (
            <Button size="sm" onClick={handleSend}>
              <Mail size={14} className="mr-1.5" />
              Send Invoice
            </Button>
          )}

          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button variant="outline" size="sm" onClick={handleResend}>
              <RefreshCw size={14} className="mr-1.5" />
              Resend Email
            </Button>
          )}

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

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">Line Items</TabsTrigger>
          <TabsTrigger value="notes">Notes & Payment</TabsTrigger>
        </TabsList>

        {/* ── Details ── */}
        <TabsContent value="details" className="space-y-6 mt-0">
          {/* Email delivery status */}
          {invoice.status === "draft" ? (
            <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Ready to send</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click <strong>Send Invoice</strong> to email this invoice directly to{" "}
                  <strong>{invoice.client?.name ?? "the client"}</strong> at{" "}
                  <strong>{invoice.client?.email ?? "their address"}</strong>. The
                  email will include a payment link so they can pay online.
                </p>
              </div>
            </div>
          ) : (invoice.status === "sent" || invoice.status === "overdue") ? (
            <div className="flex items-start gap-3 rounded-lg border bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30 px-4 py-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Email delivered
                </p>
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-0.5">
                  Invoice emailed to{" "}
                  <span className="font-semibold">{invoice.client?.email ?? invoice.client?.name}</span>
                  {(invoice as { sentAt?: number }).sentAt
                    ? ` on ${formatDate((invoice as { sentAt?: number }).sentAt!)}`
                    : ""}
                  . Use <strong>Resend Email</strong> to send it again.
                </p>
              </div>
            </div>
          ) : invoice.status === "paid" ? (
            <div className="flex items-start gap-3 rounded-lg border bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800/30 px-4 py-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Paid — invoice complete
                </p>
                <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-0.5">
                  Payment received{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ""}.
                  {invoice.client?.email && ` Originally emailed to ${invoice.client.email}.`}
                </p>
              </div>
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bill To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{invoice.client?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{invoice.client?.email ?? "—"}</p>
              {invoice.client?.address && (
                <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Issue Date</span>
                <span className="font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span
                  className={`font-medium ${invoice.status === "overdue" ? "text-red-600" : ""}`}
                >
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid On</span>
                  <span className="font-medium text-green-600">{formatDate(invoice.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Line Items ── */}
        <TabsContent value="items" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Line Items
                <span className="text-xs font-normal text-muted-foreground">
                  Currency: {invoice.currency ?? "NGN"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase px-1">
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
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </span>
                    <span className="col-span-2 text-right text-sm font-medium">
                      {formatCurrency(item.total, invoice.currency)}
                    </span>
                  </div>
                )
              )}

              <Separator />

              <div className="flex justify-end">
                <div className="w-56 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(invoice.tax, invoice.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notes & Payment ── */}
        <TabsContent value="notes" className="space-y-6 mt-0">
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {invoice.status !== "paid" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Share this link with your client so they can pay directly.
                </p>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md break-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}${payLink}`
                    : payLink}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={payLink} target="_blank">
                    <ExternalLink size={14} className="mr-1.5" />
                    Open payment page
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {!invoice.notes && invoice.status === "paid" && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No notes on this invoice.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
