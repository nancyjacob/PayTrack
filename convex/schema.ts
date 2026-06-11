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
    defaultCurrency: v.optional(
      v.union(v.literal("NGN"), v.literal("USD"), v.literal("GBP"))
    ),
    plan: v.union(v.literal("free"), v.literal("pro")),
    invoiceCount: v.number(),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
    adminRole: v.optional(
      v.union(v.literal("super_admin"), v.literal("admin"), v.literal("support"))
    ),
    paidPaymentCount: v.optional(v.number()),
    platformFeeOwed: v.optional(v.number()),
    remindersEnabled: v.optional(v.boolean()),
    reminderDays: v.optional(v.array(v.number())),
    isDeleted: v.optional(v.boolean()),
    emailVerified: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  emailVerificationTokens: defineTable({
    userId: v.id("users"),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    failedAttempts: v.number(),
    lastSentAt: v.number(),
    resendCount: v.number(),
  })
    .index("by_userId", ["userId"]),

  clients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_email", ["userId", "email"]),

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
    sentAt: v.optional(v.number()),
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

  supportTickets: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved")
    ),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_assignedTo", ["assignedTo"]),

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

  adminInvitations: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("support")
    ),
    invitedBy: v.id("users"),
    token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  systemSettings: defineTable({
    key: v.string(),
    value: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    inputType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("toggle")
    ),
    options: v.optional(v.array(v.string())),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  rolePermissions: defineTable({
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("support")
    ),
    resource: v.string(),
    actions: v.array(v.string()),
  })
    .index("by_role", ["role"])
    .index("by_role_resource", ["role", "resource"]),

  invoiceReminders: defineTable({
    invoiceId: v.id("invoices"),
    userId: v.id("users"),
    reminderKey: v.string(),
    sentAt: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_invoiceId_and_reminderKey", ["invoiceId", "reminderKey"]),
});
