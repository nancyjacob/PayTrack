import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/markInvoicePaid",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const result = await ctx.runAction(internal.invoices.processPaystackWebhook, {
      body,
      signature,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

http.route({
  path: "/clearPlatformFee",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const result = await ctx.runAction(internal.billing.processPlatformFeeWebhook, {
      body,
      signature,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Mailgun inbound email webhook — configure in Mailgun dashboard:
// Routes → Forward to: https://<your-convex-url>/inboundEmail
http.route({
  path: "/inboundEmail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const contentType = request.headers.get("content-type") ?? "";

    let from = "";
    let subject = "";
    let body = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      from = formData.get("from")?.toString() ?? "";
      subject = formData.get("subject")?.toString() ?? "";
      body =
        formData.get("stripped-text")?.toString() ||
        formData.get("body-plain")?.toString() ||
        "";
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      from = params.get("from") ?? "";
      subject = params.get("subject") ?? "";
      body =
        params.get("stripped-text") ||
        params.get("body-plain") ||
        "";
    }

    await ctx.runAction(internal.support.processInboundEmail, {
      from,
      subject,
      body,
    });

    return new Response("OK", { status: 200 });
  }),
});

export default http;
