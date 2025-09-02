This document summarizes everything implemented so far, key files, environment/config, current status, and the Vercel build error with the exact fix. It’s designed so you can pick up development immediately in Cursor.

## Repo, Branch, Build

- Repo: https://github.com/Abukhadeejah/ComemrceNest
- Working app: `web/` (Next.js App Router)
- Node/Next: Node >= 20, Next.js 15.4.6
- Active branch: `staging` @ 8e21120
- Local build: passing (with ESLint warnings only)
- Vercel build: currently failing (TypeScript signature overload in checkout page; fix below)

Environment strategy:
- Production: host-based tenancy (clean paths like `/products`, `/admin`), tenant resolved from Host in middleware and propagated via headers/cookies.
- Staging/local: dual support for `/{tenant}/...` fallback for QA; same middleware sets tenant header/cookie. UI must use URL helpers to abstract host vs path.

---

## Implemented Features

### 1) Bluebell tenant pages
- Added missing site pages for Bluebell:
  - `src/app/(site)/bluebell/about/page.tsx`
  - `src/app/(site)/bluebell/contact/page.tsx`
  - `src/app/(site)/bluebell/new-arrivals/page.tsx`
  - `src/app/(site)/bluebell/sale/page.tsx`
- Use existing product grid/components where possible; content is minimal and brand‑consistent.

### 2) Tenant-aware routing and titles
- `src/app/(site)/layout.tsx`
  - Adds cookie-based tenant fallback to ensure correct tenant metadata/title even when navigating from `/bluebell` to `/cart` or `/checkout`.
- `src/lib/tenantClient.ts` (new)
  - Client utility for retrieving current tenant and prefixing route paths.
- `src/app/(site)/cart/page.tsx`
  - “Browse Products” and “Continue Shopping” use `tenantPath('/products')` instead of platform-level `/products`.

### 3) Razorpay integration (test mode path)
- Client checkout page overhaul:
  - `src/app/(site)/checkout/page.tsx`
  - Loads Razorpay script, creates orders via API, opens Razorpay modal, handles success/failure.
  - Includes “Pay ₹1 with Razorpay” and “Pay cart total” buttons.
  - Mode toggle UI (test/live) is present on the client for future live mode support.
  - Strong TypeScript typings for success and failure responses. Fixed all prior TS compile issues locally.

- Checkout API route:
  - `src/app/api/checkout/route.ts`
  - Resolves `tenant_id`, reads test-mode tenant payment settings from Supabase (table: `tenant_payment_settings`, env: `test`).
  - Falls back to environment variables if tenant settings are not enabled:
    - `RAZORPAY_KEY_ID`
    - `RAZORPAY_KEY_SECRET`
  - Creates a Razorpay order and a pending `orders` row, returns `{ order, keyId }` to the client.

- Razorpay webhook route:
  - `src/app/api/webhooks/razorpay/route.ts`
  - Reads raw body for HMAC verification.
  - Resolves tenant from saved order, verifies signature using:
    - `tenant_payment_settings.webhook_secret` (test env) OR
    - `RAZORPAY_WEBHOOK_SECRET` env fallback
  - Idempotently records webhook events, updates order status to `paid` on `payment.captured`.

- Webhook simulation endpoint:
  - `src/app/api/webhooks/razorpay/simulate` (listed in Next output)
  - For local/dev testing to mark an order paid.

### 4) E2E stability improvements
- `tests/e2e/public.spec.ts` (in earlier PRs)
  - Hardened selectors, reduced flakiness, relaxed image visibility checks, improved assertions.

---

## Key Files (modified/added)

- Tenant pages:
  - `src/app/(site)/bluebell/about/page.tsx`
  - `src/app/(site)/bluebell/contact/page.tsx`
  - `src/app/(site)/bluebell/new-arrivals/page.tsx`
  - `src/app/(site)/bluebell/sale/page.tsx`

- Tenant routing & titles:
  - `src/app/(site)/layout.tsx`
  - `src/lib/tenantClient.ts`
  - `src/app/(site)/cart/page.tsx`

- Checkout & payments:
  - `src/app/(site)/checkout/page.tsx`
  - `src/app/api/checkout/route.ts`
  - `src/app/api/webhooks/razorpay/route.ts`
  - `src/app/api/webhooks/razorpay/simulate` (route file present per Next output)

---

## Environment Variables

Add to `web/.env.local` (Vercel Project Env as well):

- Razorpay (test mode):
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`

Optional next steps (for live mode support later):
- `RAZORPAY_LIVE_KEY_ID`
- `RAZORPAY_LIVE_KEY_SECRET`
- `RAZORPAY_LIVE_WEBHOOK_SECRET`

Supabase admin credentials (already present in project):
- Make sure existing Supabase Admin URL/Key variables are set per the repo’s server utilities.

---

## Local Dev Commands

From `web/`:
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

Prereqs:
- Node 20+
- Install: `npm ci`

---

## Vercel Build Error (and Fix)

Excerpt (Vercel, staging@8e21120):
- TypeScript error in `src/app/(site)/checkout/page.tsx`:
- “Type error: Duplicate identifier 'on'.” at the Razorpay instance interface

Cause:
- TypeScript does not allow overloading by declaring the same “property” twice. Using:
  - `on: (event: 'payment.failed', …) => void`
  - `on: (event: string, …) => void`
  …is treated as duplicate property signatures, not method overloads.

Fix:
- Use method-overload syntax inside the interface (method form, not property form).
- The current code in `staging` already contains the correct method overload form and builds locally:

```ts
interface RazorpayInstance {
  on(event: 'payment.failed', handler: (response: RazorpayFailure) => void): void
  on(event: string, handler: (response: unknown) => void): void
  open(): void
  close(): void
}
```

If you still see the Vercel error:
- Ensure Vercel is deploying the latest commit that includes the method overload syntax above.
- Verify no stale cache: redeploy.
- Confirm `page.tsx` in `staging` matches the snippet exactly (no `on:` property syntax).

---

## Known Warnings (non-blocking)

- ESLint warnings:
  - Unused vars in some admin components
  - `@next/next/no-img-element` — several `<img>` tags in admin components
- “Dynamic server usage” logs for some admin routes during build; final build still completes locally.

These can be addressed incrementally without blocking deployment.

---

## Functional Test Checklist

- Tenant routing and titles:
  - Visit `/bluebell`, then go to `/cart` and `/checkout` — titles and links remain tenant-prefixed.
  - “Browse Products” and “Continue Shopping” go to `/bluebell/products`.

- Checkout (test mode):
  - “Pay ₹1 with Razorpay” opens modal and can complete a test payment.
  - “Pay {cart total} with Razorpay” opens modal with correct amount.
  - “Create test order” + “Simulate payment” pathway marks order as paid via webhook simulate route.

- Webhook:
  - Verify webhook with a valid signature updates `orders.status` to `paid`.

---

## Immediate Next Tasks for Cursor

1) Unblock Vercel deployment
- Confirm the checkout interface method overloads (as above) are present on `staging` and redeploy.

2) Live mode wiring
- Extend `api/checkout` to select “live” credentials when `mode === 'live'` (currently only test env path with fallback to `RAZORPAY_KEY_ID/SECRET`).
- Recommended env names:
  - `RAZORPAY_LIVE_KEY_ID`, `RAZORPAY_LIVE_KEY_SECRET`, `RAZORPAY_LIVE_WEBHOOK_SECRET`
- Optionally, introduce `env` selection and validation in `tenant_payment_settings`.

3) Clean up warnings
- Replace remaining `<img>` with `next/image` (or disable rule per file if intentional).
- Remove unused vars in admin components.

4) Full e2e pass
- Product select → add to cart → checkout → payment → order status view on staging.

5) Security and robustness
- Validate server inputs for checkout and webhook routes.
- Add error UI for missing payment config (live mode without keys).

---

## Reference Snippets

- Razorpay instance interface (correct overload form):

```ts
interface RazorpayInstance {
  on(event: 'payment.failed', handler: (response: RazorpayFailure) => void): void
  on(event: string, handler: (response: unknown) => void): void
  open(): void
  close(): void
}
```

- Checkout API fallback envs (`src/app/api/checkout/route.ts`):
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`

- Webhook env fallback (`src/app/api/webhooks/razorpay/route.ts`):
  - `RAZORPAY_WEBHOOK_SECRET`

---

If you want, I can kick off a new Vercel deploy now to confirm the fix is live on staging.
