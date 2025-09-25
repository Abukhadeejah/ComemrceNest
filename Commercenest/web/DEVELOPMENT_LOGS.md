## 2025-09-01

### Summary
- Scoped Admin to Bluebell tenant and stabilized tenant resolution via headers/cookies.
- Rewrote `/{tenant}/admin...` → `/admin...` with `x-tenant-admin` to fix detail 404s.
- Verified Senlysh PDP via global `/products/[slug]`; fixed local 404/hydration.
- Completed Bluebell Admin Products CRUD E2E with Supabase Storage images.
- Implemented Orders “Mark Paid” API + UI; minimal Order Details page.
- Added Razorpay webhook endpoint with signature verification (strict in prod; dev fallback).
- TypeScript lint cleanup in new API routes.

### Bluebell UX Updates
- Implemented hero auto-rotating 3-slide carousel using royalty-free stock images.
- Added site pages: Shipping, Returns, Size Guide, and FAQ.
- Linked new pages in Bluebell `Header` and `Footer`. Later removed Size Guide (Bluebell-only removal) and kept FAQ link only in Footer per tenant policy.
- Made header active underline dynamic using current route; underline now moves on navigation for desktop and mobile.

### Testing
- Bluebell Admin branding/UX verified; Products and Orders flows tested locally.
- Created and published a test product; list/detail/edit OK.
- Marked a pending order as paid; list updated to `Paid`.
- Settings → Payments renders; webhook URL displayed.
 - Verified nav links for Shipping/Returns/Size Guide/FAQ and page render without errors.
 - Verified dynamic underline highlights correct nav item across Bluebell pages.

### Portfolio (Dynamic from backend)
- Listing: `/{tenant}/portfolio` now uses `fetchPublishedProjects(tenantId)` and links each card to `/{tenant}/portfolio/[slug]`.
- Detail: Added `src/app/(site)/bluebell/portfolio/[slug]/page.tsx` using `fetchProjectBySlug(tenantId, slug)` and renders hero + gallery.
- Gallery: Added `fetchProjectImages(tenantId, projectId)` and detail page renders images from `portfolio_images`.
- Schema integration in code: services select `description` and `location`; admin create form accepts and saves these fields.
- Admin UX: `admin/portfolio` shows location/description preview in list; upload sets first hero image if none.

### Supabase MCP / Schema Notes
- Supabase MCP not connected in this session, so live schema verification is pending.
- On connect, verify `portfolio_projects` has `description text`, `location text`. If missing, add them and revalidate cache tags.

### Tomorrow
- Connect Bluebell domain to Vercel and verify host-based tenancy.
- Configure Razorpay Test keys + webhook secret on prod; test payments E2E.
- Production E2E pass (catalog → PDP → cart → checkout → order → webhook).

### Estimates (INR)
- MVP e-commerce: ₹2.5–5.0 L
- Enhanced: ₹6.0–9.0 L
- Monthly support: ₹35k–₹75k


