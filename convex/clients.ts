import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listClients = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getClientById = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const client = await ctx.db.get(clientId);
    if (!client || client.userId !== userId) return null;
    return client;
  },
});

export const createClient = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("clients")
      .withIndex("by_userId_email", (q) =>
        q.eq("userId", userId).eq("email", args.email)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("clients", {
      userId,
      createdAt: Date.now(),
      ...args,
    });
  },
});

export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { clientId, ...rest }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const client = await ctx.db.get(clientId);
    if (!client || client.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(clientId, rest);
  },
});

export const deleteClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const client = await ctx.db.get(clientId);
    if (!client || client.userId !== userId) throw new Error("Not found");

    // Cascade: delete all invoices and their items
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
      .collect();
    for (const invoice of invoices) {
      const items = await ctx.db
        .query("invoiceItems")
        .withIndex("by_invoiceId", (q) => q.eq("invoiceId", invoice._id))
        .collect();
      for (const item of items) await ctx.db.delete(item._id);
      await ctx.db.delete(invoice._id);
    }

    await ctx.db.delete(clientId);
  },
});
