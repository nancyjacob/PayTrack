export type EmailPayload = {
  fromAddress: string;
  toAddress: string;
  toName: string;
  subject: string;
  htmlBody: string;
};

/** Returns the configured sender address. */
export function fromEmail(): string {
  return process.env.FROM_EMAIL ?? "paytrack@mg.osigla.com.ng";
}
