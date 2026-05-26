export type EmailPayload = {
  fromAddress: string;
  toAddress: string;
  toName: string;
  subject: string;
  htmlBody: string;
};

/** Returns the configured sender address. */
export function fromEmail(): string {
  return process.env.FROM_EMAIL ?? "noreply@paytrack.app";
}

/**
 * Active email sender — currently routes through Resend.
 * To switch to Zoho, replace the body with: return sendEmailZoho(payload);
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  return sendEmailResend(payload);
}

// ── Resend (active) ───────────────────────────────────────────────────────────

async function sendEmailResend(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[email/resend] RESEND_API_KEY is not set — add it via: npx convex env set RESEND_API_KEY <key>"
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.fromAddress,
      to: payload.toAddress,
      subject: payload.subject,
      html: payload.htmlBody,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "(no body)");
    throw new Error(
      `[email/resend] Delivery failed [HTTP ${res.status}] to ${payload.toAddress}: ${detail}`
    );
  }
}

// ── Zoho (reserved for future use) ───────────────────────────────────────────

export async function sendEmailZoho(payload: EmailPayload): Promise<void> {
  const baseUrl = process.env.EMAIL_BASEURL;
  if (!baseUrl) {
    throw new Error(
      "[email/zoho] EMAIL_BASEURL is not set — add it via: npx convex env set EMAIL_BASEURL <url>"
    );
  }

  const res = await fetch(`${baseUrl}/api/ZohoEmail/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "(no body)");
    throw new Error(
      `[email/zoho] Delivery failed [HTTP ${res.status}] to ${payload.toAddress}: ${detail}`
    );
  }
}
