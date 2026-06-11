import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { fromEmail } from "./lib/email";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    Email({
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const apiKey = process.env.MAILGUN_SMTP_PASSWORD;
        const domain = process.env.MAILGUN_DOMAIN ?? "mg.osigla.com.ng";
        if (!apiKey) throw new Error("[auth/email] MAILGUN_SMTP_PASSWORD is not set");
        const form = new URLSearchParams();
        form.set("from", `PayTrack <${fromEmail()}>`);
        form.set("to", email);
        form.set("subject", "Your PayTrack password reset code");
        form.set(
          "html",
          `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2>Reset your PayTrack password</h2><p>Use the code below to reset your password:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6366f1">${token}</p><p style="color:#6b7280;font-size:13px">This code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p></div>`
        );
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
          throw new Error(`[auth/email] Failed to send code [HTTP ${res.status}]: ${detail}`);
        }
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId, profile }) {
      if (existingUserId !== null) return;
      const email = (profile.email as string | undefined) ?? "";
      const nameFallback = email.split("@")[0] ?? "User";
      await ctx.db.insert("userProfiles", {
        userId,
        businessName: nameFallback,
        ownerName: nameFallback,
        email,
        plan: "free",
        invoiceCount: 0,
        emailVerified: false,
      });
      // Schedule verification email — runs outside this transaction
      await ctx.scheduler.runAfter(0, internal.emailVerification.generateAndSend, {
        userId,
        email,
        ownerName: nameFallback,
      });
    },
  },
});
