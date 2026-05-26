import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { sendEmail, fromEmail } from "./lib/email";

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
  handler: async (_ctx, args) => {
    const adminEmail = process.env.SUPPORT_EMAIL ?? "support@paytrack.app";

    await sendEmail({
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
