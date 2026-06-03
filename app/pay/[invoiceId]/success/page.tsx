"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  FileText,
  Building2,
  User,
  Calendar,
  Hash,
  Loader2,
  Clock,
} from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";

function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.55 },
    colors: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6", "#a855f7"],
  });

  const duration = 3500;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.6 },
      colors: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6"],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.6 },
      colors: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#3b82f6"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export default function PaymentSuccessPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const invoice = useQuery(api.invoices.getInvoiceById, {
    invoiceId: invoiceId as Id<"invoices">,
  });

  // Fire confetti immediately on mount — don't wait for webhook confirmation
  useEffect(() => {
    fireConfetti();
  }, []);

  if (invoice === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-linear-to-br from-indigo-50 via-white to-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const confirmed = invoice?.status === "paid";
  const currency = invoice?.currency ?? "NGN";
  const fmt = (n: number) => formatCurrency(n, currency);

  const details = [
    {
      icon: Hash,
      label: "Invoice Number",
      value: invoice?.invoiceNumber ?? "—",
      mono: true,
    },
    {
      icon: Building2,
      label: "From",
      value: invoice?.profile?.businessName ?? "—",
      mono: false,
    },
    {
      icon: User,
      label: "Billed To",
      value: invoice?.client?.name ?? "—",
      mono: false,
    },
    {
      icon: Calendar,
      label: "Paid On",
      value: confirmed && invoice?.paidAt
        ? formatDate(invoice.paidAt)
        : formatDate(Date.now()),
      mono: false,
    },
  ];

  return (
    <div className="flex min-h-svh items-center justify-center bg-linear-to-br from-indigo-50 via-white to-green-50 p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border bg-white shadow-xl overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-green-500" />

          <div className="p-8 space-y-6">

            {/* Icon + heading */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="rounded-full bg-green-100 p-5">
                    <CheckCircle size={52} className="text-green-500" strokeWidth={1.5} />
                  </div>
                  <span className="absolute inset-0 rounded-full animate-ping bg-green-200 opacity-40" />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-heading font-bold text-gray-900">
                  Payment Successful!
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Your payment has been received and confirmed.
                </p>
              </div>

              {/* Amount */}
              {invoice && (
                <div className="py-3">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
                    Amount Paid
                  </p>
                  <p className="text-5xl font-heading font-bold text-indigo-600">
                    {fmt(invoice.total)}
                  </p>
                </div>
              )}
            </div>

            {/* Webhook processing banner — shown until Convex confirms */}
            {!confirmed && (
              <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Clock size={14} className="shrink-0 animate-pulse" />
                <span>Finalising confirmation — this usually takes a few seconds.</span>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-muted-foreground">
                  Payment Details
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {details.map(({ icon: Icon, label, value, mono }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Icon size={14} className="shrink-0 text-indigo-400" />
                    {label}
                  </div>
                  <span className={`text-sm font-medium text-gray-800 ${mono ? "font-mono" : ""}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Verified badge */}
            <div className="flex justify-center">
              {confirmed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-xs font-medium text-green-700">
                  <CheckCircle size={12} />
                  Verified by Paystack
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-700">
                  <Loader2 size={12} className="animate-spin" />
                  Processing confirmation…
                </span>
              )}
            </div>

            {/* CTA */}
            <Button variant="outline" className="w-full gap-2" asChild>
              <Link href={`/pay/${invoiceId}`}>
                <FileText size={15} />
                View Receipt
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        {invoice?.client?.email && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            A confirmation has been sent to{" "}
            <span className="font-medium">{invoice.client.email}</span>
          </p>
        )}
      </div>
    </div>
  );
}
