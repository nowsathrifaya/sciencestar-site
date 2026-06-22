// functions/api/create-checkout.js
//
// POST /api/create-checkout  { productId: "psle-science-pack" }
// → { url: "https://checkout.stripe.com/..." }
//
// Requires environment variables (set in Cloudflare Pages dashboard,
// see SETUP.md):
//   STRIPE_SECRET_KEY   — starts with sk_live_ or sk_test_
//   SITE_URL            — e.g. https://primayscience.org  (no trailing slash)

import { PRODUCTS } from "../_products.js";

export async function onRequestPost(context) {
  // Everything is wrapped in a try/catch so that ANY unexpected error
  // (a bad Stripe response, a missing env var, a network hiccup) still
  // returns valid JSON with a readable message — instead of Cloudflare's
  // own generic error page, which is HTML and causes the frontend's
  // `JSON.parse()` to fail with "Unexpected end of JSON input".
  try {
    const { request, env } = context;

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request body", 400);
    }

    const productId = body && body.productId;
    const product = PRODUCTS[productId];
    if (!product) {
      return jsonError("Unknown product", 400);
    }

    if (!env.STRIPE_SECRET_KEY) {
      return jsonError(
        "Payment is not configured yet (missing STRIPE_SECRET_KEY). Please contact us.",
        500
      );
    }

    const siteUrl = env.SITE_URL || new URL(request.url).origin;

    // Stripe's API accepts standard form-encoded POST bodies — no SDK needed,
    // which keeps this Function small and dependency-free.
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${siteUrl}/shop/success/?session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(productId)}`);
    params.set("cancel_url", `${siteUrl}/shop/${encodeURIComponent(productId)}/`);
    params.set("line_items[0][price_data][currency]", product.currency);
    params.set("line_items[0][price_data][product_data][name]", product.name);
    params.set("line_items[0][price_data][product_data][description]", product.description);
    params.set("line_items[0][price_data][unit_amount]", String(product.priceSGD));
    params.set("line_items[0][quantity]", "1");
    params.set("metadata[productId]", productId);
    // Ask Stripe to collect the buyer's email so we can show/send a receipt
    // and so the success page can confirm "sent to your email" if you later
    // add email delivery too.
    params.set("customer_creation", "if_required");

    let stripeRes;
    try {
      stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });
    } catch (networkErr) {
      console.error("Network error calling Stripe:", networkErr);
      return jsonError("Could not reach Stripe. Please try again in a moment.", 502);
    }

    let data;
    try {
      data = await stripeRes.json();
    } catch (parseErr) {
      const raw = await stripeRes.text().catch(() => "");
      console.error("Stripe returned non-JSON response:", stripeRes.status, raw);
      return jsonError("Stripe returned an unexpected response. Please try again.", 502);
    }

    if (!stripeRes.ok) {
      console.error("Stripe error:", data);
      return jsonError(data.error && data.error.message ? data.error.message : "Could not start checkout", 500);
    }

    return new Response(JSON.stringify({ url: data.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Unhandled error in create-checkout:", err);
    return jsonError("Something went wrong starting checkout. Please try again or contact us.", 500);
  }
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
