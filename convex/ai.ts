import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

type ParsedInvoice = {
  items: { description: string; quantity: number; unitPrice: number }[];
  notes: string;
  daysUntilDue: number;
};

export const parseInvoiceFromText = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }): Promise<ParsedInvoice> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI invoice parsing is not configured");

    const systemPrompt = `You are an invoice assistant for a Nigerian freelancer invoicing tool called PayTrack.
Parse the user's request and return a JSON object with this exact shape:
{
  "items": [{ "description": string, "quantity": number, "unitPrice": number }],
  "notes": string,
  "daysUntilDue": number
}
Rules:
- unitPrice is always in Nigerian Naira (₦), never in kobo
- If the user mentions a total without breakdown, create a single line item
- If a percentage upfront is mentioned (e.g. "50% upfront"), add it as a note
- daysUntilDue defaults to 14 if not specified
- notes should be short payment terms, empty string if none
- Return ONLY valid JSON with no markdown or explanation`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      throw new Error(`AI service error: ${text}`);
    }

    const data = await response.json();
    const content: string = data.content?.[0]?.text ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response — try rephrasing");

    const parsed = JSON.parse(jsonMatch[0]) as ParsedInvoice;
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      throw new Error("AI returned no line items — try being more specific");
    }
    return parsed;
  },
});
