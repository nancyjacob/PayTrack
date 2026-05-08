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
    const topClients = await Promise.all(
      topClientIds.map(async ([clientId, totalPaid]) => {
        const client = await ctx.db.get(clientId as Id<"clients">);
        return { clientId, name: client?.name ?? "Unknown", totalPaid };
      })
    );

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Complete your business profile first");

    if (profile.plan === "free" && profile.invoiceCount >= 5) {
      throw new Error("Free plan limit reached (5 invoices). Upgrade to Pro.");
    }

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
      currency: "NGN",
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

    await ctx.db.patch(invoiceId, { status: "sent" });
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
    if (profile.plan === "free" && profile.invoiceCount >= 5)
      throw new Error("Free plan limit reached. Upgrade to Pro.");

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
    if (!invoice || !invoice.client) return;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const payLink = `${process.env.SITE_URL}/pay/${invoiceId}`;
    const amount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(invoice.total / 100);
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    await resend.emails.send({
      from: process.env.AUTH_RESEND_OTP_EMAIL!,
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber} — ${amount} due ${dueDate}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#1a1a2e">Invoice from ${invoice.profile?.businessName ?? "PayTrack"}</h2>
          <p>Dear ${invoice.client.name},</p>
          <p>Please find your invoice <strong>${invoice.invoiceNumber}</strong> for <strong>${amount}</strong>, due on <strong>${dueDate}</strong>.</p>
          <a href="${payLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px">
            Pay Now
          </a>
          <p style="margin-top:24px;color:#6b7280;font-size:13px">
            Or copy this link: ${payLink}
          </p>
        </div>
      `,
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
