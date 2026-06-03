import { mutation, query } from "./_generated/server";
import { type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Constants ──────────────────────────────────────────────────────────────

export const RESOURCES = [
  "overview",
  "analytics",
  "users",
  "invoices",
  "support",
  "roles",
  "settings",
] as const;

export const ACTIONS = ["view", "create", "edit", "delete"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

const ROLE_VALIDATOR = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("support")
);

/** Default permissions seeded on first run. */
const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  super_admin: {
    overview:  ["view", "create", "edit", "delete"],
    analytics: ["view", "create", "edit", "delete"],
    users:     ["view", "create", "edit", "delete"],
    invoices:  ["view", "create", "edit", "delete"],
    support:   ["view", "create", "edit", "delete"],
    roles:     ["view", "create", "edit", "delete"],
    settings:  ["view", "create", "edit", "delete"],
  },
  admin: {
    overview:  ["view"],
    analytics: ["view"],
    users:     ["view", "create", "edit"],
    invoices:  ["view"],
    support:   ["view", "create", "edit", "delete"],
    roles:     [],
    settings:  [],
  },
  support: {
    overview:  ["view"],
    analytics: [],
    users:     [],
    invoices:  ["view"],
    support:   ["view", "create", "edit"],
    roles:     [],
    settings:  [],
  },
};

// ── Seed / Init ────────────────────────────────────────────────────────────

/**
 * Idempotently seeds default permissions.
 * Only inserts rows that don't exist yet — never overwrites custom permissions.
 * Called on every admin layout mount, safe to run repeatedly.
 */
export const initDefaultPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    for (const [role, resources] of Object.entries(DEFAULT_PERMISSIONS)) {
      for (const [resource, actions] of Object.entries(resources)) {
        const existing = await ctx.db
          .query("rolePermissions")
          .withIndex("by_role_resource", (q) =>
            q
              .eq("role", role as "super_admin" | "admin" | "support")
              .eq("resource", resource)
          )
          .unique();
        if (!existing) {
          await ctx.db.insert("rolePermissions", {
            role: role as "super_admin" | "admin" | "support",
            resource,
            actions,
          });
        }
      }
    }
  },
});

// ── Queries ────────────────────────────────────────────────────────────────

/** Returns the permission map for the current user's role. */
export const getMyPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;

    const isSuperAdmin =
      profile.isAdmin === true || profile.adminRole === "super_admin";
    const role = profile.adminRole ?? (profile.isAdmin ? "super_admin" : null);
    if (!role) return null;

    const rows = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role", (q) =>
        q.eq("role", role as "super_admin" | "admin" | "support")
      )
      .collect();

    const permMap: Record<string, string[]> = {};
    for (const row of rows) {
      permMap[row.resource] = row.actions;
    }

    return { role, isSuperAdmin, permissions: permMap };
  },
});

/** Returns all role permissions grouped by role. Super admin only. */
export const getAllRolePermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAdmin && profile?.adminRole !== "super_admin") return null;

    const rows = await ctx.db.query("rolePermissions").collect();

    const grouped: Record<string, Record<string, string[]>> = {};
    for (const row of rows) {
      if (!grouped[row.role]) grouped[row.role] = {};
      grouped[row.role][row.resource] = row.actions;
    }
    return grouped;
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────

/** Update the actions for a specific role+resource. Super admin only. */
export const updateRolePermissions = mutation({
  args: {
    role: ROLE_VALIDATOR,
    resource: v.string(),
    actions: v.array(v.string()),
  },
  handler: async (ctx, { role, resource, actions }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAdmin && profile?.adminRole !== "super_admin")
      throw new Error("Super admin access required");

    if (role === "super_admin")
      throw new Error("Super admin permissions cannot be modified");

    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role_resource", (q) =>
        q.eq("role", role).eq("resource", resource)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { actions });
    } else {
      await ctx.db.insert("rolePermissions", { role, resource, actions });
    }
  },
});

/** Reset a role's permissions to defaults. Super admin only. */
export const resetRoleToDefaults = mutation({
  args: { role: ROLE_VALIDATOR },
  handler: async (ctx, { role }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAdmin && profile?.adminRole !== "super_admin")
      throw new Error("Super admin access required");

    if (role === "super_admin")
      throw new Error("Super admin permissions cannot be reset");

    const defaults = DEFAULT_PERMISSIONS[role];
    for (const [resource, actions] of Object.entries(defaults)) {
      const existing = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role_resource", (q) =>
          q.eq("role", role).eq("resource", resource)
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { actions });
      } else {
        await ctx.db.insert("rolePermissions", { role, resource, actions });
      }
    }
  },
});
