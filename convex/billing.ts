import { query, internalMutation, internalAction } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const getMyBillingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;

    const paidPaymentCount = profile.paidPaymentCount ?? 0;
    const platformFeeOwed = profile.platformFeeOwed ?? 0;
    const freePaymentsLeft = Math.max(0, 5 - paidPaymentCount);

    return { paidPaymentCount, platformFeeOwed, freePaymentsLeft };
  },
});

// Called by processPlatformFeeWebhook once payment is verified
export const clearPlatformFee = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");
    await ctx.db.patch(profile._id, { platformFeeOwed: 0 });
  },
});

// Called by the /clearPlatformFee HTTP route
export const processPlatformFeeWebhook = internalAction({
  args: { body: v.string(), signature: v.string() },
  handler: async (ctx, { body, signature }) => {
    // Validate Paystack HMAC-SHA512 signature
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
        metadata?: { type?: string; userId?: string };
      };
    };

    if (event.event !== "charge.success") return { ok: true };

    const meta = event.data.metadata ?? {};
    if (meta.type !== "platform_fee" || !meta.userId) return { ok: true };

    await ctx.runMutation(internal.billing.clearPlatformFee, {
      userId: meta.userId as Id<"users">,
    });

    return { ok: true };
  },
});
