import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

function makeLabel(ts: number, granularity: "day" | "month"): string {
  const d = new Date(ts);
  return granularity === "day"
    ? d.toLocaleDateString("en-NG", { day: "2-digit", month: "short" })
    : d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
}

function buildTimeSeries(
  items: { timestamp: number; value: number }[],
  since: number,
  until: number,
  granularity: "day" | "month"
): { label: string; value: number }[] {
  const buckets = new Map<string, number>();

  const cursor = new Date(since);
  if (granularity === "day") cursor.setHours(0, 0, 0, 0);
  else {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
  }
  const end = new Date(until);

  while (cursor <= end) {
    const key = makeLabel(cursor.getTime(), granularity);
    if (!buckets.has(key)) buckets.set(key, 0);
    if (granularity === "day") cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const { timestamp, value } of items) {
    const key = makeLabel(timestamp, granularity);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + value);
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export const getAnalytics = query({
  args: {
    since: v.number(),
    granularity: v.union(v.literal("day"), v.literal("month")),
  },
  handler: async (ctx, { since, granularity }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const until = Date.now();
    const periodLength = until - since;
    const prevSince = since - periodLength;

    const [allInvoices, allClients, allPayments] = await Promise.all([
      ctx.db.query("invoices").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("clients").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("payments").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
    ]);

    // ── Current period filters ────────────────────────────────────────────────
    const paidInPeriod = allInvoices.filter(
      (i) => i.paidAt !== undefined && i.paidAt >= since && i.paidAt <= until
    );
    const createdInPeriod = allInvoices.filter(
      (i) => i.createdAt >= since && i.createdAt <= until
    );
    const newClientsInPeriod = allClients.filter(
      (c) => c.createdAt >= since && c.createdAt <= until
    );
    const paymentsInPeriod = allPayments.filter(
      (p) => p.paidAt >= since && p.paidAt <= until
    );

    // ── Previous period filters ───────────────────────────────────────────────
    const prevPaidInPeriod = allInvoices.filter(
      (i) => i.paidAt !== undefined && i.paidAt >= prevSince && i.paidAt < since
    );
    const prevCreatedInPeriod = allInvoices.filter(
      (i) => i.createdAt >= prevSince && i.createdAt < since
    );
    const prevNewClients = allClients.filter(
      (c) => c.createdAt >= prevSince && c.createdAt < since
    );

    // ── KPI: Revenue ──────────────────────────────────────────────────────────
    const revenue = paidInPeriod.reduce((s, i) => s + i.total, 0);
    const prevRevenue = prevPaidInPeriod.reduce((s, i) => s + i.total, 0);
    const revenueGrowth =
      prevRevenue > 0
        ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
        : null;

    // ── KPI: Invoices paid ────────────────────────────────────────────────────
    const invoicesPaidCount = paidInPeriod.length;
    const prevInvoicesPaidCount = prevPaidInPeriod.length;
    const invoicesPaidDelta =
      prevInvoicesPaidCount > 0
        ? invoicesPaidCount - prevInvoicesPaidCount
        : null;

    // ── KPI: New clients ──────────────────────────────────────────────────────
    const newClientsCount = newClientsInPeriod.length;
    const newClientsDelta =
      prevNewClients.length > 0
        ? newClientsCount - prevNewClients.length
        : null;

    // ── KPI: Collection rate ──────────────────────────────────────────────────
    const collectableNow = createdInPeriod.filter((i) => i.status !== "draft").length;
    const paidFromCreated = createdInPeriod.filter((i) => i.status === "paid").length;
    const collectionRate =
      collectableNow > 0 ? Math.round((paidFromCreated / collectableNow) * 100) : null;

    const collectablePrev = prevCreatedInPeriod.filter((i) => i.status !== "draft").length;
    const prevPaidFromCreated = prevCreatedInPeriod.filter((i) => i.status === "paid").length;
    const prevCollectionRate =
      collectablePrev > 0
        ? Math.round((prevPaidFromCreated / collectablePrev) * 100)
        : null;
    const collectionRateDelta =
      prevCollectionRate !== null && collectionRate !== null
        ? collectionRate - prevCollectionRate
        : null;

    // ── KPI: Avg invoice value ────────────────────────────────────────────────
    const avgInvoiceValue =
      invoicesPaidCount > 0 ? Math.round(revenue / invoicesPaidCount) : 0;

    // ── Charts ────────────────────────────────────────────────────────────────
    const revenueOverTime = buildTimeSeries(
      paidInPeriod.map((i) => ({ timestamp: i.paidAt!, value: i.total })),
      since,
      until,
      granularity
    );

    const invoicesOverTime = buildTimeSeries(
      createdInPeriod.map((i) => ({ timestamp: i.createdAt, value: 1 })),
      since,
      until,
      granularity
    );

    // ── Status breakdown (invoices created in period) ─────────────────────────
    const statusBreakdown = {
      draft: createdInPeriod.filter((i) => i.status === "draft").length,
      sent: createdInPeriod.filter((i) => i.status === "sent").length,
      paid: createdInPeriod.filter((i) => i.status === "paid").length,
      overdue: createdInPeriod.filter((i) => i.status === "overdue").length,
    };

    // ── Top clients by paid revenue in period ─────────────────────────────────
    const clientTotals: Record<string, number> = {};
    for (const inv of paidInPeriod) {
      const key = inv.clientId as string;
      clientTotals[key] = (clientTotals[key] ?? 0) + inv.total;
    }
    const topEntries = Object.entries(clientTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topClientsRaw = await Promise.all(
      topEntries.map(async ([clientId, totalPaid]) => {
        const client = await ctx.db.get(clientId as Id<"clients">);
        if (!client) return null;
        const invoiceCount = paidInPeriod.filter(
          (i) => (i.clientId as string) === clientId
        ).length;
        return { name: client.name, totalPaid, invoiceCount };
      })
    );
    const topClients = topClientsRaw.filter((c) => c !== null);

    // ── Payment channel breakdown ─────────────────────────────────────────────
    const channelMap: Record<string, { count: number; amount: number }> = {};
    for (const p of paymentsInPeriod) {
      const ch = p.channel ?? "other";
      if (!channelMap[ch]) channelMap[ch] = { count: 0, amount: 0 };
      channelMap[ch].count++;
      channelMap[ch].amount += p.amount;
    }
    const channelBreakdown = Object.entries(channelMap).map(([channel, v]) => ({
      channel,
      count: v.count,
      amount: v.amount,
    }));

    // ── Recent invoices in period ─────────────────────────────────────────────
    const recentSorted = [...createdInPeriod].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
    const recentInvoices = await Promise.all(
      recentSorted.map(async (inv) => ({
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        total: inv.total,
        createdAt: inv.createdAt,
        clientName: (await ctx.db.get(inv.clientId))?.name ?? "Unknown",
      }))
    );

    return {
      revenue,
      revenueGrowth,
      invoicesPaidCount,
      invoicesPaidDelta,
      newClientsCount,
      newClientsDelta,
      collectionRate,
      collectionRateDelta,
      avgInvoiceValue,
      revenueOverTime,
      invoicesOverTime,
      statusBreakdown,
      topClients,
      channelBreakdown,
      recentInvoices,
    };
  },
});
