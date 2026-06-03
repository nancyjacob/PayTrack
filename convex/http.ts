import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Single Paystack webhook endpoint — handles both invoice payments and platform fees.
// Register this one URL in your Paystack dashboard:
//   https://fleet-panda-254.convex.cloud/paystack
http.route({
  path: "/paystack",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const result = await ctx.runAction(internal.webhooks.processPaystackWebhook, {
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
