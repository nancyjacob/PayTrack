import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const processPaystackWebhook = internalAction({
  args: { body: v.string(), signature: v.string() },
  handler: async (ctx, { body, signature }) => {
    // Verify HMAC-SHA512 signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(process.env.PAYSTACK_SECRET_KEY!),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(body));
    const hash = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hash !== signature) throw new Error("Invalid Paystack signature");

    const event = JSON.parse(body) as {
      event: string;
      data: {
        reference: string;
        channel: string;
        amount: number;
        metadata?: { type?: string; userId?: string; invoiceId?: string };
      };
    };

    if (event.event !== "charge.success") return { ok: true };

    const meta = event.data.metadata ?? {};

    if (meta.type === "platform_fee" && meta.userId) {
      await ctx.runMutation(internal.billing.clearPlatformFee, {
        userId: meta.userId as Id<"users">,
      });
    } else if (meta.invoiceId) {
      await ctx.runMutation(internal.invoices.markAsPaid, {
        invoiceId: meta.invoiceId as Id<"invoices">,
        paystackReference: event.data.reference,
        channel: event.data.channel,
        amount: event.data.amount,
      });
    }

    return { ok: true };
  },
});
