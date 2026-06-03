import { mutation, query } from "./_generated/server";
import { type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Default settings ────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: {
  key: string;
  value: string;
  label: string;
  description?: string;
  category: string;
  inputType: "text" | "number" | "select" | "toggle";
  options?: string[];
}[] = [
  // Regional
  {
    key: "country",
    label: "Country",
    value: "Nigeria",
    category: "regional",
    inputType: "text",
    description: "The primary country for this platform instance.",
  },
  {
    key: "currency",
    label: "Default Currency",
    value: "NGN",
    category: "regional",
    inputType: "select",
    options: ["NGN", "USD", "GBP", "EUR"],
    description: "Default currency used for new user accounts.",
  },
  {
    key: "timezone",
    label: "Timezone",
    value: "Africa/Lagos",
    category: "regional",
    inputType: "select",
    options: [
      "Africa/Lagos",
      "Africa/Nairobi",
      "UTC",
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles",
      "Asia/Dubai",
    ],
    description: "Platform timezone for dates and scheduling.",
  },
  {
    key: "date_format",
    label: "Date Format",
    value: "DD/MM/YYYY",
    category: "regional",
    inputType: "select",
    options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
    description: "How dates are displayed across the platform.",
  },
  // Billing
  {
    key: "free_invoice_slots",
    label: "Free Invoice Slots",
    value: "5",
    category: "billing",
    inputType: "number",
    description:
      "Number of paid invoice receipts each user gets for free before platform fees apply.",
  },
  {
    key: "platform_fee_kobo",
    label: "Platform Fee per Invoice",
    value: "10000",
    category: "billing",
    inputType: "number",
    description:
      "Fee charged (in kobo) per paid invoice beyond the free slots. 10000 kobo = ₦100.",
  },
  {
    key: "max_outstanding_fee_kobo",
    label: "Max Outstanding Fee Threshold",
    value: "50000",
    category: "billing",
    inputType: "number",
    description:
      "Outstanding fee amount (kobo) at which invoice sending is blocked. 50000 = ₦500.",
  },
  // Platform
  {
    key: "app_name",
    label: "App / Brand Name",
    value: "PayTrack",
    category: "platform",
    inputType: "text",
    description: "The name shown in emails and the browser title.",
  },
  {
    key: "support_email",
    label: "Support Email Address",
    value: "support@paytrack.app",
    category: "platform",
    inputType: "text",
    description: "Where support ticket notifications are sent.",
  },
  {
    key: "invoice_due_days",
    label: "Default Invoice Due Days",
    value: "30",
    category: "platform",
    inputType: "number",
    description: "Default payment due period in days when creating a new invoice.",
  },
  {
    key: "max_invoice_items",
    label: "Max Line Items per Invoice",
    value: "50",
    category: "platform",
    inputType: "number",
    description: "Maximum number of line items allowed on a single invoice.",
  },
  {
    key: "email_notifications",
    label: "Email Notifications",
    value: "true",
    category: "platform",
    inputType: "toggle",
    description: "Enable or disable all outgoing email notifications.",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

async function assertSettingsAccess(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile?.isAdmin && profile?.adminRole !== "super_admin")
    throw new Error("Settings management requires Super Admin access");
  return userId;
}

// ── Seed ────────────────────────────────────────────────────────────────────

/** Idempotently seeds default system settings. Called on settings page mount. */
export const initSystemSettings = mutation({
  args: {},
  handler: async (ctx) => {
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .unique();
      if (!existing) {
        await ctx.db.insert("systemSettings", {
          ...setting,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// ── Queries ────────────────────────────────────────────────────────────────

/** Returns all system settings grouped by category. */
export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAdmin && !profile?.adminRole) return null;

    const rows = await ctx.db.query("systemSettings").collect();
    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    }
    return grouped;
  },
});

/** Returns a single setting value by key (public, for use in backend functions). */
export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    return row?.value ?? null;
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

/** Update a single setting value. Super admin only. */
export const updateSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, { key, value }) => {
    const userId = await assertSettingsAccess(ctx);
    const existing = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!existing) throw new Error(`Setting "${key}" not found`);
    await ctx.db.patch(existing._id, { value, updatedAt: Date.now(), updatedBy: userId });
  },
});

/** Bulk-update multiple settings at once. Super admin only. */
export const bulkUpdateSettings = mutation({
  args: {
    updates: v.array(v.object({ key: v.string(), value: v.string() })),
  },
  handler: async (ctx, { updates }) => {
    const userId = await assertSettingsAccess(ctx);
    for (const { key, value } of updates) {
      const existing = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedAt: Date.now(), updatedBy: userId });
      }
    }
  },
});

/** Reset all settings to defaults. Super admin only. */
export const resetAllSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await assertSettingsAccess(ctx);
    for (const setting of DEFAULT_SETTINGS) {
      const existing = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: setting.value,
          updatedAt: Date.now(),
          updatedBy: userId,
        });
      }
    }
  },
});
