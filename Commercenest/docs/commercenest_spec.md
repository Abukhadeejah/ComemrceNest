## CommerceNest — Technical Specification and Implementation Plan

Status: Draft (DB-first; code conforms to existing schema)

### 1) Vision and Invisible SaaS Principles
- Deliver white-labeled, bespoke-feeling e-commerce sites where clients never encounter a “SaaS” UI.
- All design, theming, layout, and UX customizations are executed internally by our team; no builders, themes, or toggles are exposed to clients.
- Strict tenant data isolation, invite-only access, and tenant-branded domains only.

### 2) Core Stack
- Frontend: Next.js 14 (App Router, TypeScript), Tailwind CSS, Framer Motion.
- Backend: Supabase (Postgres, Auth, Storage, RLS), Razorpay (India), server route handlers.
- State: Local UI state (Zustand) for the cart; server actions/route handlers for all mutations.
- SEO: next-seo, next-sitemap; images via Supabase Storage (public buckets + signed originals when needed).

### 3) Multi-Tenancy, Domains, and Data Isolation
- Tenant identification: HTTP Host header → `tenant_domains.hostname` → `tenant_id`.
- Domain types: platform subdomains (e.g., `bluebell.commercenest.app`) and custom domains (e.g., `bluebellinteriors.in`).
- Data isolation model:
  - All content tables include `tenant_id`.
  - RLS enforces per-tenant access.
  - Public pages are rendered server-side with explicit `tenant_id` filters (service role) to eliminate cross-tenant leakage.
  - Authenticated pages use Supabase Auth with RLS through membership in `tenant_members`.

### 4) Routing, Middleware, and Tenant Context
- `middleware.ts`:
  - Extract `hostname`; resolve `tenant_id` from `tenant_domains`.
  - On success: attach a signed, short-lived tenant cookie; continue the request.
  - Unknown/blocked: render a branded fallback (see Error Handling).
- `app/layout.tsx`:
  - Server-reads tenant context; hydrates Theme and SEO defaults via `settings_company_profile`.
- Caching and tags:
  - Revalidate by tenant-aware tags (e.g., `tenant:${tenant_id}:products`).
- Components live in `src/components` (not in `app`). Providers (Supabase Auth, Theme) wrap in `app/layout.tsx`.

#### 4.1) Tenant Resolution Precedence and Active-Tenant Model
- Always resolve `tenant` from the HTTP Host header on every request; treat any tenant cookie as a non-authoritative hint for UX only.
- If a user belongs to multiple tenants, the active tenant is strictly the one derived from Host; deny cross-tenant access even if the user is a member elsewhere.
- Admin deep links and all route handlers must re-validate tenant context from Host before serving content.

### 5) Modules and Features
- E-commerce: products, categories, PDP, cart, checkout, orders, stock.
- Interior design portfolio: projects and galleries; featured on the homepage.
- CMS: legal and basic content pages.
- Settings: `settings_company_profile` holds business profile and brand tokens (no hardcoded brand data).
- Payments: Razorpay orders, checkout, webhooks; updates `orders.status`.

### 6) Tenant Admin (Client Scope)
- Clients CAN manage:
  - Catalog (products, categories, inventory, pricing, publish/draft).
  - Portfolio (projects, images).
  - Orders (view, status updates; refunds via internal ops workflow).
  - Business profile (non-design fields): address, phone, email, GSTIN, social links.
  - CMS pages (legal/basic content).
- Clients CANNOT access:
  - Themes, templates, design/layout, animations, or component libraries.
  - Domain settings, billing plans, feature flags, or user management beyond their tenant scope.
- UX safeguards:
  - No navigation/copy referencing “themes”, “design”, “appearance”, or “builder”.
  - Clear sections: Catalog, Portfolio, Orders, Content, Settings (business info only).

### 7) Superadmin (Platform Team)
- Features:
  - Tenants CRUD; domain management (provisioning, verification, SSL lifecycle).
  - Member invites and roles per tenant.
  - Billing/plan and feature flags per tenant.
  - Analytics dashboards (usage, sales roll-ups), health checks.
  - Audit trail of sensitive actions.
- Access: `superadmin` role; separate admin domain preferred.

### 7.1) Feature Flags and Tenant-Specific Overrides (Superadmin-Controlled)
-
#### 7.1.1) Flag Keys (foundational)
- `analytics_collection`: enable event collection per tenant (default off until policy confirmed).
- `analytics_export`: allow export/warehouse sync for a tenant (default off).
- `ai_insights`: enable AI insights surfaces in Superadmin (default off; internal-only).
- `module_*` flags: per-module enablement/variants (e.g., `module_discounts_v2`).
### 7.2) Modular Admin Dashboards
- Module-aware navigation: Tenant Admin sees only modules enabled for their tenant; Superadmin sees full module set with lifecycle controls.
- Per-module admin screens: each module ships its own admin routes, UI components, and server handlers. Navigation is assembled at runtime from the enabled module registry for the tenant.
- Superadmin controls: enable/disable modules per tenant, assign module versions, edit module-specific configuration, and manage overrides—all audited and guarded by RBAC. Both navigation and route handlers must check `tenant_modules.enabled`; return 404 for disabled modules.

- Feature flags:
  - Superadmin-only toggles to enable/disable capabilities or select variants at tenant scope; evaluated on the server.
  - No client-exposed toggles to preserve Invisible SaaS.
- Tenant overrides:
  - Scoped overrides for flows (e.g., checkout steps, order approval gates, fulfillment rules) set per tenant with validation against supported variants.
  - All changes audited; immediate rollback via kill switch.
- Evaluation order: platform defaults → plan-level flags → tenant overrides → request context allowlists.

### 8) Payments (Per-Tenant Razorpay)
- Modes:
  - Tenant-as-merchant (preferred): each tenant uses its own Razorpay account and keys.
  - Platform-as-merchant (fallback): platform default keys only if contracts/compliance allow; per-tenant override supported.
- Data model:
  - `tenant_payment_settings` with fields: `tenant_id uuid` (FK), `env enum('test','live')`, `enabled boolean`, `razorpay_key_id text`, `razorpay_key_secret (encrypted)`, `webhook_secret (encrypted)`, `capture_mode enum('auto','manual')`, `test_mode boolean`, `last_verified_at timestamptz`. Unique `(tenant_id, env)`.
  - Secrets are encrypted at rest (pgcrypto or external KMS). Never exposed via client queries.
- Checkout:
  - Order create uses the current tenant’s payment settings; `receipt` includes `<tenant_id>:<order_id>`; `notes` include `{ tenant_id }`.
  - The client may receive `key_id`; all secrets remain server-side.
- Webhook:
  - Verify signature using the specific tenant’s `webhook_secret` retrieved via `orders.tenant_id`.
  - Update `orders.status` safely; rate limit and log per tenant.
- Admin UX:
  - Superadmin (or delegated tenant_admin, if allowed) can set/rotate keys; masked display; “Test connection”; audit log on changes.

#### 8.1) Webhooks: Integrity and Idempotency
- Verify HMAC signature with the per-tenant webhook secret; reject if missing or invalid.
- Idempotency: store processed event IDs with TTL; ignore duplicates; use `receipt` and `razorpay_order_id` to correlate safely.
- Replay protection: apply a short acceptance window and check event timestamps; verify source IP ranges where feasible.
- Rate limit webhooks per tenant; alert on repeated failures; ensure handlers are idempotent by design.

### 9) Security
- Auth: Supabase Auth; invite-only access; no public signup.
- RLS helpers: `is_tenant_member(tenant_id)`, `is_tenant_editor(tenant_id)`, `is_tenant_admin(tenant_id)`.
- Example policies (WITH CHECK explicitly included):
  ```sql
  create policy "Tenant read products"
    on public.products for select
    using (public.is_tenant_member(tenant_id));

  create policy "Tenant insert products"
    on public.products for insert
    with check (public.is_tenant_editor(tenant_id));

  create policy "Tenant update products"
    on public.products for update
    using (public.is_tenant_editor(tenant_id))
    with check (public.is_tenant_editor(tenant_id));
  ```
- Public data: strictly fetched via server/service role with explicit `tenant_id` and status filters; avoid anon client reads to eliminate cross-tenant risk.
- CSRF: Double Submit Cookie (SameSite=Strict), per-session token, strict Origin/Referer validation against tenant domain, and a custom header on JSON POST.
- Rate limiting and bot protection: edge/middleware rate limiting per IP+hostname; stricter on write APIs and webhooks; hCaptcha/Turnstile + honeypot + server risk scoring for forms.
- Session/Origin: bind session to `tenant_id`; strict CSP; HSTS per domain.
- Audit logging: append-only `audit_logs` (actor, role, tenant_id, action, resource, before/after JSON, IP, UA, timestamp); alerts on domain edits, role changes, billing events.

#### 9.1) Per-Tenant Secrets Management
- Encryption: use envelope encryption. Prefer external KMS for data keys; alternatively use `pgcrypto` with `pgp_sym_encrypt` and a KMS-managed passphrase.
- Access: only service-role or trusted server routes may read decrypted secrets; Tenant Admin UI shows masked values only.
- Rotation: support key rotation with dual-read window; audit all changes; store `last_verified_at` after a successful live verification.

#### 9.2) Storage Isolation
- Use per-tenant object prefixes (e.g., `public/product-images/${tenant_id}/...`).
- Storage policies restrict read to published content and write/list to admins within the same `tenant_id`.
- Avoid cross-tenant listing exposure by disallowing unscoped list operations.

### 10) Error Handling and Unknown-Domain UX
- Unknown host: render a neutral, platform-agnostic “Site unavailable” page with a “Contact Support” CTA; avoid tenant branding to prevent implied affiliation.
- Verification/SSL pending: render a branded status page noting DNS/SSL propagation; provide a retry link and support CTA.
- Suspended/Maintenance: maintenance page with optional ETA; preserve tenant brand if available.
- All events logged with a correlation ID; soft rate limit repeated offenders by IP.

### 11) Monitoring, Logging, and Alerts
- Error monitoring: Sentry for frontend/server; tag with `tenant_id`, `hostname`, `route`.
- Session replay (optional for Admin): LogRocket/Replay with strict PII scrubbing.
- Alerts: spikes in 4xx/5xx by tenant; webhook retries exceeding thresholds; order/payment mismatches; anomalous order velocity/AOV; domain SSL expiry; cache invalidation storms.
- DB telemetry: query errors/slow queries by tenant; RLS violations.
- Web Vitals: LCP, TTFB, CLS, INP captured per tenant.

#### 11.1) Per-Module SLOs and Dashboards
- Track error rate, latency, and throughput per module and tenant; define SLOs (e.g., checkout p95 < 500ms, error rate < 1%).
- Alert on regressions after flag flips or module upgrades; annotate dashboards with deployment/flag-change events.

#### 11.2) Analytics & AI Foundations (Plan Now, Build Later)
- Event capture: standardize event contracts with `tenant_id`, `module_key`, `actor`, `correlation_id`, `payload`.
- Observability tags: ensure logs/traces include `tenant_id` and `module_key` everywhere.
- Privacy & governance: define PII handling, retention windows, export policy per tenant; AI retrieval must never cross tenants.
- RAG constraints: if vector search is added, vectors must be partitioned by `tenant_id` with RLS-like enforcement.
- Superadmin metrics: plan card surfaces for sales funnels, latency, error budgets, anomaly flags; gated by flags above.

### 12) Performance and Scaling
- Indexing:
  - Composite: `(tenant_id, slug)`; `(tenant_id, status, updated_at DESC)` for listing queries.
  - Partial: published-only on `products`/`portfolio_projects`.
  - Orders: `(tenant_id, created_at DESC) INCLUDE (status, total_cents)`.
  - Search: `GIN` on `to_tsvector(...)` scoped per-tenant.
  - JSONB: `GIN` on `cms_pages.content`.
- Query strategy: keyset pagination `(created_at, id)`; avoid OFFSET for large datasets; consider materialized views for daily sales per tenant with scheduled refresh or event-driven invalidation.
- Caching/ISR: tenant-aware tags; defaults—home 60–120s, catalog 120–300s, legal 24h; override by per-tenant “update cadence” in `settings_company_profile`.
- Scale path: begin with single deployment; add read replicas; split services (orders, catalog, cms) as needed; queue webhooks/events; edge cache hot pages.

### 12.1) Extensibility and Customization Architecture
- Design principles:
  - Core modules expose stable, typed interfaces and lifecycle hooks.
  - Extension points enable per-tenant customization without forking the core.
  - All custom logic executes within tenant boundaries and honors RLS and auth.
- Extension points (examples):
  - Catalog: pricing resolver, availability/stock resolver, product eligibility filter.
  - Cart/Checkout: discount/offer engine, address validation, payment pre-checks, post-payment fulfillment hook.
  - Orders: allocation/fulfillment routing, notification templating, invoice generation.
  - CMS: content transformation pipeline, SEO enrichment hook.
- Implementation layer options:
  - Internal plugin modules (MVP): TypeScript modules under a plugins registry implementing typed interfaces; selected per tenant via flags/overrides.
  - External microservice adapters (Phase 2+): HTTP adapters with signed requests (HMAC/JWT) and strict timeouts; circuit breaker and retry policies.
  - Edge Functions (Supabase) for latency-sensitive hooks where appropriate.
  - Clarification: modules represent core domains (long-lived, schema-bound, versioned with migrations). Plugins are extension implementations that conform to module-defined interfaces and can vary per tenant.
- Isolation and safety:
  - Strict timeouts (e.g., 800–1500ms) on plugin calls; fallback to default behavior on timeout/error; log with correlation IDs.
  - Read-only inputs to plugins unless mutation is explicitly allowed via a safe API surface.
  - Deterministic outputs validated against JSON Schemas to prevent unsafe effects.
  - Quotas and concurrency caps per tenant for plugin execution; require idempotency tokens for mutating hooks.

### 12.2) Managed Custom Development Workflow
- Intake: capture client requirements as tickets referencing tenant, business goals, and desired flow changes.
- Design: propose solution using existing extension points or define new interfaces when justified.
- Build: implement as tenant-scoped plugin/module or external adapter; keep custom code separate from core while leveraging shared infra.
- Validate: contract tests + shadow mode (non-prod) → canary to staff → full rollout via flag.
- Operate: monitor with Sentry and custom alerts; fall back to default on errors/timeouts; document and audit all changes.

### 12.3) Reliability and Fallback Strategy for Extensions
- Circuit breakers and bounded retries on external adapters.
- Default-path fallbacks on plugin errors/timeouts to maintain core flow continuity.
- Per-tenant kill switches to disable problematic extensions instantly.

### 12.4) Frontend Modularity
- Directory hierarchy (component-driven):
  - `src/components/ui/*` — reusable primitives (buttons, inputs, sheets, dialogs).
  - `src/components/patterns/*` — composite UI patterns (cards, galleries, tables).
  - `src/templates/*` — curated page templates assembled internally; not exposed to clients.
  - `src/layouts/*` — site and admin layouts; apply tenant-aware theming and SEO.
  - `src/modules/<moduleKey>/components/*` — module-specific components (e.g., `products/ProductCard`).
  - `app/(site)/*` — public routes; pages consume module components and server data.
  - `app/(admin)/admin/*` — admin routes, assembled from enabled modules per tenant.
- Theming with Tailwind:
  - CSS variables sourced from `settings_company_profile`; Tailwind variants (e.g., `data-tenant="..."`) allow subtle per-tenant overrides applied internally.
  - No client-exposed theme switches; overrides controlled by internal deploys/flags.
- Feature-based routing:
  - Pages import module server loaders and render module components; all data fetching is server-side and scoped by `tenant_id`.

### 12.5) Backend and Data Layer Modularity
- Schema by module: tables/functions grouped conceptually per module (products, orders, portfolio, cms). Migrations named with module prefixes (e.g., `products_*.sql`).
- Supabase functions per module: SQL functions encapsulate business logic (e.g., `products_get_by_slug(tenant_id, slug)`).
- Server/Edge layer per module:
  - Route handlers under `app/api/<moduleKey>/*` and server modules under `src/server/modules/<moduleKey>/*` (service, repository, validators, types).
  - Edge Functions for module hooks that benefit from proximity to clients or third parties.
- RLS everywhere: tables include `tenant_id`; policies reference shared helper functions.
- Module flags/config: enable/disable entire modules or switch variants via feature flags and `tenant_modules` (see DB additions) without code changes for other tenants.

### 12.6) Notifications and Email per Tenant
- Add `tenant_email_settings` or store ESP credentials in `tenant_integration_secrets`; templates are customizable per tenant and rendered server-side.
- Sign outbound webhooks to ESPs; audit all send attempts and failures; apply rate limits per tenant.

### 12.7) Localization and Currency
- Store default currency and locale per tenant; support currency on orders/items and price display.
- Add tax profile abstraction per tenant for future multi-region support; scope invoice numbering per tenant.

### 13) Database Schema (Overview)
Note: DB-first policy. Review existing schema before applying migrations; code must conform to the database as-is.

- Tenancy and Domains
  - `tenants` (id uuid pk, name text, status enum, created_at timestamptz)
  - `tenant_domains` (id uuid pk, tenant_id fk, hostname text unique, is_primary boolean, ssl_status enum, created_at timestamptz)
  - `tenant_members` (user_id fk auth.users, tenant_id fk, role enum: tenant_admin|tenant_editor, created_at timestamptz)
- Payment
  - `tenant_payment_settings` (see Payments section) with encrypted secrets; unique `(tenant_id, env)`.
- Audit
  - `audit_logs` (id, actor_user_id, role, tenant_id, action, resource, before_json, after_json, ip, ua, created_at)
- Content (extend with `tenant_id`):
  - `categories`, `products`, `product_images`, `product_categories`, `portfolio_projects`, `portfolio_images`, `orders`, `order_items`, `cms_pages`, `settings_company_profile`.
- RLS helpers and policies implemented for all content tables; orders insert/update limited to service role; tenant admins can read/update order status for their tenant.

#### 13.1) Data Model Additions for Customizations
- Feature flags
  - `feature_flags` (id, key text unique, description, created_at)
  - `tenant_feature_flags` (tenant_id, flag_id, variant text, enabled boolean, rollout jsonb, updated_at) — unique `(tenant_id, flag_id)`; server-side evaluation only.
- Flow overrides
  - `tenant_flow_overrides` (id, tenant_id, flow_key text, plugin_key text, version text, config jsonb, enabled boolean, updated_at)
    - Example `flow_key`: `checkout.discount_engine`, `order.fulfillment_router`.
- Plugin registry
  - `plugin_registry` (plugin_key text pk, interface_key text, version text, checksum text, status enum('active','deprecated'), metadata jsonb)
    - Maps `plugin_key` to a known interface/version for safe binding.
- Integration secrets
  - `tenant_integration_secrets` (id, tenant_id, integration_key text, secret_enc bytea, metadata jsonb, updated_at) — encrypted at rest; masked in UIs; service-role access.
- Event outbox (optional, Phase 2)
  - `integration_outbox` (id, tenant_id, event_key, payload jsonb, status enum('pending','sent','failed'), attempts, next_retry_at, created_at)
    - For reliable plugin/microservice delivery.

#### 13.2) Data Model Additions for Modularity
- Module registry
  - `module_registry` (module_key text pk, version text, status enum('active','deprecated'), description text, metadata jsonb)
    - Tracks core/platform modules (products, orders, portfolio, cms, payments).
- Tenant module enablement
  - `tenant_modules` (tenant_id, module_key, version text, enabled boolean, config jsonb, updated_at)
    - Unique `(tenant_id, module_key)`; governs module visibility, config, and version pin per tenant.

#### 13.4) Proposed Analytics Tables (Future Migration; not applied now)
- `analytics_events` (id, tenant_id, module_key, event_key, actor_user_id, route, correlation_id, payload jsonb, created_at)
  - Append-only; indexed on `(tenant_id, created_at desc)` and `(tenant_id, event_key, created_at desc)`.
  - PII minimization guidelines; payload schema versioning.
- `analytics_snapshots` (id, tenant_id, snapshot_key, period_start, period_end, data jsonb, created_at)
  - Optional precomputed aggregates for fast dashboards.
- Vector/RAG (optional, future): `ai_vectors` (id, tenant_id, doc_id, chunk, embedding vector, meta jsonb, created_at)
  - Enforce strict tenant isolation; consider external vector DB if needed; no client access.

#### 13.3) RLS Policies for Modular Tables (Illustrative)
```sql
-- Enable RLS
alter table public.tenant_modules enable row level security;
alter table public.tenant_feature_flags enable row level security;
alter table public.tenant_flow_overrides enable row level security;
alter table public.tenant_integration_secrets enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.feature_flags enable row level security;
alter table public.plugin_registry enable row level security;
alter table public.module_registry enable row level security;

-- Tenant-scoped tables
create policy "Tenant read/write modules" on public.tenant_modules
  for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy "Tenant read/write flags" on public.tenant_feature_flags
  for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy "Tenant read/write overrides" on public.tenant_flow_overrides
  for all using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy "Secrets server-only" on public.tenant_integration_secrets
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Outbox server-only" on public.integration_outbox
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Global registries: superadmin only
create policy "Flags superadmin" on public.feature_flags for all
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Plugins superadmin" on public.plugin_registry for all
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));

create policy "Modules superadmin" on public.module_registry for all
  using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'));
```

### 14) Frontend Architecture and Theming
- Next.js App Router with server components; all public data fetched on the server with explicit `tenant_id` filters.
- Tenant context in `app/layout.tsx` to propagate theme tokens and SEO defaults.
- Theming via `settings_company_profile` brand tokens; subtle Indian motifs as appropriate for premium brands.
- Framer Motion for polished transitions; respect reduced-motion preferences.

### 14.1) Tenant-Specific Overrides in UI

### 14.2) Component-Driven Design System

### 14.3) SEO, Sitemaps, and Canonicals per Tenant
- Generate `sitemap.xml` and `robots.txt` per tenant domain; ensure canonical tags reflect the active host.
- Disallow cross-domain indexing; validate structured data per tenant brand and locale.
- Internal-only design system composed of UI primitives and patterns; developers assemble bespoke experiences rapidly by composing these building blocks.
- Tokens from `settings_company_profile` drive colors, spacing, and typography via CSS variables and Tailwind config; per-tenant adjustments are shipped internally.

- Server-side evaluation of flags/overrides determines UI behavior; components consume derived policies and never expose toggles to end-users.
- Examples: customized discount banners, modified checkout step order, or extra approval step for select tenants.

### 15) Deployment and Domain Provisioning
- Vercel: add domain via API/UI; CNAME to Vercel target; auto SSL; persist status to `tenant_domains.ssl_status`.
- Heroku: `heroku domains:add`; `heroku certs:auto:enable`; track SSL status in DB.
- DNS (Cloudflare/Route53): prefer API-driven verification; document manual fallback steps.
- Config model: global env for platform services; per-tenant config in DB tables (encrypted) for payment and feature toggles; no per-tenant env files.
- Golden rule: run dev locally, fix TypeScript/lint errors, ensure green flows before deploy.

### 16) Dependency and Version Hygiene
- Pin exact versions in `package.json` (avoid ^ and ~); commit lockfile; CI uses `npm ci`.
- Automated PRs via Renovate/Dependabot with CI checks; security scanning and license checks enabled.

### 17) Testing and QA
- Unit tests for RLS helper SQL (pgTAP or API-level) and server handlers.
- Policy tests: positive/negative cases across roles and tenants.
- E2E (Playwright): public pages, Tenant Admin CRUD, checkout happy path, webhook handling.
- Load tests: catalog listing, cart operations, checkout creation per tenant.

### 18) Migration Plan (Phase 0)
- Create `tenants`, `tenant_domains`, `tenant_members`; seed first tenant (Bluebell).
- Add `tenant_id` to content tables; backfill Bluebell `tenant_id`; enforce FK + NOT NULL.
- Create RLS helpers and policies; enable RLS on all content tables; ensure orders are server-only for writes.
- Add `tenant_payment_settings`; store/verify Razorpay credentials per tenant; create audit trails.
- Map domains (staging + production) and verify SSL.
-- Seed baseline enablement for first tenant: insert `tenant_modules` (products, orders, portfolio, cms), initialize `tenant_feature_flags`, and configure `tenant_payment_settings`.

### 19) Bluebell as First Tenant
- Apply Bluebell IA and branding; payments via Razorpay per spec.
- Backfill all Bluebell data with `tenant_id`.
- No hardcoded brand data; `settings_company_profile` drives tokens and contact info.

### 20) Roadmap and Milestones
- P0 Foundations: multi-tenancy schema, middleware, server data fetching, RLS/roles, unknown-domain pages.
- P1 Bluebell Tenant: routes, catalog, portfolio, cart/checkout, webhook, admin CRUD.
- P2 Superadmin: tenants, domains, billing/flags, analytics, audit logs.
- P2.5 Extensibility Foundations: feature flags/tables, plugin registry, tenant flow overrides, server evaluation library, admin UX for flags/overrides.
- P3 Performance/Monitoring: indexing, materialized views, Sentry, anomaly alerts, circuit breakers and fallbacks for extensions.
- P4 Custom Integration Layer (Phase 2): external adapters/microservices with signed requests, outbox/retry, observability; onboard first managed custom projects.
- P5 Domain automation and internal customization tooling.
- P6 AI-assisted content/design workflows (internal-only) and backporting of common customizations into core.

### 20.1) Modular Implementation Roadmap
- M0: Establish module boundaries and interfaces (products, orders, portfolio, cms); add `module_registry` and `tenant_modules` tables; bootstrap module-aware Admin nav.
- M1: Modular frontend: directory structure, design system, templates, layouts; refactor pages to consume module loaders and components.
- M2: Modular backend: split server modules by domain; add per-module SQL functions; route handlers grouped by module; RLS policy tests per module.
- M3: Feature flags and overrides: server evaluation library; admin UX to toggle modules/variants per tenant; kill switches.
- M4: Customization layer (plugins): typed interfaces, plugin registry, flow overrides; contract tests and fallbacks.
- M5: External integration adapters (Phase 2): microservices, signed requests, outbox/retry; observability.
- Continuous: refactoring sprints to keep module seams clean, improve contracts, and backport common customizations into core.

### 24) Source Code Organization (Modular)
```
app/
  (site)/
    page.tsx
    products/
    portfolio/
    ...
  (admin)/
    admin/
      page.tsx
      products/
      orders/
      ...
  api/
    products/
    orders/
    portfolio/
src/
  components/
    ui/
    patterns/
  layouts/
  templates/
  modules/
    products/
      components/
      loaders/
      types.ts
    orders/
    portfolio/
  server/
    modules/
      products/
        service.ts
        repository.ts
        validators.ts
      orders/
      portfolio/
  design/
  styles/
supabase/
  migrations/
    products_*.sql
    orders_*.sql
    portfolio_*.sql
  functions/
    products/*
    orders/*
```

### 25) Architecture Diagram (High-Level)
```mermaid
flowchart LR
  subgraph Client
    A[Browser
    Tenant Domain]
  end

  subgraph Frontend (Next.js)
    B[Middleware: host -> tenant]
    C[Server Components & Routes]
    D[Design System & Components]
    E[Module Components]
  end

  subgraph Backend
    F[Server Modules per domain]
    G[API Route Handlers]
    H[Plugin Layer (internal/external adapters)]
  end

  subgraph Supabase
    I[(Postgres + RLS)]
    J[Storage]
    K[Auth]
    L[SQL Functions per module]
  end

  A --> B --> C --> E
  D --> E
  E --> G --> F --> I
  C --> F
  H --> G
  F --> L --> I
  K --> F
  J -. images .- C
```

### 21) Environment Variables (Global)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Razorpay (platform defaults; per-tenant overrides live in DB)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_SITE_URL=
# Integrations
INTEGRATIONS_SIGNING_SECRET=
```

### 22) Documentation and Communication
- Client-facing onboarding: what’s included (catalog, portfolio, orders), responsibilities, SLAs, support channels; no theme/builder UI by design (bespoke service).
- Internal runbooks: tenant onboarding, domain/SSL provisioning, payments troubleshooting, RLS debugging, cache/ISR invalidation playbook.
- Change management: internal intake → design/customization → staging preview on tenant subdomain → client approval → production release; all actions audited.

### 23) Open Decisions
- Whether tenant_admins can manage their own Razorpay keys or only Superadmin.
- Domain automation provider preference (Vercel/Heroku primary?) and DNS provider (Cloudflare/Route53).
- Adoption timeline for tenant-scoped public JWTs (Phase 2) vs continued server-only public reads.
- Plugin distribution model: internal modules vs separate repo/packages; strategy to avoid clutter while keeping deploys simple.
- Extension points to prioritize for MVP (pricing, checkout discounts, fulfillment hooks).

# CommerceNest Technical Specification

## 1. Business Model & Architecture

### 1.1) Business Model: Two-Tier Solution Architecture

CommerceNest operates on a **two-tier business model** that caters to different market segments:

#### **Tier 1: Generic UI Solution (Lower Cost)**
- **Target Market**: Budget-conscious businesses, startups, small retailers
- **Pricing**: Lower cost tier for basic e-commerce needs
- **Features**:
  - Standardized UI components and layouts
  - Basic branding customization (logo, primary colors)
  - Shared design patterns and templates
  - Limited customization options
  - Standard admin interface
- **Technical Implementation**: Uses default registry components (`src/components/tenant/Default*.tsx`)
- **Onboarding**: Quick setup with minimal customization

#### **Tier 2: Complete Branded UI Solution (Premium Cost)**
- **Target Market**: Premium brands, established businesses, luxury retailers
- **Pricing**: Premium cost tier for full customization
- **Features**:
  - Fully customized headers, footers, and layouts
  - Unique welcome banners and branding elements
  - Custom color schemes, typography, and design systems
  - Exclusive design elements and animations
  - Advanced admin branding and customization
  - Dedicated design consultation
- **Technical Implementation**: Uses tenant-specific registry components (`src/tenants/{tenant}/components/*.tsx`)
- **Onboarding**: Full design consultation and custom development

#### **Current Tenant Classification**
- **Bluebell Interiors**: Tier 2 (Premium) - Complete branded UI with custom interior design focus
- **Senlysh Fashion**: Tier 2 (Premium) - Complete branded UI with custom fashion focus

#### **Business Benefits**
1. **Market Segmentation**: Caters to different budget levels and customization needs
2. **Scalable Revenue**: Higher margins on premium tier, volume on basic tier
3. **Flexible Onboarding**: Quick setup for basic needs, comprehensive for premium
4. **Technical Efficiency**: Shared infrastructure with tiered customization

### 1.2) Multi-Tenant Architecture Overview

CommerceNest is built on a **registry-based multi-tenant architecture** that enables:

- **Plug-and-Play Tenant Onboarding**: New tenants can be added without code changes
- **Dynamic Component Loading**: Tenant-specific UI components loaded at runtime
- **Isolated Data & Branding**: Each tenant operates independently
- **Scalable Infrastructure**: Shared platform with tenant-specific customization

### 1.3) Technical Architecture

#### **Core Components**
- **Registry System**: Central mapping of tenant keys to component loaders
- **Middleware**: Tenant detection and request routing
- **Server-Side Resolution**: Dynamic component loading with caching
- **Component Contracts**: Type-safe interfaces for all tenant components

#### **Component Architecture**
```
Registry Entry = {
  header: ComponentLoader      # Custom header with welcome banner
  footer: ComponentLoader      # Custom footer
  layout: ComponentLoader      # Custom layout wrapper
  home: ComponentLoader        # Custom homepage
  metadata: MetadataLoader     # SEO and page metadata
  adminBranding: AdminBrandingLoader  # Admin panel branding
  welcomeBanner: ComponentLoader      # Welcome banner (if separate)
}
```

## 2. Tenant Implementation Patterns

### 2.1) Welcome Banner Implementation

**Current Pattern**: Welcome banners are **embedded within Header components**, not separate components
- **Location**: `src/tenants/{tenant}/components/Header.tsx`
- **Style**: Marquee running from right to left
- **Height**: Minimal height (not large colorful banners)
- **Background**: Tenant-specific gradient (Blue for Bluebell, Pink/Purple for Senlysh)

**Why This Pattern Works**:
- Maintains existing working structure
- Avoids component duplication
- Ensures consistent positioning
- Simplifies maintenance

### 2.2) Component Organization

#### **Tenant-Specific Components (Tier 2)**
```
src/tenants/{tenant}/components/
├── Header.tsx         # Custom header with embedded welcome banner
├── Footer.tsx         # Custom footer
├── Layout.tsx         # Custom layout wrapper
├── Home.tsx           # Custom homepage
├── Metadata.tsx       # SEO metadata
├── AdminBranding.tsx  # Admin panel branding
└── WelcomeBanner.tsx  # (Unused - banner embedded in Header)
```

#### **Default Components (Tier 1)**
```
src/components/tenant/
├── DefaultHeader.tsx          # Generic header
├── DefaultFooter.tsx          # Generic footer
├── DefaultLayout.tsx          # Generic layout
├── DefaultHome.tsx            # Generic homepage
├── DefaultMetadata.tsx        # Generic metadata
├── DefaultAdminBranding.tsx   # Generic admin branding
└── DefaultWelcomeBanner.tsx   # Generic welcome banner
```

## 3. Development Guidelines

### 3.1) What NOT to Change

**Working Components (DO NOT MODIFY)**:
1. **Bluebell Header**: Contains working welcome banner
2. **Senlysh Header**: Contains working welcome banner
3. **Registry Structure**: Current mapping works perfectly
4. **Tenant Resolution**: Middleware and resolver working correctly
5. **Component Contracts**: Type definitions are stable

### 3.2) Avoid These Mistakes

- ❌ Don't create separate welcome banner components
- ❌ Don't modify existing working headers
- ❌ Don't change registry structure unnecessarily
- ❌ Don't add large colorful banners
- ❌ Don't break existing tenant isolation

### 3.3) Best Practices

- ✅ Preserve working code - don't fix what isn't broken
- ✅ Understand existing structure before modifying
- ✅ Test incrementally with Browser MCP
- ✅ Align with business model requirements
- ✅ Use registry for component loading
- ✅ Document architectural decisions

## 4. Future Development

### 4.1) Adding New Tenants

#### **Tier 1 Tenant (Generic UI)**
1. No code changes required
2. Uses default registry components
3. Basic branding via configuration
4. Quick onboarding process

#### **Tier 2 Tenant (Premium UI)**
1. Create tenant folder: `src/tenants/{new-tenant}/`
2. Implement custom components
3. Add to registry mapping
4. Configure tenant-specific branding
5. Full design consultation and development

### 4.2) Scaling Considerations

- **Performance**: Registry caching for component loading
- **Maintenance**: Shared infrastructure with tenant isolation
- **Customization**: Tiered approach balances flexibility and efficiency
- **Revenue**: Clear pricing tiers aligned with value delivery

---

*This specification serves as the authoritative reference for CommerceNest development. All architectural decisions should align with the established patterns and business model.*


