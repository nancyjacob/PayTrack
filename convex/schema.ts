import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    businessName: v.string(),
    ownerName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    brandColor: v.optional(v.string()),
    brandFont: v.optional(
      v.union(v.literal("Helvetica"), v.literal("Times-Roman"), v.literal("Courier"))
    ),
    invoiceFooter: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    invoiceCount: v.number(),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  clients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  invoices: defineTable({
    userId: v.id("users"),
    clientId: v.id("clients"),
    invoiceNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    issueDate: v.number(),
    dueDate: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
    currency: v.string(),
    taxRate: v.number(),
    paystackReference: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_clientId", ["clientId"])
    .index("by_status", ["status"]),

  invoiceItems: defineTable({
    invoiceId: v.id("invoices"),
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    total: v.number(),
  }).index("by_invoiceId", ["invoiceId"]),

  payments: defineTable({
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
    amount: v.number(),
    paystackReference: v.string(),
    paystackStatus: v.string(),
    channel: v.optional(v.string()),
    paidAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_userId", ["userId"]),
});
