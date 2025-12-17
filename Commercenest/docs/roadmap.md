## CommerceNest Roadmap (Living)

Purpose: Keep us aligned on what we're building next, balancing backend foundations with strong, intuitive frontend UI/UX.

Source of truth also includes: `Commercenest/docs/planning_progress.md` and `Commercenest/docs/phase_delivery_process.md`.

### Milestones

| Phase | Status | Objective | Frontend Highlights | Backend/Platform Highlights |
|---|---|---|---|---|
| P0 — Foundations | Complete | Multitenancy, basic modules, payments test-mode | Minimal product/portfolio pages | RLS, schema, tenant resolution, Razorpay test flow |
| P0.7 — Media Rendering | Complete | Images render reliably and performantly | `next/image`, aspect ratios, config for Storage | Remote patterns configured, no code smell |
| P1 — Bluebell Launch | Complete | Production-ready site for Bluebell | Polished Home/PLP/PDP, Cart, Checkout, Portfolio; motion spec; A11y AA; responsive QA; design tokens | Live Razorpay; Admin auth & roles; Storage RLS; SEO/ISR per-tenant; CSRF/rate limits |
| P0.8 — Media Polish (Sub-phase of P1) | Complete | Production-ready media UX | Blur placeholders; error states | Basic CSP; plan for signed URLs |
| **P1.5 — Multi-Tenant Deployment** | **Complete** | **Vercel Pro deployment with both tenants** | **Senlysh & Bluebell live on Vercel** | **Path-based routing, tenant resolution, production DB** |
| P2 — Senlysh E-commerce | **In Progress** | **Fashion e-commerce site for Senlysh** | **Product catalog, cart, checkout, admin panel** | **Fashion-specific attributes, inventory management** |
| P2 — Superadmin & Flags | Planned | Operate tenants safely and toggle features | Superadmin UI; module/status dashboards | Feature flags, tenant overrides, audit |
| P2.5 — Extensibility Foundations | Planned | Safe customizations per tenant | UI hooks for overrides (internal-only) | Plugin registry, contracts, server evaluation |
| P3 — Monitoring & Performance | Planned | SLOs and perf budgets | UX perf diagnostics, loading states | Metrics, alerts, indexing, MV cadence |
| P4 — Integrations Layer | Planned | External adapters, retries | N/A (internal tooling first) | Signed requests, outbox/retry, observability |
| P5 — Domain Automation & Tooling | Planned | Faster tenant onboarding | Superadmin flows for domains | Domain APIs, SSL automation |
| P6 — AI & Core Evolution | Planned | Internal AI assistance & core uplift | Content assist (internal-only UIs) | Vector/RAG isolation, governance |

### P1 — Bluebell Launch: Acceptance Criteria (frontend-inclusive)
- Home/PLP/PDP, Cart, Checkout, Portfolio: consistent visual language, AA contrast, responsive across breakpoints.
- Motion: defined timings/easings; no jank; skeletons for long loads; empty and error states present.
- Design tokens: colors/spacing/typography themed via CSS variables; Indian motif accent tokens applied tastefully.
- Forms: Tailwind forms styling; accessible labels; keyboard navigation.
- SEO: per-tenant meta defaults; `/sitemap.xml` and `/robots.txt` per domain; canonical URLs.
- Core Web Vitals within budget on key pages.
- Admin auth gating; no public exposure of admin routes.

### P1.5 — Multi-Tenant Deployment: Acceptance Criteria
- ✅ Both Senlysh and Bluebell tenants deployed on Vercel Pro
- ✅ Path-based routing working: `/` → Senlysh, `/bluebell` → Bluebell
- ✅ Database connections established with production Supabase
- ✅ Environment variables configured for production
- ✅ Build and deployment process optimized
- ✅ Tenant resolution logic working for both localhost and Vercel

### P2 — Senlysh E-commerce: Acceptance Criteria (frontend-inclusive)
- **Product Catalog**: PLP with fashion filters (size, color, brand), PDP with variant selection
- **Shopping Experience**: Cart functionality, wishlist, product recommendations
- **Checkout Flow**: Razorpay integration, order confirmation, email notifications
- **Admin Panel**: Product management, inventory tracking, order management
- **Mobile Responsive**: Fashion-focused mobile UX with touch-friendly interactions
- **SEO**: Fashion-specific meta tags, structured data, collection pages
- **Performance**: Core Web Vitals optimization for fashion e-commerce

### Notes
- Frontend quality is a gate for phase exit. UI/UX acceptance criteria must pass alongside backend tests.
- New cross-cutting capabilities become phases. Tight, low-risk improvements are sub-phases under the active phase.

### Current Status: Senlysh E-commerce Development

**Completed:**
- ✅ Multi-tenant Vercel deployment
- ✅ Senlysh homepage with fashion design
- ✅ Tenant resolution and routing
- ✅ Database integration

**Next Priority (P2.1): Product Catalog**
1. **Product Listing Page (PLP)**
   - Fashion-specific filters (size, color, brand, price range)
   - Grid/list view options
   - Sorting (newest, price, popularity)
   - Pagination and infinite scroll

2. **Product Detail Page (PDP)**
   - Image gallery with zoom
   - Size/color variant selection
   - Add to cart functionality
   - Product recommendations
   - Reviews and ratings

3. **Database Schema**
   - Fashion product attributes (size, color, material)
   - Inventory tracking
   - Product categories and collections

**Immediate Tasks:**
1. Design and implement PLP component for Senlysh
2. Create PDP component with variant selection
3. Add fashion-specific product data to database
4. Implement cart functionality
5. Test checkout flow with Razorpay

### New Tenant: Senlysh.com (Fashion E‑commerce)

Phases and Sub‑phases (DB‑first, Docs‑first, RLS‑aware):

1) P0 — Tenant Enablement (Infra & Data) ✅ **COMPLETE**
   - Map `senlysh.com` in `tenant_domains` (primary=true)
   - Seed `settings_company_profile` (brand name, accent color, socials)
   - Verify RLS across tenant‑scoped tables
   - Confirm storage convention `products/senlysh/<product_id>/...`

2) P1 — Storefront Foundations ✅ **COMPLETE**
   - `tenants/senlysh/config.ts` with palette/fonts/homepage sections
   - Add resolver case in `src/tenants/index.ts`
   - `tenants/senlysh/SenlyshHome.tsx` (hero, categories, trending, brand strip)
   - SEO defaults: `generateMetadata` canonical by host

3) **P2 — Catalog (PLP/PDP) for Fashion** 🎯 **CURRENT PRIORITY**
   - PLP facets (size, color, brand) via `products.attributes` JSONB or normalized tables
   - PDP variant picker (size/color), wishlist, delivery/pincode check (UI)
   - Shared service uses tenant‑aware filters and pagination

4) P3 — Cart & Checkout (Test Mode)
   - Cart state (client) and server totals validation
   - Razorpay test‑mode order creation and webhook handling per tenant
   - Order confirmation pages and admin orders list

5) P4 — Admin UX
   - Product import/upload flow adapted to fashion attributes
   - Category management for fashion collections
   - Image uploads to Supabase Storage with public URLs in `product_images`

6) P5 — Polish & Growth
   - Performance passes (index advisors on FK columns)
   - E2E tests (PLP facets, PDP variants, checkout)
   - SEO coverage for collections/brands


