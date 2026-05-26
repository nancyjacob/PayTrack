import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEmail, fromEmail } from "./lib/email";

const adminRoleValidator = v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("support")
);

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile?.isAdmin && !profile?.adminRole) throw new Error("Unauthorized");
  return userId;
}

async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!profile?.isAdmin && profile?.adminRole !== "super_admin") {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return userId;
}

export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile?.isAdmin === true || profile?.adminRole !== undefined;
  },
});

export const getMyAdminRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile?.isAdmin && !profile?.adminRole) return null;
    return {
      isSuperAdmin: profile.isAdmin === true || profile.adminRole === "super_admin",
      adminRole: profile.adminRole ?? null,
    };
  },
});

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("userProfiles").take(1000);
    const invoices = await ctx.db.query("invoices").take(1000);
    const tickets = await ctx.db.query("supportTickets").take(1000);
    const payments = await ctx.db.query("payments").take(1000);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidInvoices = invoices.filter((i) => i.status === "paid").length;
    const openTickets = tickets.filter((t) => t.status === "open").length;

    return {
      totalUsers: users.length,
      proUsers: users.filter((u) => u.plan === "pro").length,
      totalInvoices: invoices.length,
      paidInvoices,
      totalRevenue,
      openTickets,
    };
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("userProfiles").order("desc").take(100);
  },
});

export const listAllInvoices = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const invoices = await ctx.db.query("invoices").order("desc").take(100);
    const clientIds = [...new Set(invoices.map((i) => i.clientId))];
    const userIds = [...new Set(invoices.map((i) => i.userId))];

    const clients = await Promise.all(clientIds.map((id) => ctx.db.get(id)));
    const profiles = await Promise.all(
      userIds.map((id) =>
        ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", id))
          .unique()
      )
    );

    const clientMap = Object.fromEntries(
      clients.filter(Boolean).map((c) => [c!._id, c!.name])
    );
    const profileMap = Object.fromEntries(
      profiles.filter(Boolean).map((p) => [p!.userId, p!.businessName])
    );

    return invoices.map((inv) => ({
      ...inv,
      clientName: clientMap[inv.clientId] ?? "Unknown",
      businessName: profileMap[inv.userId] ?? "Unknown",
    }));
  },
});

export const listAllTickets = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const tickets = await ctx.db.query("supportTickets").order("desc").take(100);

    const assigneeIds = [
      ...new Set(tickets.flatMap((t) => (t.assignedTo ? [t.assignedTo] : []))),
    ];
    const assigneeProfiles = await Promise.all(
      assigneeIds.map((id) =>
        ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", id))
          .unique()
      )
    );
    const assigneeMap: Record<string, { ownerName: string; email: string }> = {};
    for (const p of assigneeProfiles) {
      if (p) assigneeMap[p.userId as string] = { ownerName: p.ownerName, email: p.email };
    }

    return tickets.map((ticket) => ({
      ...ticket,
      assigneeName: ticket.assignedTo
        ? (assigneeMap[ticket.assignedTo as string]?.ownerName ?? null)
        : null,
      assigneeEmail: ticket.assignedTo
        ? (assigneeMap[ticket.assignedTo as string]?.email ?? null)
        : null,
    }));
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved")
    ),
  },
  handler: async (ctx, { ticketId, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(ticketId, { status });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    assignedTo: v.union(v.id("users"), v.null()),
  },
  handler: async (ctx, { ticketId, assignedTo }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(ticketId, { assignedTo: assignedTo ?? undefined });
  },
});

export const toggleUserPlan = mutation({
  args: {
    profileId: v.id("userProfiles"),
    plan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { profileId, plan }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(profileId, { plan });
  },
});

export const setAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const profiles = await ctx.db.query("userProfiles").take(200);
    const profile = profiles.find((p) => p.email === email);
    if (!profile) throw new Error(`No profile found for email: ${email}`);
    await ctx.db.patch(profile._id, { isAdmin: true });
    return { success: true, profileId: profile._id };
  },
});

// ── Admin Role Management ───────────────────────────────────────────────────

export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("userProfiles").take(500);
    return profiles
      .filter((p) => p.isAdmin === true || p.adminRole !== undefined)
      .map((p) => ({
        _id: p._id,
        _creationTime: p._creationTime,
        userId: p.userId,
        businessName: p.businessName,
        ownerName: p.ownerName,
        email: p.email,
        isAdmin: p.isAdmin ?? false,
        adminRole: p.adminRole ?? null,
        isSuperAdmin: p.isAdmin === true || p.adminRole === "super_admin",
      }));
  },
});

export const createInvitationRecord = internalMutation({
  args: {
    email: v.string(),
    role: adminRoleValidator,
  },
  handler: async (ctx, { email, role }) => {
    const invitedBy = await requireSuperAdmin(ctx);

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingProfile?.isAdmin || existingProfile?.adminRole) {
      throw new Error("This user already has admin access");
    }

    const existingInvite = await ctx.db
      .query("adminInvitations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (
      existingInvite?.status === "pending" &&
      existingInvite.expiresAt > Date.now()
    ) {
      throw new Error("A pending invitation already exists for this email");
    }

    const token = crypto.randomUUID();
    const invitationId = await ctx.db.insert("adminInvitations", {
      email,
      role,
      invitedBy,
      token,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return { invitationId, token };
  },
});

export const inviteAdmin = action({
  args: {
    email: v.string(),
    role: adminRoleValidator,
  },
  handler: async (ctx, { email, role }) => {
    const { token } = await ctx.runMutation(
      internal.admin.createInvitationRecord,
      { email, role }
    );

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${appUrl}/admin/accept-invite?token=${token}`;
    const roleLabel =
      role === "super_admin"
        ? "Super Admin"
        : role === "admin"
          ? "Admin"
          : "Support Agent";

    await sendEmail({
      fromAddress: fromEmail(),
      toAddress: email,
      toName: email,
      subject: `You've been invited as ${roleLabel} on PayTrack`,
      htmlBody: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#111">Admin Invitation</h2>
          <p>You've been invited to join the PayTrack admin team as a <strong>${roleLabel}</strong>.</p>
          <p style="margin:24px 0">
            <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">
              Accept Invitation
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px">
            This invitation expires in 7 days. You can create your account directly on the invitation page.
          </p>
        </div>
      `,
    });
  },
});


export const listPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.db
      .query("adminInvitations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(50);
  },
});

export const getInvitationByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const invitation = await ctx.db
      .query("adminInvitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invitation) return null;
    return {
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      isExpired:
        invitation.expiresAt < Date.now() || invitation.status !== "pending",
    };
  },
});

export const acceptAdminInvitation = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invitation = await ctx.db
      .query("adminInvitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) throw new Error("Invalid invitation link");
    if (invitation.status === "accepted")
      throw new Error("This invitation has already been used");
    if (invitation.status === "expired" || invitation.expiresAt < Date.now()) {
      if (invitation.status === "pending") {
        await ctx.db.patch(invitation._id, { status: "expired" });
      }
      throw new Error("This invitation has expired");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Please complete your account setup first");

    if (profile.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error(
        `This invitation was sent to ${invitation.email}. Please sign in with that account.`
      );
    }

    await ctx.db.patch(profile._id, { adminRole: invitation.role });
    await ctx.db.patch(invitation._id, { status: "accepted" });

    return { role: invitation.role };
  },
});

export const revokeAdminInvitation = mutation({
  args: { invitationId: v.id("adminInvitations") },
  handler: async (ctx, { invitationId }) => {
    await requireSuperAdmin(ctx);
    await ctx.db.patch(invitationId, { status: "expired" });
  },
});

export const updateAdminRole = mutation({
  args: {
    profileId: v.id("userProfiles"),
    role: adminRoleValidator,
  },
  handler: async (ctx, { profileId, role }) => {
    await requireSuperAdmin(ctx);
    await ctx.db.patch(profileId, { adminRole: role });
  },
});

export const revokeAdmin = mutation({
  args: { profileId: v.id("userProfiles") },
  handler: async (ctx, { profileId }) => {
    const myId = await requireSuperAdmin(ctx);
    const profile = await ctx.db.get(profileId);
    if (!profile) throw new Error("Profile not found");
    if (profile.userId === myId)
      throw new Error("You cannot revoke your own admin access");
    await ctx.db.patch(profileId, { isAdmin: undefined, adminRole: undefined });
  },
});

export const getAnalyticsData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [invoices, payments, profiles, tickets] = await Promise.all([
      ctx.db.query("invoices").take(1000),
      ctx.db.query("payments").take(1000),
      ctx.db.query("userProfiles").take(1000),
      ctx.db.query("supportTickets").take(1000),
    ]);

    // ── Invoice status counts ─────────────────────────────
    const invoicesByStatus = {
      draft: 0, sent: 0, paid: 0, overdue: 0,
    };
    let invoiceTotalValue = 0;
    for (const inv of invoices) {
      invoicesByStatus[inv.status]++;
      invoiceTotalValue += inv.total;
    }
    const collectionRate = invoices.length
      ? Math.round((invoicesByStatus.paid / invoices.length) * 100)
      : 0;
    const avgInvoiceValue = invoices.length
      ? Math.round(invoiceTotalValue / invoices.length)
      : 0;

    // ── Ticket status counts ──────────────────────────────
    const ticketsByStatus = { open: 0, in_progress: 0, resolved: 0 };
    for (const t of tickets) {
      if (t.status === "open") ticketsByStatus.open++;
      else if (t.status === "in_progress") ticketsByStatus.in_progress++;
      else if (t.status === "resolved") ticketsByStatus.resolved++;
    }
    const ticketResolutionRate = tickets.length
      ? Math.round((ticketsByStatus.resolved / tickets.length) * 100)
      : 0;

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

    // ── Monthly helpers ───────────────────────────────────
    function monthKey(ts: number) {
      const d = new Date(ts);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    function monthLabel(key: string) {
      const [y, m] = key.split("-");
      return new Date(Number(y), Number(m) - 1).toLocaleString("en", { month: "short" });
    }
    const last6: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      last6.push(monthKey(d.getTime()));
    }

    // ── Monthly revenue ───────────────────────────────────
    const revenueByMonth: Record<string, number> = Object.fromEntries(last6.map(m => [m, 0]));
    for (const p of payments) {
      const k = monthKey(p.paidAt);
      if (k in revenueByMonth) revenueByMonth[k] += p.amount;
    }
    const monthlyRevenue = last6.map(m => ({ month: monthLabel(m), revenue: revenueByMonth[m] }));

    // ── Monthly signups ───────────────────────────────────
    const signupsByMonth: Record<string, number> = Object.fromEntries(last6.map(m => [m, 0]));
    for (const p of profiles) {
      const k = monthKey(p._creationTime);
      if (k in signupsByMonth) signupsByMonth[k]++;
    }
    const monthlySignups = last6.map(m => ({ month: monthLabel(m), users: signupsByMonth[m] }));

    // ── Monthly invoices created ──────────────────────────
    const invoicesByMonth: Record<string, number> = Object.fromEntries(last6.map(m => [m, 0]));
    for (const inv of invoices) {
      const k = monthKey(inv.createdAt);
      if (k in invoicesByMonth) invoicesByMonth[k]++;
    }
    const monthlyInvoices = last6.map(m => ({ month: monthLabel(m), invoices: invoicesByMonth[m] }));

    // ── Payment channels ──────────────────────────────────
    const channelMap: Record<string, { count: number; amount: number }> = {};
    for (const p of payments) {
      const ch = p.channel ?? "other";
      if (!channelMap[ch]) channelMap[ch] = { count: 0, amount: 0 };
      channelMap[ch].count++;
      channelMap[ch].amount += p.amount;
    }
    const paymentChannels = Object.entries(channelMap)
      .map(([channel, d]) => ({ channel, ...d }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalRevenue,
      avgInvoiceValue,
      collectionRate,
      ticketResolutionRate,
      invoicesByStatus,
      ticketsByStatus,
      monthlyRevenue,
      monthlySignups,
      monthlyInvoices,
      paymentChannels,
      totalUsers: profiles.length,
      proUsers: profiles.filter(p => p.plan === "pro").length,
      totalInvoices: invoices.length,
      totalPayments: payments.length,
    };
  },
});

export const revokeInvitationByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const invitation = await ctx.db
      .query("adminInvitations")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (!invitation) throw new Error(`No invitation found for ${email}`);
    if (invitation.status !== "pending")
      throw new Error(`Invitation for ${email} is already ${invitation.status}`);
    await ctx.db.patch(invitation._id, { status: "expired" });
    return { revoked: invitation._id, email };
  },
});
