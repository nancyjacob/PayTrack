import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { fromEmail } from "./lib/email";

export const submitSupportTicket = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const ticketId = await ctx.db.insert("supportTickets", {
      userId: userId ?? undefined,
      ...args,
      status: "open",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.support.sendSupportEmail, {
      ticketId,
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
    });
    return ticketId;
  },
});

export const sendSupportEmail = internalAction({
  args: {
    ticketId: v.id("supportTickets"),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const adminEmail = process.env.SUPPORT_EMAIL ?? "support@paytrack.app";

    await ctx.runAction(internal.emailActions.send, {
      fromAddress: fromEmail(),
      toAddress: adminEmail,
      toName: "PayTrack Support",
      subject: `[Support] ${args.subject}`,
      htmlBody: `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${args.name} &lt;${args.email}&gt;</p>
        <p><strong>Subject:</strong> ${args.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${args.message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p style="color:#888;font-size:12px">Ticket ID: ${args.ticketId}</p>
      `,
    });
  },
});

// ── Inbound email (Mailgun webhook) ──────────────────────────────────────────

export const processInboundEmail = internalAction({
  args: {
    from: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const emailMatch = args.from.match(/<([^>]+)>/) ?? args.from.match(/(\S+@\S+)/);
    const email = emailMatch ? emailMatch[1] : args.from;
    const nameMatch = args.from.match(/^(.+?)\s*</);
    const name = nameMatch ? nameMatch[1].replace(/"/g, "").trim() : email;

    await ctx.runMutation(internal.support.createTicketFromInboundEmail, {
      email,
      name,
      subject: args.subject || "(no subject)",
      message: args.body || "(no message)",
    });
  },
});

export const createTicketFromInboundEmail = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("supportTickets", {
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const listMyTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("supportTickets")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});
