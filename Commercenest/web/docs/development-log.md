## 2025-09-01

### Summary
- Scoped Admin to Bluebell tenant (branding, URLs, metadata) and stabilized tenant resolution via headers/cookies.
- Fixed tenant-prefixed admin routes by rewriting `/{tenant}/admin...` to `/admin...` while preserving tenant context.
- Verified Senlysh PDP route uses global `/products/[slug]` with tenant context; resolved 404/hydration locally.
- Completed Bluebell Admin Products CRUD E2E (create, edit/publish, list, detail) with Supabase Storage images.
- Implemented Orders “Mark Paid” API and UI; added minimal Order Details page.
- Added Razorpay webhook endpoint with signature verification (dev fallback if secret not set).
- Cleaned up TypeScript duplication errors in new API routes; lints are clean.

### Changes
- `src/app/(admin)/admin/layout.tsx`: 
  - Added `AdminBrandingWrapper` and tenant key resolution from `x-tenant-admin` or `tenant` cookie.
  - Implemented dynamic `generateMetadata` per tenant (title/icons).
- `src/middleware.ts`:
  - Rewrites `/{tenant}/admin...` → `/admin...` (sets `x-tenant-admin`, `x-pathname`, cookie) to fix admin detail 404s.
  - Preserves existing rewrites for cart/checkout/orders and Senlysh PDP to global routes.
- PDP:
  - Verified `src/app/(site)/products/[slug]/page.tsx` fetches by tenant; Senlysh works via middleware global route.
- Admin Products:
  - Created and published a test product via `Products → New`; verified list/detail/edit flows and Supabase image uploads.
- Admin Orders:
  - `src/app/api/admin/orders/[id]/mark-paid/route.ts`: POST endpoint to update order status to `paid` (tenant-gated, admin-only).
  - `src/app/(admin)/admin/orders/OrderTable.tsx`: Added “Mark Paid” action for pending orders.
  - `src/app/(admin)/admin/orders/[id]/page.tsx`: Minimal order details page.
- Payments / Webhooks:
  - `src/app/api/webhooks/razorpay/route.ts`: Single POST handler that reads raw body, verifies `x-razorpay-signature` when available, and returns `{ ok: true, verified }`. In dev without configured secret, accepts payloads to unblock testing.

### Fixes
- Resolved duplicate import/handler errors:
  - `mark-paid` route: removed duplicate `NextResponse` import and second POST export.
  - Razorpay webhook route: collapsed duplicated imports and second POST into a single implementation.

### Testing (local, browser E2E)
- Admin: Verified Bluebell branding, sidebar links, Products and Categories/Orders pages render and function.
- Products: Created “Test E2E Product”, published; verified in list and detail.
- Orders: Marked a pending order as paid; list refreshed to show `Paid` status.
- Settings → Payments: Page renders with webhook URL and Test/Live fields.

### Guardrails / Notes
- Do not hardcode tenant IDs. Tenant is resolved by middleware header/cookie.
- Host-based tenancy supported via middleware; path-based fallback preserved for staging/local.
- Webhook signature verification is strict in production; dev fallback only when no secret is configured.

### Ready for Staging
- Code compiles and lints clean. You can push current `staging` branch to Vercel.

### Tomorrow’s Plan
1) Connect Bluebell domain to Vercel (DNS + project domain):
   - Add domain in Vercel, configure A/ALIAS/CNAME records per Vercel guidance.
   - Verify production host-based tenancy works end-to-end (middleware host mapping + cookies).
2) Configure Razorpay Test keys on production server:
   - Set Test Key ID/Secret + Webhook Secret in admin settings (or env) and enable Test mode.
   - Trigger test payments; verify Orders create/update; verify webhook events received with valid signature.
3) E2E pass (production):
   - Browse Bluebell catalog, PDP, cart → checkout (sandbox), order creation, mark-paid via webhook.
   - Validate favicon/title/meta and sitemap/robots.

### Open Items / Next Up
- b4: Admin Settings (payments) production config and webhook validation (in progress).
- b5–b12: Bluebell content pages, wishlist toggle, portfolio CMS, image seeding, checkout E2E, SEO, host-based tenancy, final QA.

### Estimate – Bluebell E2E E‑commerce (INR)
- MVP (multi-tenant ready, catalog, PDP, cart/checkout, admin CRUD, Razorpay, basic CMS/SEO): ₹2.5–5.0 lakh.
- Enhanced (advanced theming, richer CMS/portfolio, wishlists, analytics, migrations, automation, QA): ₹6.0–9.0 lakh.
- Ongoing support/ops (monthly): ₹35k–₹75k depending on scope/SLA.



