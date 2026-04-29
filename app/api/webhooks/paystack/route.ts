import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = JSON.parse(body) as {
    event: string;
    data: {
      reference: string;
      channel: string;
      amount: number;
      metadata?: { invoiceId?: string };
    };
  };

  if (event.event === "charge.success") {
    const invoiceId = event.data.metadata?.invoiceId;
    if (invoiceId) {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
      try {
        await fetch(`${convexUrl}/markInvoicePaid`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "x-paystack-signature": signature,
          },
          body,
        });
      } catch (err) {
        console.error("Failed to notify Convex:", err);
        // Return 200 so Paystack doesn't retry — the HMAC was already verified
      }
    }
  }

  return NextResponse.json({ received: true });
}
