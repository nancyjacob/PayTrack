import {
  internalMutation,
  internalAction,
  internalQuery,
  mutation,
  action,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { fromEmail } from "./lib/email";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes between resends
const MAX_RESENDS_PER_SESSION = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOtp(): string {
  // Cryptographically secure 6-digit OTP via Web Crypto (available in Convex V8 runtime)
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

// ── Internal mutations ────────────────────────────────────────────────────────

export const upsertToken = internalMutation({
  args: { userId: v.id("users"), email: v.string(), token: v.string() },
  handler: async (ctx, { userId, email, token }) => {
    const existing = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        token,
        email,
        expiresAt: now + TOKEN_TTL_MS,
        failedAttempts: 0,
        lastSentAt: now,
        resendCount: existing.resendCount + 1,
      });
    } else {
      await ctx.db.insert("emailVerificationTokens", {
        userId,
        email,
        token,
        expiresAt: now + TOKEN_TTL_MS,
        failedAttempts: 0,
        lastSentAt: now,
        resendCount: 0,
      });
    }
  },
});

export const markVerified = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, { emailVerified: true });
    }
    // Remove the token record
    const token = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (token) await ctx.db.delete(token._id);
  },
});

export const incrementFailedAttempts = internalMutation({
  args: { tokenId: v.id("emailVerificationTokens") },
  handler: async (ctx, { tokenId }) => {
    const rec = await ctx.db.get(tokenId);
    if (rec) await ctx.db.patch(tokenId, { failedAttempts: rec.failedAttempts + 1 });
  },
});

// ── Internal action: generate OTP + send email ────────────────────────────────

export const generateAndSend = internalAction({
  args: { userId: v.id("users"), email: v.string(), ownerName: v.string() },
  handler: async (ctx, { userId, email, ownerName }) => {
    const otp = generateOtp();
    await ctx.runMutation(internal.emailVerification.upsertToken, { userId, email, token: otp });

    const apiKey = process.env.MAILGUN_SMTP_PASSWORD;
    const domain = process.env.MAILGUN_DOMAIN ?? "mg.osigla.com.ng";
    if (!apiKey) throw new Error("[emailVerification] MAILGUN_SMTP_PASSWORD is not set");

    const html = buildVerificationEmail(ownerName, otp);
    const form = new URLSearchParams();
    form.set("from", `PayTrack <${fromEmail()}>`);
    form.set("to", email);
    form.set("subject", "Verify your PayTrack email address");
    form.set("html", html);
    // Security headers: prevent phishing by adding List-Unsubscribe and X-Mailer
    form.set("h:X-Mailer", "PayTrack/1.0");
    form.set("h:X-Priority", "1");

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`[emailVerification] Failed to send [HTTP ${res.status}]: ${detail}`);
    }
  },
});

// ── Internal action: send welcome email after verification ────────────────────

export const sendWelcomeEmail = internalAction({
  args: { email: v.string(), ownerName: v.string() },
  handler: async (ctx, { email, ownerName }) => {
    const apiKey = process.env.MAILGUN_SMTP_PASSWORD;
    const domain = process.env.MAILGUN_DOMAIN ?? "mg.osigla.com.ng";
    if (!apiKey) return; // Silently skip if not configured

    const html = buildWelcomeEmail(ownerName);
    const form = new URLSearchParams();
    form.set("from", `PayTrack <${fromEmail()}>`);
    form.set("to", email);
    form.set("subject", "Welcome to PayTrack — you're all set!");
    form.set("html", html);
    form.set("h:X-Mailer", "PayTrack/1.0");

    await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  },
});

// ── Public mutation: verify OTP submitted by user ─────────────────────────────

export const verifyEmailToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rec = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!rec) throw new Error("No verification pending. Request a new code.");

    if (Date.now() > rec.expiresAt) {
      await ctx.db.delete(rec._id);
      throw new Error("Code expired. Please request a new one.");
    }

    if (rec.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      throw new Error("Too many failed attempts. Please request a new code.");
    }

    if (rec.token !== token.trim()) {
      await ctx.db.patch(rec._id, { failedAttempts: rec.failedAttempts + 1 });
      const remaining = MAX_FAILED_ATTEMPTS - rec.failedAttempts - 1;
      throw new Error(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please request a new code."
      );
    }

    // Token is valid — mark the user as verified
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    await ctx.db.patch(rec._id, { failedAttempts: 0 }); // clear before scheduling
    await ctx.scheduler.runAfter(0, internal.emailVerification.markVerified, { userId });

    if (profile) {
      await ctx.scheduler.runAfter(0, internal.emailVerification.sendWelcomeEmail, {
        email: profile.email,
        ownerName: profile.ownerName,
      });
    }

    return { success: true };
  },
});

// ── Public action: resend verification code (rate-limited) ────────────────────

export const resendVerification = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Read current token record to enforce rate limits
    const rec = await ctx.runQuery(internal.emailVerification.getTokenRecord, { userId });

    if (rec) {
      const now = Date.now();
      if (now - rec.lastSentAt < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - rec.lastSentAt)) / 1000);
        throw new Error(`Please wait ${waitSec} seconds before requesting another code.`);
      }
      if (rec.resendCount >= MAX_RESENDS_PER_SESSION) {
        throw new Error("Maximum resend limit reached. Please sign in again.");
      }
    }

    // Get email from profile
    const profile = await ctx.runQuery(internal.emailVerification.getProfileForUser, { userId });
    if (!profile) throw new Error("Profile not found");

    await ctx.runAction(internal.emailVerification.generateAndSend, {
      userId,
      email: profile.email,
      ownerName: profile.ownerName,
    });
  },
});

// ── Internal queries (used by actions) ───────────────────────────────────────

export const getTokenRecord = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getProfileForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

// ── Public query: check if current user is verified ──────────────────────────

export const getVerificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { verified: false, hasPendingToken: false };

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const tokenRec = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    return {
      verified: profile?.emailVerified === true,
      // Only true when explicitly set to false (new accounts). Existing accounts
      // that pre-date this feature have emailVerified === undefined and must not
      // be forced through the verification flow.
      needsVerification: profile?.emailVerified === false,
      hasPendingToken: tokenRec !== null,
      email: profile?.email,
    };
  },
});

// ── Email templates ───────────────────────────────────────────────────────────

function buildVerificationEmail(name: string, otp: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);overflow:hidden">
        <!-- Header -->
        <tr><td style="background:#6366f1;padding:28px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">PayTrack</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:600">Hi ${name},</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">
            Please verify your email address to activate your PayTrack account.
            Enter the code below — it expires in <strong>30 minutes</strong>.
          </p>
          <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px">
            <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px">Verification code</p>
            <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:12px;color:#6366f1">${otp}</p>
          </div>
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">
            If you did not create a PayTrack account, you can safely ignore this email.
            Never share this code with anyone — PayTrack staff will never ask for it.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center">
            © ${new Date().getFullYear()} PayTrack · This is an automated message, please do not reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWelcomeEmail(name: string): string {
  const siteUrl = process.env.SITE_URL ?? "https://paytrack.osigla.com.ng";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.1);overflow:hidden">
        <tr><td style="background:#6366f1;padding:28px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">PayTrack</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:700">Welcome aboard, ${name}!</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6">
            Your email has been verified and your PayTrack account is now active.
            You can now create invoices, track payments, and manage clients — all in one place.
          </p>
          <div style="margin:0 0 24px">
            <p style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:600">Get started:</p>
            <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2">
              <li>Complete your business profile in Settings</li>
              <li>Add your first client</li>
              <li>Create and send your first invoice</li>
            </ul>
          </div>
          <a href="${siteUrl}/settings"
             style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
            Complete your profile →
          </a>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center">
            © ${new Date().getFullYear()} PayTrack · You're receiving this because you created an account.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
