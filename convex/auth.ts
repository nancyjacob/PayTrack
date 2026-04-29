import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    Email({
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.AUTH_RESEND_OTP_EMAIL!,
          to: email,
          subject: "Your PayTrack sign-in code",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto"><h2>Sign in to PayTrack</h2><p>Your one-time code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#6366f1">${token}</p><p style="color:#6b7280;font-size:13px">This code expires in 15 minutes.</p></div>`,
        });
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId, profile }) {
      // Only create profile for brand-new users
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
      });
    },
  },
});
