"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  Receipt,
  Info,
} from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata: Record<string, string>;
        callback: () => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

export default function BillingPage() {
  const billing = useQuery(api.billing.getMyBillingStatus);
  const profile = useQuery(api.users.getMyProfile);
  const payments = useQuery(api.payments.listMyPayments);

  function handlePayFees() {
    if (!billing || !profile || !window.PaystackPop) {
      toast.error("Payment system not ready. Please refresh.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: profile.email,
      amount: billing.platformFeeOwed,
      currency: "NGN",
      ref: `paytrack_fee_${Date.now()}`,
      metadata: {
        type: "platform_fee",
        userId: profile.userId,
      },
      callback: () => {
        toast.success("Fees paid successfully! Thank you.", { duration: 6000 });
      },
      onClose: () => toast.info("Payment cancelled"),
    });

    handler.openIframe();
  }

  const isLoading =
    billing === undefined || profile === undefined || payments === undefined;

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Platform usage, outstanding fees, and payment history
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">
                Payment History
                {payments.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {payments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Usage</CardTitle>
                  <CardDescription>
                    Your first 5 invoice payments are free. ₦100 per payment after that.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg border p-4">
                      <p className="text-3xl font-bold">{billing.paidPaymentCount}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">Payments received</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-3xl font-bold text-green-600">
                        {billing.freePaymentsLeft}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">Free slots left</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p
                        className={`text-3xl font-bold ${
                          billing.platformFeeOwed > 0
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        ₦{(billing.platformFeeOwed / 100).toLocaleString("en-NG")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">Outstanding fees</p>
                    </div>
                  </div>

                  <Separator />

                  {billing.platformFeeOwed > 0 ? (
                    <div
                      className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                        billing.platformFeeOwed >= 50000
                          ? "border-destructive/40 bg-destructive/5"
                          : "border-amber-300 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          size={18}
                          className={`shrink-0 mt-0.5 ${
                            billing.platformFeeOwed >= 50000
                              ? "text-destructive"
                              : "text-amber-600"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-sm">
                            ₦{(billing.platformFeeOwed / 100).toLocaleString("en-NG")} outstanding
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {billing.platformFeeOwed >= 50000
                              ? "Invoice sending is blocked until fees are paid."
                              : "Pay to keep full access to all features."}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={billing.platformFeeOwed >= 50000 ? "destructive" : "default"}
                        onClick={handlePayFees}
                        className="shrink-0"
                      >
                        <CreditCard size={14} className="mr-1.5" />
                        Pay now
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>No outstanding fees — you&apos;re all good!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Payment History ── */}
            <TabsContent value="history" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    All invoice payments received from your clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Receipt size={32} className="text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No payments yet. Send your first invoice to get started.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase px-1 mb-2">
                        <span className="col-span-3">Invoice</span>
                        <span className="col-span-3">Date</span>
                        <span className="col-span-3">Channel</span>
                        <span className="col-span-3 text-right">Amount</span>
                      </div>
                      {payments.map((p) => (
                        <div
                          key={p._id}
                          className="grid grid-cols-12 gap-2 py-3 border-b border-border last:border-0 px-1 text-sm"
                        >
                          <span className="col-span-3 font-medium">{p.invoiceNumber}</span>
                          <span className="col-span-3 text-muted-foreground">
                            {formatDate(p.paidAt)}
                          </span>
                          <span className="col-span-3 text-muted-foreground capitalize">
                            {p.channel ?? "—"}
                          </span>
                          <span className="col-span-3 text-right font-medium">
                            {new Intl.NumberFormat("en-NG", {
                              style: "currency",
                              currency: p.currency,
                              minimumFractionDigits: 2,
                            }).format(p.amount / 100)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Pricing ── */}
            <TabsContent value="pricing" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>How Billing Works</CardTitle>
                  <CardDescription>
                    PayTrack charges a small platform fee per successful invoice payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        1–5
                      </div>
                      <div>
                        <p className="font-medium text-sm">First 5 payments — Free</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Every new account starts with 5 complimentary payment slots. No fees,
                          no credit card required.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        6+
                      </div>
                      <div>
                        <p className="font-medium text-sm">₦100 per successful payment</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          After your 5 free slots, PayTrack charges ₦100 each time a client
                          successfully pays one of your invoices. Fees accumulate and you
                          pay them in one go.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 border px-4 py-3 text-sm text-muted-foreground">
                    <Info size={15} className="shrink-0 mt-0.5" />
                    <p>
                      Fees are charged to you (the business owner), not to your clients. Your
                      clients always see and pay only the invoice amount you set. Sending invoices
                      is blocked if outstanding fees reach ₦500 or more.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
