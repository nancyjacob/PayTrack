import {
  mutation,
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal, api } from "./_generated/api";
import { fromEmail } from "./lib/email";

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildMonthlyRevenue(
  paidInvoices: Array<{ paidAt?: number; total: number }>
) {
  const months: Record<string, number> = {};
  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue;
    const d = new Date(inv.paidAt);
    const key = d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
    months[key] = (months[key] ?? 0) + inv.total;
  }
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export const listInvoices = query({
  args: {
    status: v.optional(v.string()),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, { status, clientId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let invoices;
    if (status) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", userId).eq("status", status as "draft" | "sent" | "paid" | "overdue")
        )
        .order("desc")
        .collect();
    } else {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    }

    if (clientId) {
      invoices = invoices.filter((inv) => inv.clientId === clientId);
    }

    const withClients = await Promise.all(
      invoices.map(async (inv) => ({
        ...inv,
        client: await ctx.db.get(inv.clientId),
      }))
    );

    return withClients;
  },
});

export const getInvoiceById = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice) return null;
    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoiceId))
      .collect();
    const client = await ctx.db.get(invoice.clientId);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", invoice.userId))
      .unique();
    return { ...invoice, items, client, profile };
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const paidInvoices = invoices.filter((i) => i.status === "paid");
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");
    const sentInvoices = invoices.filter((i) => i.status === "sent");
    const draftInvoices = invoices.filter((i) => i.status === "draft");

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const outstanding = [...sentInvoices, ...overdueInvoices].reduce((sum, i) => sum + i.total, 0);
    const overdueCount = overdueInvoices.length;
    const paidCount = paidInvoices.length;

    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
    const recentPaid = paidInvoices.filter((i) => i.paidAt && i.paidAt > sixMonthsAgo);
    const monthlyData = buildMonthlyRevenue(recentPaid);

    // Collection rate
    const collectableDenominator = paidCount + sentInvoices.length + overdueCount;
    const collectionRate = collectableDenominator > 0
      ? Math.round((paidCount / collectableDenominator) * 100)
      : 0;

    // Average invoice value (kobo)
    const avgInvoiceValue = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;

    // Overdue amount (kobo)
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.total, 0);

    // Tax collected on paid invoices (kobo)
    const taxCollected = paidInvoices.reduce((sum, i) => sum + i.tax, 0);

    // Month-over-month growth
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const thisMonthRevenue = paidInvoices
      .filter((i) => i.paidAt && i.paidAt >= thisMonthStart)
      .reduce((sum, i) => sum + i.total, 0);
    const lastMonthRevenue = paidInvoices
      .filter((i) => i.paidAt && i.paidAt >= lastMonthStart && i.paidAt < thisMonthStart)
      .reduce((sum, i) => sum + i.total, 0);
    const momGrowth: number | null = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null;

    // Average days to pay
    const daysToPayList = paidInvoices
      .filter((i) => i.paidAt)
      .map((i) => (i.paidAt! - i.issueDate) / (1000 * 60 * 60 * 24));
    const avgDaysToPay = daysToPayList.length > 0
      ? Math.round(daysToPayList.reduce((s, d) => s + d, 0) / daysToPayList.length)
      : 0;

    // Status breakdown
    const statusBreakdown = {
      draft: draftInvoices.length,
      sent: sentInvoices.length,
      paid: paidCount,
      overdue: overdueCount,
    };

    // Top 5 clients by paid revenue
    const clientTotals: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const key = inv.clientId as string;
      clientTotals[key] = (clientTotals[key] ?? 0) + inv.total;
    }
    const topClientIds = Object.entries(clientTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topClientsRaw = await Promise.all(
      topClientIds.map(async ([clientId, totalPaid]) => {
        const client = await ctx.db.get(clientId as Id<"clients">);
        if (!client) return null;
        return { clientId, name: client.name, totalPaid };
      })
    );
    const topClients = topClientsRaw.filter((c) => c !== null);

    // Payment channel breakdown
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const channelMap: Record<string, { count: number; amount: number }> = {};
    for (const p of payments) {
      const ch = p.channel ?? "other";
      if (!channelMap[ch]) channelMap[ch] = { count: 0, amount: 0 };
      channelMap[ch].count += 1;
      channelMap[ch].amount += p.amount;
    }
    const channelBreakdown = Object.entries(channelMap).map(([channel, v]) => ({
      channel,
      count: v.count,
      amount: v.amount,
    }));

    return {
      totalRevenue,
      outstanding,
      overdueCount,
      paidCount,
      monthlyData,
      collectionRate,
      avgInvoiceValue,
      overdueAmount,
      taxCollected,
      momGrowth,
      avgDaysToPay,
      statusBreakdown,
      topClients,
      channelBreakdown,
    };
  },
});

// Internal query used by cron job
export const getSentInvoicesForCron = internalQuery({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .collect();
    return Promise.all(
      invoices.map(async (inv) => ({
        ...inv,
        client: await ctx.db.get(inv.clientId),
        profile: await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", inv.userId))
          .unique(),
      }))
    );
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

export const createInvoice = mutation({
  args: {
    clientId: v.id("clients"),
    issueDate: v.number(),
    dueDate: v.number(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
      })
    ),
    notes: v.optional(v.string()),
    taxRate: v.number(),
    currency: v.optional(v.union(v.literal("NGN"), v.literal("USD"), v.literal("GBP"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Complete your business profile first");

    const year = new Date().getFullYear();
    const seq = String(profile.invoiceCount + 1).padStart(3, "0");
    const invoiceNumber = `INV-${year}-${seq}`;

    const subtotal = args.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = Math.round(subtotal * (args.taxRate / 100));
    const total = subtotal + tax;

    const invoiceId = await ctx.db.insert("invoices", {
      userId,
      clientId: args.clientId,
      invoiceNumber,
      status: "draft",
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      subtotal,
      tax,
      total,
      taxRate: args.taxRate,
      notes: args.notes,
      currency: args.currency ?? "NGN",
      createdAt: Date.now(),
    });

    for (const item of args.items) {
      await ctx.db.insert("invoiceItems", {
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      });
    }

    await ctx.db.patch(profile._id, {
      invoiceCount: profile.invoiceCount + 1,
    });

    return invoiceId;
  },
});

export const updateInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    clientId: v.optional(v.id("clients")),
    issueDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    items: v.optional(
      v.array(
        v.object({
          description: v.string(),
          quantity: v.number(),
          unitPrice: v.number(),
        })
      )
    ),
    notes: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    currency: v.optional(v.union(v.literal("NGN"), v.literal("USD"), v.literal("GBP"))),
  },
  handler: async (ctx, { invoiceId, items, taxRate, ...rest }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    const patch: Record<string, unknown> = { ...rest };

    if (items !== undefined || taxRate !== undefined) {
      const newItems = items ?? [];
      const newTaxRate = taxRate ?? invoice.taxRate;
      const subtotal = newItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const tax = Math.round(subtotal * (newTaxRate / 100));
      patch.subtotal = subtotal;
      patch.tax = tax;
      patch.total = subtotal + tax;
      patch.taxRate = newTaxRate;

      const oldItems = await ctx.db
        .query("invoiceItems")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoiceId))
        .collect();
      for (const old of oldItems) await ctx.db.delete(old._id);

      for (const item of newItems) {
        await ctx.db.insert("invoiceItems", {
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        });
      }
    }

    await ctx.db.patch(invoiceId, patch);
  },
});

export const deleteInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be deleted");

    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoiceId))
      .collect();
    for (const item of items) await ctx.db.delete(item._id);
    await ctx.db.delete(invoiceId);
  },
});

export const sendInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    // Read blocking threshold from settings (default ₦500 = 50000 kobo)
    const thresholdSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "max_outstanding_fee_kobo"))
      .unique();
    const blockThreshold = thresholdSetting ? parseInt(thresholdSetting.value, 10) : 50000;
    const feeOwed = profile?.platformFeeOwed ?? 0;
    if (feeOwed >= blockThreshold) {
      const naira = blockThreshold / 100;
      throw new Error(
        `You have ₦${naira.toLocaleString("en-NG")}+ in outstanding platform fees. Please pay them before sending invoices.`
      );
    }

    await ctx.db.patch(invoiceId, { status: "sent", sentAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.invoices.sendInvoiceEmail, { invoiceId });
  },
});

export const resendInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");
    if (invoice.status !== "sent" && invoice.status !== "overdue")
      throw new Error("Only sent or overdue invoices can be resent");
    await ctx.scheduler.runAfter(0, internal.invoices.sendInvoiceEmail, { invoiceId });
  },
});

export const duplicateInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(invoiceId);
    if (!invoice || invoice.userId !== userId) throw new Error("Not found");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Complete your business profile first");

    const items = await ctx.db
      .query("invoiceItems")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoiceId))
      .collect();

    const year = new Date().getFullYear();
    const seq = String(profile.invoiceCount + 1).padStart(3, "0");
    const now = Date.now();

    const newId = await ctx.db.insert("invoices", {
      userId,
      clientId: invoice.clientId,
      invoiceNumber: `INV-${year}-${seq}`,
      status: "draft",
      issueDate: now,
      dueDate: now + 14 * 24 * 60 * 60 * 1000,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      taxRate: invoice.taxRate,
      notes: invoice.notes,
      currency: invoice.currency,
      createdAt: now,
    });

    for (const item of items) {
      await ctx.db.insert("invoiceItems", {
        invoiceId: newId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      });
    }

    await ctx.db.patch(profile._id, { invoiceCount: profile.invoiceCount + 1 });
    return newId;
  },
});

// Internal mutation — called by processPaystackWebhook action
export const markAsPaid = internalMutation({
  args: {
    invoiceId: v.id("invoices"),
    paystackReference: v.string(),
    channel: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, { invoiceId, paystackReference, channel, amount }) => {
    const invoice = await ctx.db.get(invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") return;

    await ctx.db.patch(invoiceId, {
      status: "paid",
      paidAt: Date.now(),
      paystackReference,
    });

    await ctx.db.insert("payments", {
      invoiceId,
      userId: invoice.userId,
      amount: amount ?? invoice.total,
      paystackReference,
      paystackStatus: "success",
      channel,
      paidAt: Date.now(),
    });

    // Platform fee — read free slots and fee per invoice from system settings
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", invoice.userId))
      .unique();
    if (profile) {
      const freeSlotsSetting = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", "free_invoice_slots"))
        .unique();
      const feeSetting = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", "platform_fee_kobo"))
        .unique();
      const freeSlots = freeSlotsSetting ? parseInt(freeSlotsSetting.value, 10) : 5;
      const feeKobo   = feeSetting       ? parseInt(feeSetting.value, 10)        : 10000;

      const newCount = (profile.paidPaymentCount ?? 0) + 1;
      const feeIncrement = newCount > freeSlots ? feeKobo : 0;
      await ctx.db.patch(profile._id, {
        paidPaymentCount: newCount,
        platformFeeOwed: (profile.platformFeeOwed ?? 0) + feeIncrement,
      });
    }
  },
});

// Internal mutation called by cron
export const markOverdue = internalMutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    await ctx.db.patch(invoiceId, { status: "overdue" });
  },
});

// ─── Internal Actions ─────────────────────────────────────────────────────────

export const sendInvoiceEmail = internalAction({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const invoice = await ctx.runQuery(api.invoices.getInvoiceById, { invoiceId });
    if (!invoice || !invoice.client || !invoice.client.email) return;

    const currency = invoice.currency ?? "NGN";
    const locale = currency === "USD" ? "en-US" : currency === "GBP" ? "en-GB" : "en-NG";

    function fmt(kobo: number) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(kobo / 100);
    }

    function fmtDate(ts: number) {
      return new Date(ts).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const payLink   = `${process.env.SITE_URL}/pay/${invoiceId}`;
    const bizName   = invoice.profile?.businessName ?? "PayTrack";
    const total     = fmt(invoice.total);
    const subtotal  = fmt(invoice.subtotal);
    const tax       = fmt(invoice.tax);
    const dueDate   = fmtDate(invoice.dueDate);
    const issueDate = fmtDate(invoice.issueDate);

    const itemRows = (invoice.items as Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>)
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px">${item.description}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right">${fmt(item.unitPrice)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;font-weight:600">${fmt(item.total)}</td>
        </tr>`
      )
      .join("");

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:#6366f1;padding:28px 32px">
      <p style="margin:0;font-size:13px;color:#c7d2fe;letter-spacing:.05em;text-transform:uppercase">Invoice from</p>
      <h1 style="margin:4px 0 0;font-size:22px;color:#fff;font-weight:700">${bizName}</h1>
    </div>

    <!-- Invoice meta -->
    <div style="padding:24px 32px 0;display:flex;justify-content:space-between">
      <div>
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Invoice number</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#111827;font-family:monospace">${invoice.invoiceNumber}</p>
      </div>
      <div style="text-align:right">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Amount due</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#6366f1">${total}</p>
      </div>
    </div>

    <div style="padding:8px 32px 20px;display:flex;gap:32px;border-bottom:1px solid #f3f4f6">
      <div>
        <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Issue date</p>
        <p style="margin:0;font-size:13px;color:#374151">${issueDate}</p>
      </div>
      <div>
        <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Due date</p>
        <p style="margin:0;font-size:13px;font-weight:600;color:#111827">${dueDate}</p>
      </div>
    </div>

    <!-- Bill to -->
    <div style="padding:20px 32px;border-bottom:1px solid #f3f4f6">
      <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Billed to</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#111827">${invoice.client.name}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#6b7280">${invoice.client.email}</p>
      ${invoice.client.address ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280">${invoice.client.address}</p>` : ""}
    </div>

    <!-- Line items -->
    <div style="padding:20px 32px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;text-align:left">Description</th>
            <th style="padding:8px 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;text-align:center">Qty</th>
            <th style="padding:8px 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;text-align:right">Unit Price</th>
            <th style="padding:8px 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
        <div style="display:flex;justify-content:flex-end">
          <div style="min-width:200px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#6b7280">
              <span>Subtotal</span><span>${subtotal}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#6b7280">
              <span>Tax (${invoice.taxRate}%)</span><span>${tax}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #e5e7eb;margin-top:4px">
              <span>Total</span><span style="color:#6366f1">${total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${invoice.notes ? `
    <!-- Notes -->
    <div style="padding:0 32px 20px">
      <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Notes</p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">${invoice.notes}</p>
    </div>` : ""}

    <!-- CTA -->
    <div style="padding:24px 32px;background:#f9fafb;text-align:center">
      <a href="${payLink}"
         style="display:inline-block;background:#6366f1;color:#fff;padding:13px 32px;border-radius:7px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:.01em">
        Pay Now — ${total}
      </a>
      <p style="margin:14px 0 0;font-size:12px;color:#9ca3af">
        Or open this link in your browser:<br />
        <a href="${payLink}" style="color:#6366f1;text-decoration:none;word-break:break-all">${payLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#d1d5db">
        Sent via <strong style="color:#6366f1">PayTrack</strong> · This email was sent on behalf of ${bizName}
      </p>
    </div>
  </div>
</body>
</html>`;

    await ctx.runAction(internal.emailActions.send, {
      fromAddress: fromEmail(),
      toAddress: invoice.client.email,
      toName: invoice.client.name,
      subject: `Invoice ${invoice.invoiceNumber} from ${bizName} — ${total} due ${dueDate}`,
      htmlBody,
    });
  },
});

export const processPaystackWebhook = internalAction({
  args: { body: v.string(), signature: v.string() },
  handler: async (ctx, { body, signature }) => {
    // Use Web Crypto API (available in Convex edge runtime, unlike Node's crypto)
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
        metadata?: { invoiceId?: string };
      };
    };

    if (event.event !== "charge.success") return { ok: true };

    const invoiceId = event.data.metadata?.invoiceId;
    if (!invoiceId) return { ok: true };

    await ctx.runMutation(internal.invoices.markAsPaid, {
      invoiceId: invoiceId as Id<"invoices">,
      paystackReference: event.data.reference,
      channel: event.data.channel,
      amount: event.data.amount,
    });

    return { ok: true };
  },
});

export const checkAndMarkOverdue = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sentInvoices = await ctx.runQuery(internal.invoices.getSentInvoicesForCron, {});

    for (const invoice of sentInvoices) {
      if (invoice.dueDate >= now) continue;

      await ctx.runMutation(internal.invoices.markOverdue, {
        invoiceId: invoice._id,
      });

      const phone = invoice.client?.phone;
      if (!phone) continue;

      const e164 = phone.startsWith("+")
        ? phone
        : `+234${phone.replace(/^0/, "")}`;

      const amount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(invoice.total / 100);

      const payLink = `${process.env.SITE_URL}/pay/${invoice._id}`;
      const businessName = invoice.profile?.businessName ?? "your vendor";

      try {
        // Use fetch to call Twilio REST API directly (Twilio SDK uses Node.js built-ins
        // incompatible with Convex's edge runtime)
        const sid = process.env.TWILIO_ACCOUNT_SID!;
        const token = process.env.TWILIO_AUTH_TOKEN!;
        const from = process.env.TWILIO_WHATSAPP_FROM!;
        if (sid && token && from) {
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                From: `whatsapp:${from}`,
                To: `whatsapp:${e164}`,
                Body: `Hi ${invoice.client?.name ?? "there"}, invoice ${invoice.invoiceNumber} for ${amount} from ${businessName} is overdue. Please pay here: ${payLink}`,
              }).toString(),
            }
          );
        }
      } catch {
        // WhatsApp failures should not block the cron
      }
    }
  },
});
