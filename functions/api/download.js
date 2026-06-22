// functions/api/download.js
//
// GET /api/download?session_id=cs_test_...&product=psle-science-pack&file=0
//
// Verifies with Stripe that this checkout session was actually paid for
// THIS product, then streams the matching PDF from the private R2 bucket.
// Nothing here is guessable — without a real, paid session_id from Stripe,
// no file is served.
//
// Requires environment variables (see SETUP.md):
//   STRIPE_SECRET_KEY
// Requires an R2 bucket binding named PRODUCT_FILES (see SETUP.md).

import { PRODUCTS } from "../_products.js";

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    const productId = url.searchParams.get("product");
    const fileIndex = parseInt(url.searchParams.get("file") || "0", 10);

    if (!sessionId || !productId) {
      return textError("Missing session_id or product.", 400);
    }

    const product = PRODUCTS[productId];
    if (!product) {
      return textError("Unknown product.", 404);
    }

    const file = product.files[fileIndex];
    if (!file) {
      return textError("Unknown file for this product.", 404);
    }

    if (!env.STRIPE_SECRET_KEY) {
      return textError("Payment verification is not configured (missing STRIPE_SECRET_KEY).", 500);
    }

    // Verify the session with Stripe directly — never trust query params alone.
    let verifyRes;
    try {
      verifyRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
        { headers: { "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}` } }
      );
    } catch (networkErr) {
      console.error("Network error verifying with Stripe:", networkErr);
      return textError("Could not reach Stripe to verify your purchase. Please try again shortly.", 502);
    }

    if (!verifyRes.ok) {
      const raw = await verifyRes.text().catch(() => "");
      console.error("Stripe verify failed:", verifyRes.status, raw);
      return textError("Could not verify your purchase. Please contact support with your order email.", 402);
    }

    let session;
    try {
      session = await verifyRes.json();
    } catch (parseErr) {
      console.error("Stripe returned non-JSON for session verify:", parseErr);
      return textError("Stripe returned an unexpected response while verifying. Please try again.", 502);
    }

    const paid = session.payment_status === "paid";
    const matchesProduct = session.metadata && session.metadata.productId === productId;

    if (!paid || !matchesProduct) {
      return textError("This link is not valid for a completed purchase of this product.", 402);
    }

    if (!env.PRODUCT_FILES) {
      return textError("File storage is not configured (missing PRODUCT_FILES R2 binding).", 500);
    }

    let object;
    try {
      object = await env.PRODUCT_FILES.get(file.r2Key);
    } catch (r2Err) {
      console.error("R2 read error:", r2Err);
      return textError("Could not read the file from storage. Please contact support — your payment is safe.", 500);
    }

    if (!object) {
      return textError("File not found. Please contact support — your payment is safe.", 500);
    }

    const filename = file.r2Key.split("/").pop();

    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (err) {
    console.error("Unhandled error in download:", err);
    return textError("Something went wrong preparing your download. Please contact support — your payment is safe.", 500);
  }
}

function textError(message, status) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain" }
  });
}
