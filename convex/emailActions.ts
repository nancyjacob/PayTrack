"use node";

import nodemailer from "nodemailer";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

function createTransport() {
  const user = process.env.MAILGUN_SMTP_LOGIN;
  const pass = process.env.MAILGUN_SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "[email/smtp] MAILGUN_SMTP_LOGIN and MAILGUN_SMTP_PASSWORD must be set. " +
        "Run: npx convex env set MAILGUN_SMTP_LOGIN <login> && npx convex env set MAILGUN_SMTP_PASSWORD <password>"
    );
  }
  return nodemailer.createTransport({
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
  });
}

export const send = internalAction({
  args: {
    fromAddress: v.string(),
    toAddress: v.string(),
    toName: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
  },
  handler: async (_ctx, args) => {
    const transporter = createTransport();
    await transporter.sendMail({
      from: `PayTrack <${args.fromAddress}>`,
      to: args.toName ? `${args.toName} <${args.toAddress}>` : args.toAddress,
      subject: args.subject,
      html: args.htmlBody,
    });
  },
});
