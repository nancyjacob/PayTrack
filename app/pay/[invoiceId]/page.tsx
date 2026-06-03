"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, type InvoiceStatus } from "@/lib/utils";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function PayPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const router = useRouter();

  const invoice = useQuery(api.invoices.getInvoiceById, {
    invoiceId: invoiceId as Id<"invoices">,
  });

  // Redirect already-paid invoices to the success page
  useEffect(() => {
    if (invoice?.status === "paid") {
      router.replace(`/pay/${invoiceId}/success`);
    }
  }, [invoice?.status, invoiceId, router]);

  function handlePayNow() {
    if (!invoice || !invoice.client) return;

    if (!window.PaystackPop) {
      toast.error("Payment system not loaded. Please refresh and try again.");
      return;
    }

    const currency = invoice.currency ?? "NGN";

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: invoice.client.email,
      amount: invoice.total,
      currency,
      ref: `paytrack_${invoiceId}_${Date.now()}`,
      metadata: {
        invoiceId,
        clientName: invoice.client.name,
      },
      callback: () => {
        router.replace(`/pay/${invoiceId}/success`);
      },
      onClose: () => {
        toast.info("Payment cancelled");
      },
    });

    handler.openIframe();
  }

  if (invoice === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invoice === null) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold">Invoice not found</p>
          <p className="text-muted-foreground">
            This payment link may be invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  const currency = invoice.currency ?? "NGN";
  const fmt = (amount: number) => formatCurrency(amount, currency);

  // Already paid — redirect to success page
  if (invoice.status === "paid") {
    router.replace(`/pay/${invoiceId}/success`);
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
      />

      <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-xl border bg-card overflow-hidden">
          {/* Business header */}
          <div className="bg-primary px-6 py-5 text-primary-foreground">
            <p className="text-sm font-medium opacity-80">
              {invoice.profile?.businessName ?? "Invoice"}
            </p>
            <p className="text-3xl font-bold font-heading mt-1">
              {fmt(invoice.total)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm opacity-80">{invoice.invoiceNumber}</span>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Bill to */}
            <div>
              <p className="text-xs uppercase text-muted-foreground font-medium mb-1">
                Bill To
              </p>
              <p className="font-medium">{invoice.client?.name ?? "—"}</p>
            </div>

            <Separator />

            {/* Due date */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due Date</span>
              <span
                className={
                  invoice.status === "overdue" ? "text-red-600 font-medium" : ""
                }
              >
                {formatDate(invoice.dueDate)}
              </span>
            </div>

            {/* Line items */}
            {invoice.items.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  {invoice.items.map(
                    (
                      item: { description: string; quantity: number; total: number },
                      i: number
                    ) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.description}{" "}
                          {item.quantity > 1 && `× ${item.quantity}`}
                        </span>
                        <span>{fmt(item.total)}</span>
                      </div>
                    )
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({invoice.taxRate}%)
                      </span>
                      <span>{fmt(invoice.tax)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{fmt(invoice.total)}</span>
                </div>
              </>
            )}

            {/* Pay button */}
            <Button className="w-full mt-2" size="lg" onClick={handlePayNow}>
              <CreditCard size={18} className="mr-2" />
              Pay {fmt(invoice.total)} with Paystack
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secured by Paystack · Cards, Bank Transfer &amp; USSD accepted
            </p>

            {/* Notes */}
            {invoice.notes && (
              <>
                <Separator />
                <p className="text-xs text-muted-foreground">{invoice.notes}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
