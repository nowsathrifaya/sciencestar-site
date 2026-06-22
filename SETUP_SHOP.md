# Setting up the PSLE Worksheet Pack shop — one-time setup

You only need to do this once. After this, the shop works automatically —
no code changes needed to take payments.

---

## 1. Upload the PDFs to Cloudflare R2 (private file storage)

The PDFs must NOT go in your normal site folder — anything there is public.
Instead they go in a private R2 bucket that only the Function can read.

1. In the Cloudflare dashboard, go to **R2** (left sidebar) → **Create bucket**.
   - Name it: `sciencestar-products` (or anything — you'll bind it by name later)
   - Leave it private (default — do not enable public access)
2. Inside the bucket, create a folder structure matching what's in
   `functions/_products.js`. For the PSLE pack, upload:
   - `psle-science-pack/PSLE_Science_2026_1000Q_TEACHER.pdf`
   - `psle-science-pack/PSLE_Science_2026_1000Q_STUDENT.pdf`

   (You can drag-and-drop upload directly in the R2 dashboard UI, or use
   `wrangler r2 object put` from the command line if you prefer.)

   **Important:** the filenames and folder must exactly match the `r2Key`
   values in `functions/_products.js`, or the download Function won't find
   the file.

## 2. Bind the R2 bucket to your Pages project

1. Go to **Workers & Pages** → your `primayscience` project → **Settings** → **Functions**.
2. Scroll to **R2 bucket bindings** → **Add binding**.
   - Variable name: `PRODUCT_FILES`   ← must be exactly this, the code reads `env.PRODUCT_FILES`
   - R2 bucket: select `sciencestar-products` (the one you created above)
3. Save. Do this for both **Production** and **Preview** environments if you
   want to test on preview deploys too.

## 3. Add your Stripe secret key as an environment variable

1. In Stripe dashboard: **Developers** → **API keys**. Copy your **Secret key**
   (starts with `sk_live_...` for real payments, or `sk_test_...` while testing).
2. In Cloudflare: **Workers & Pages** → your project → **Settings** → **Environment variables**.
3. Add:
   - Variable name: `STRIPE_SECRET_KEY`
   - Value: your secret key
   - Mark it as **Encrypted** (Cloudflare will offer this — use it, since this key can charge cards)
4. Also add (optional but recommended):
   - Variable name: `SITE_URL`
   - Value: `https://primayscience.org`  (no trailing slash)

   This makes sure Stripe redirects back to your real domain even if Cloudflare's
   preview URL is different. If you skip this, the code falls back to whatever
   domain the request came from, which works fine for production but can be
   confusing on preview deploys.

5. Save, then **redeploy** the site (env vars only take effect on the next deploy).

## 4. Test it before going live

Stripe gives you a separate set of test keys (also under **Developers → API
keys**, toggle "Test mode" in the top-right of the Stripe dashboard). Use a
`sk_test_...` key in step 3 first, then test the full flow using Stripe's
test card number: **4242 4242 4242 4242**, any future expiry date, any CVC.

Walk through it yourself:
1. Visit `/shop/psle-science-pack/`
2. Click **Buy Now**
3. Pay with the test card
4. Confirm you land on `/shop/success/` and both download buttons work
5. Confirm the downloaded PDFs are correct and not corrupted

Once that works end-to-end, swap `STRIPE_SECRET_KEY` to your **live** secret
key and redeploy. You're now accepting real payments.

## 5. Point your Carousell listing here

Use this as your "where to buy" link in the Carousell listing:

    https://primayscience.org/shop/psle-science-pack/

---

## How it works (for your own understanding)

- **`/shop/psle-science-pack/`** — the sales page. The Buy button calls
  `/api/create-checkout`, which asks Stripe to create a Checkout Session and
  redirects the buyer to Stripe's own secure payment page (you never handle
  card details directly, which also means you don't need PCI compliance work).
- **`/api/create-checkout`** (Cloudflare Pages Function) — creates that Stripe
  session server-side, using your secret key. This key never reaches the browser.
- After payment, Stripe redirects to **`/shop/success/?session_id=...&product=...`**.
- That page calls **`/api/download`**, which re-checks with Stripe directly
  ("was this session_id actually paid, for this product?") before streaming
  the matching PDF from the private R2 bucket. Without a real, paid
  session_id, no file is ever served — so the download links can't be
  shared or guessed to get the pack for free.

## Adding a second product later (e.g. the O-Level Physics pack)

1. Upload its PDF(s) to R2 under a new folder, e.g. `physics-pack/...`
2. Add an entry to `functions/_products.js` — copy the `psle-science-pack`
   block, give it a new key, new name/price/files.
3. Copy `shop/psle-science-pack/index.html` to a new folder under `shop/`,
   change the productId in its `startCheckout()` call to match, update the copy.
4. Add the matching entry to `PRODUCT_FILE_COUNTS` in `shop/success/index.html`'s script.

No changes needed to the Functions themselves — they're already generic.
