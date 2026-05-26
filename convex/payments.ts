import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listMyPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    // Attach invoice number to each payment
    return await Promise.all(
      payments.map(async (p) => {
        const invoice = await ctx.db.get(p.invoiceId);
        return { ...p, invoiceNumber: invoice?.invoiceNumber ?? "—", currency: invoice?.currency ?? "NGN" };
      })
    );
  },
});

export const listPaymentsByInvoice = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.userId !== userId) return [];
    return await ctx.db
      .query("payments")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoiceId))
      .collect();
  },
});
