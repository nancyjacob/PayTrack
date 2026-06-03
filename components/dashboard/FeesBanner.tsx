"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Script from "next/script";
import { AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export function FeesBanner() {
  const billing = useQuery(api.billing.getMyBillingStatus);
  const profile = useQuery(api.users.getMyProfile);

  if (!billing || billing.platformFeeOwed === 0) return null;

  // Use threshold from billing status (which reads from systemSettings) or fallback to 50000 kobo
  const blockThreshold = 50000; // UI only; actual block is enforced server-side
  const isBlocked = billing.platformFeeOwed >= blockThreshold;
  const amountNaira = billing.platformFeeOwed / 100;
  const feePerInvoice = 100; // display only; actual fee is set in System Configuration
  const freeSlots = billing.freeSlots ?? 5;

  function handlePayFees() {
    if (!profile || !window.PaystackPop) {
      toast.error("Payment system not ready. Please refresh and try again.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: profile.email,
      amount: billing!.platformFeeOwed,
      currency: "NGN",
      ref: `paytrack_fee_${Date.now()}`,
      metadata: {
        type: "platform_fee",
        userId: profile.userId,
      },
      callback: () => {
        toast.success("Platform fees paid! Thank you.", { duration: 6000 });
      },
      onClose: () => {
        toast.info("Payment cancelled");
      },
    });

    handler.openIframe();
  }

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
      <div
        className={`flex items-center justify-between gap-4 px-4 py-3 text-sm font-medium ${
          isBlocked
            ? "bg-destructive/10 border-b border-destructive/20 text-destructive"
            : "bg-amber-50 border-b border-amber-200 text-amber-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <XCircle size={16} className="shrink-0" />
          ) : (
            <AlertTriangle size={16} className="shrink-0" />
          )}
          <span>
            {isBlocked
              ? `You have ₦${amountNaira.toLocaleString("en-NG")} in outstanding platform fees. Pay now to resume sending invoices.`
              : `You have ₦${amountNaira.toLocaleString("en-NG")} in outstanding platform fees (₦${feePerInvoice} per invoice payment beyond your ${freeSlots} free slots).`}
          </span>
        </div>
        <Button
          size="sm"
          variant={isBlocked ? "destructive" : "outline"}
          className={isBlocked ? "" : "border-amber-400 text-amber-800 hover:bg-amber-100"}
          onClick={handlePayFees}
        >
          Pay ₦{amountNaira.toLocaleString("en-NG")}
        </Button>
      </div>
    </>
  );
}
