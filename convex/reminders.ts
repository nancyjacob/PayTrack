import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { fromEmail } from "./lib/email";

// Day offsets used when a user hasn't configured their own schedule.
// Negative = days before due date; positive = days after due date.
export const DEFAULT_REMINDER_DAYS = [-4, 7, 14];

// ─── Public queries / mutations (user-facing) ─────────────────────────────────

export const getReminderSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;
    return {
      remindersEnabled: profile.remindersEnabled ?? true,
      reminderDays: profile.reminderDays ?? DEFAULT_REMINDER_DAYS,
    };
  },
});

export const updateReminderSettings = mutation({
  args: {
    remindersEnabled: v.boolean(),
    reminderDays: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Complete your profile first");
    await ctx.db.patch(profile._id, {
      remindersEnabled: args.remindersEnabled,
      reminderDays: args.reminderDays,
    });
  },
});

// ─── Internal queries ──────────────────────────────────────────────────────────

export const getActiveInvoicesForReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sent = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .collect();
    const overdue = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "overdue"))
      .collect();

    return Promise.all(
      [...sent, ...overdue].map(async (inv) => ({
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

export const getSentReminderKeys = internalQuery({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, { invoiceId }) => {
    const rows = await ctx.db
      .query("invoiceReminders")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoiceId))
      .collect();
    return rows.map((r) => r.reminderKey);
  },
});

// ─── Internal mutations ───────────────────────────────────────────────────────

export const recordReminderSent = internalMutation({
  args: {
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
    reminderKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Guard against duplicates (e.g. concurrent cron runs)
    const existing = await ctx.db
      .query("invoiceReminders")
      .withIndex("by_invoiceId_and_reminderKey", (q) =>
        q.eq("invoiceId", args.invoiceId).eq("reminderKey", args.reminderKey)
      )
      .unique();
    if (existing) return;
    await ctx.db.insert("invoiceReminders", {
      invoiceId: args.invoiceId,
      userId: args.userId,
      reminderKey: args.reminderKey,
      sentAt: Date.now(),
    });
  },
});

// ─── Email template ───────────────────────────────────────────────────────────

function buildReminderHtml(opts: {
  bizName: string;
  invoiceNumber: string;
  clientName: string;
  total: string;
  dueDate: string;
  payLink: string;
  headerBg: string;
  statusLabel: string;
  statusLabelColor: string;
  bodyIntro: string;
  ctaLabel: string;
  currency: string;
  subtotal: string;
  tax: string;
  taxRate: number;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:${opts.headerBg};padding:28px 32px">
      <p style="margin:0;font-size:12px;color:${opts.statusLabelColor};letter-spacing:.06em;text-transform:uppercase;font-weight:600">${opts.statusLabel}</p>
      <h1 style="margin:6px 0 0;font-size:22px;color:#fff;font-weight:700">${opts.bizName}</h1>
    </div>

    <!-- Invoice meta -->
    <div style="padding:24px 32px 0;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Invoice number</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#111827;font-family:monospace">${opts.invoiceNumber}</p>
      </div>
      <div style="text-align:right">
        <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Amount due</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:${opts.headerBg}">${opts.total}</p>
      </div>
    </div>

    <div style="padding:8px 32px 20px;border-bottom:1px solid #f3f4f6">
      <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Due date</p>
      <p style="margin:0;font-size:14px;font-weight:600;color:#111827">${opts.dueDate}</p>
    </div>

    <!-- Body -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6">
      <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6">Hi ${opts.clientName},</p>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7">${opts.bodyIntro}</p>
    </div>

    <!-- Totals summary -->
    <div style="padding:20px 32px;border-bottom:1px solid #f3f4f6">
      <p style="margin:0 0 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em">Invoice summary</p>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#6b7280">
        <span>Subtotal</span><span>${opts.subtotal}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#6b7280">
        <span>Tax (${opts.taxRate}%)</span><span>${opts.tax}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:700;color:#111827;border-top:2px solid #e5e7eb;margin-top:6px">
        <span>Total Due</span><span style="color:${opts.headerBg}">${opts.total}</span>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:28px 32px;background:#f9fafb;text-align:center">
      <a href="${opts.payLink}"
         style="display:inline-block;background:${opts.headerBg};color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:.01em">
        ${opts.ctaLabel}
      </a>
      <p style="margin:14px 0 0;font-size:12px;color:#9ca3af">
        Or open this link:<br/>
        <a href="${opts.payLink}" style="color:${opts.headerBg};text-decoration:none;word-break:break-all">${opts.payLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#d1d5db">
        Sent via <strong style="color:#6366f1">PayTrack</strong> &middot; This reminder was sent on behalf of ${opts.bizName}
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main cron action ─────────────────────────────────────────────────────────

export const processReminderEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const invoices = await ctx.runQuery(
      internal.reminders.getActiveInvoicesForReminders,
      {}
    );

    for (const invoice of invoices) {
      if (!invoice.client?.email) continue;
      if (!invoice.profile) continue;

      const remindersEnabled = invoice.profile.remindersEnabled ?? true;
      if (!remindersEnabled) continue;

      const reminderDays: number[] =
        invoice.profile.reminderDays ?? DEFAULT_REMINDER_DAYS;

      const sentKeys: string[] = await ctx.runQuery(
        internal.reminders.getSentReminderKeys,
        { invoiceId: invoice._id }
      );
      const sentSet = new Set(sentKeys);

      for (const dayOffset of reminderDays) {
        const reminderKey =
          dayOffset < 0
            ? `before_${Math.abs(dayOffset)}`
            : `after_${dayOffset}`;

        if (sentSet.has(reminderKey)) continue;

        const targetTs =
          invoice.dueDate + dayOffset * 24 * 60 * 60 * 1000;

        // Not yet time
        if (now < targetTs) continue;

        // "Before" reminder: skip if the due date has already passed by more
        // than 2 days — at that point the invoice is overdue and a "before" nudge
        // would be confusing.
        if (
          dayOffset < 0 &&
          now > invoice.dueDate + 2 * 24 * 60 * 60 * 1000
        ) {
          continue;
        }

        // ── Build email content ──────────────────────────────────────────────

        const currency = invoice.currency ?? "NGN";
        const locale =
          currency === "USD"
            ? "en-US"
            : currency === "GBP"
              ? "en-GB"
              : "en-NG";

        const fmt = (kobo: number) =>
          new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
          }).format(kobo / 100);

        const fmtDate = (ts: number) =>
          new Date(ts).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

        const payLink = `${process.env.SITE_URL}/pay/${invoice._id}`;
        const bizName = invoice.profile.businessName ?? "Your vendor";
        const total = fmt(invoice.total);
        const subtotal = fmt(invoice.subtotal);
        const tax = fmt(invoice.tax);
        const dueDate = fmtDate(invoice.dueDate);
        const absDays = Math.abs(dayOffset);
        const isBefore = dayOffset < 0;

        const subject = isBefore
          ? `Payment Reminder: Invoice ${invoice.invoiceNumber} due in ${absDays} day${absDays !== 1 ? "s" : ""}`
          : `Overdue Notice: Invoice ${invoice.invoiceNumber} is ${absDays} day${absDays !== 1 ? "s" : ""} overdue`;

        const headerBg = isBefore ? "#6366f1" : "#dc2626";
        const statusLabel = isBefore
          ? `Due in ${absDays} day${absDays !== 1 ? "s" : ""}`
          : `${absDays} day${absDays !== 1 ? "s" : ""} overdue`;
        const statusLabelColor = isBefore ? "#c7d2fe" : "#fca5a5";
        const bodyIntro = isBefore
          ? `This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> for <strong>${total}</strong> from <strong>${bizName}</strong> is due in <strong>${absDays} day${absDays !== 1 ? "s" : ""}</strong> on ${dueDate}. Please arrange payment at your earliest convenience.`
          : `Invoice <strong>${invoice.invoiceNumber}</strong> for <strong>${total}</strong> from <strong>${bizName}</strong> is now <strong>${absDays} day${absDays !== 1 ? "s" : ""} overdue</strong> (due ${dueDate}). Please settle the outstanding balance as soon as possible.`;

        const htmlBody = buildReminderHtml({
          bizName,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client.name,
          total,
          subtotal,
          tax,
          taxRate: invoice.taxRate,
          dueDate,
          payLink,
          headerBg,
          statusLabel,
          statusLabelColor,
          bodyIntro,
          ctaLabel: `Pay Now — ${total}`,
          currency,
        });

        try {
          await ctx.runAction(internal.emailActions.send, {
            fromAddress: fromEmail(),
            toAddress: invoice.client.email,
            toName: invoice.client.name,
            subject,
            htmlBody,
          });

          await ctx.runMutation(internal.reminders.recordReminderSent, {
            invoiceId: invoice._id,
            userId: invoice.userId,
            reminderKey,
          });
        } catch {
          // Email failures must not block other invoices
        }
      }
    }
  },
});
