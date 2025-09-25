- P0.3 Middleware + Health — Completed (date)
  - Middleware sets `x-tenant-host`; health route resolves tenant by hostname using service client.
  - Problems observed and fixes:
    - Env misconfiguration blocked Supabase client → documented required variables and added to `.env.local`.
    - Path alias error (`@/src/server/*`) → fixed to `@/server/*` per tsconfig paths.
    - Host resolution mismatch (port included) → normalization implemented; also seeded `localhost` domain via `0004_dev_localhost_domain.sql` for local convenience.
  - Result: `/api/health` shows `{ tenantResolved: true, tenantId: 11111111-1111-4111-8111-11111111bb01 }` on localhost.
  - Rationale: guarantees host-based tenant detection in local dev without hosts file changes; required baseline for tenant-scoped SSR.

- P0.4 Module Skeletons — Completed (date)
  - Implemented tenant-aware product and portfolio pages using server-side loaders and simple UI components.
  - Updated root routing to serve tenant-aware home (`app/page.tsx` re-exports `./(site)/page`).
  - Fixed Next dynamic headers usage by awaiting `headers()` in resolver.
  - Optional seed SQL provided for demo visibility.

- P0.5 Basic Tests — Completed (date)
  - Added Playwright setup and E2E tests to validate health endpoint and pages render under tenant.
  - Installed browsers via `npx playwright install`; `npm run test:e2e` passed (2 tests).
  - Plan: extend with RLS policy tests (API-level) and unit tests for server loaders.

- P0.6 Payments (Razorpay test mode) — Completed (date)
  - Built `POST /api/checkout` and `POST /api/webhooks/razorpay`; added idempotency table/policies via migration 0005.
  - Tenant TEST credentials saved in DB; secrets stored as bytea.
  - Addressed:
    - Bytea secrets decoding for Razorpay client/HMAC.
    - Receipt length limit (<= 40).
    - Raw-body parsing with BOM handling; CRLF normalization for local files.
    - HMAC signature generation in Git Bash using OpenSSL/Node file approach.
    - Tunnel instability; recommended restart or ngrok for external tests.
  - Verified: local signed webhook returns `{ ok: true }`; DB shows updated order status and idempotency record.

- P0.7 Media Rendering & Optimization — Completed (2025-08-08)
  - Goal: Ensure assets saved in Storage render on public pages with good UX and performance.
  - Scope: Public site product grid and portfolio page; no private assets.
  - Technical:
    - Switched to `next/image` for product and portfolio hero images; added aspect-ratio wrappers.
    - Configured `images.remotePatterns` in `next.config.ts` based on `NEXT_PUBLIC_SUPABASE_URL`.
  - Acceptance:
    - Images visible on `/` and `/portfolio` for published content; no TypeScript or lint errors; dev server green.
  - Deferred to P0.8: blur placeholders, fallbacks, signed URLs for private buckets, CSP adjustments.
## CommerceNest — Phase/Sub-Phase Delivery Process (Living)

Purpose: Prevent regressions across phases/sub-phases; ensure DB-first builds, rigorous testing, and safe rollouts for an Invisible SaaS.

### 1) Workflow Overview
- Define: Write a concise spec per phase/sub-phase with technical and non-technical requirements, acceptance criteria, and risks.
- Build (flagged): Implement behind feature flags and tenant gating; no user-visible impact until enabled.
- Test: Run unit/integration/E2E suites; add contract tests for interfaces and RLS policy tests.
- Review: Peer review with checklists; update docs (spec, ADRs, runbooks).
- Release: Enable by tenant in staging → canary (staff) → production via flags; monitor SLOs.

### 2) Artifacts per Phase/Sub-Phase
- Spec doc (append to planning_progress.md or add a short section in commercenest_spec.md).
- Test plan (cases covering new and impacted modules; regression matrix).
- ADR (Architecture Decision Record) for any non-trivial decision.
- Migration notes (SQL changes, backfill steps, rollback plan) if schema is touched.
- Release checklist (gates to pass before enablement).

### 3) Entry/Exit Criteria
### Progress Log
- P0.1 Scaffolding — Completed (date)
  - DoD met: build runs, dev server green, baseline dirs present, scripts ready.

- P0.2 Core Multitenancy (part 1/2) — Applied (date)
  - Created multitenant schema and enabled RLS across content and commerce tables.
  - Adjusted constraints: replaced subquery CHECKs with composite foreign keys `(id, tenant_id)`.
  - Reworked RLS: split policies by operation to satisfy Postgres (INSERT requires WITH CHECK; SELECT/DELETE use USING; UPDATE uses both).
  - Kept high-risk writes server-role only (orders, order_items, payment secrets).
  - Next: Flags & Modules applied; prepared Bluebell seed script `0003_seed_bluebell.sql`.

- P0.2 Core Multitenancy (part 2/2) — Applied (date)
  - Seeded tenant, domain, module registry, feature flags, tenant modules, and baseline settings for Bluebell.
  - Used inline UUID/hostname (no psql variables in Supabase SQL editor); ensured idempotency with ON CONFLICT.
-
- P0.2 Core Multitenancy — 0001 Applied (date)
  - DoD: migration ran clean; RLS enabled; helper functions in place; policies split per command; composite FKs enforce tenant consistency.
  - Notes: removed unsupported CREATE POLICY IF NOT EXISTS; replaced subquery CHECKs with composite foreign keys; server-role-only writes for orders/items and payment settings.

- Entry
  - Spec approved; dependencies identified; feature flag/tenant gating defined.
  - DB schema reviewed (no blind changes; code conforms to DB as-is unless explicitly migrated).
- Exit (Definition of Done)
  - All acceptance criteria pass; no TS/lint errors; dev server green locally (golden rule).
  - Tests: unit/integration/contract/E2E added/updated; RLS policy tests for new/changed tables.
  - Observability: Sentry instrumentation; dashboards/SLOs updated; alerts configured if relevant.
  - Docs updated: spec, ADRs, runbooks; audit logs enabled for sensitive actions.
  - Feature enabled for target tenants; monitoring shows no regressions.

### 4) Branching and Release Gating
- Branching: Short-lived feature branches; PRs must be green on CI (build, lint, test suites) before merge.
- Release gates (per PR)
  - Checklist in PR template: spec link, tests added, RLS verified, flags configured, docs updated.
  - No unflagged user-visible changes unless explicitly approved.
- Flags: Use server-evaluated flags; default to off. Enable per tenant in staging then production.

### 5) Testing Strategy (Regression Shields)
- Unit tests: pure logic and utilities; module services with mocks.
- Integration tests: database-backed tests for SQL functions and repositories; verify RLS (positive/negative cases).
- Contract tests: plugin interfaces and module APIs; schema-validated I/O and timeout/error behavior.
- E2E tests (Playwright): critical flows (public pages, admin CRUD, checkout, webhooks); include cross-tenant isolation checks.
- Performance guards: budget assertions (e.g., p95 for key endpoints) in CI or nightly.

### 6) Database-First Change Management
- Review existing tables, policies, triggers before code; prefer adapting code to DB unless a migration is planned.
- For migrations
  - Write explicit SQL (Supabase migrations) named by module; include backfill scripts and rollback steps.
  - Enable RLS on new tables; add policies up-front; write policy tests.
  - Apply in staging; validate with seed data; run E2E before production.

### 7) Feature Flags and Tenant Gating
- All new functionality is behind flags with tenant-level enablement; maintain kill switches.
- Server-only evaluation; cache-aware invalidation when flags/overrides change.
- Record flag changes in audit logs; include reason and ticket link.

### 8) Environments and Data
- Staging mirrors production schema; seed minimal tenant(s) (e.g., Bluebell) for E2E runs.
- Preview deployments per PR if available; run smoke E2E with seeded data.
- No public signup; seed/invite whitelisted users only.

### 9) Observability and SLOs
- Tag logs/metrics with tenant_id, module, route. Maintain per-module SLOs (error rate, latency) by tenant.
- After enablement, watch dashboards for regressions; auto-alert on anomalies.

### 10) Non-Technical Requirements per Phase
- Communication plan with the client (e.g., Bluebell): demo cadence, approval process, feedback loop.
- Runbooks/support readiness: on-call, rollback, and incident procedures.
- Compliance and brand guidelines checks (e.g., Indian motifs, content standards).

### 11) Templates
- Sub-Phase Spec Template
```
Title: <Phase/Sub-Phase>: <Name>
Owner: <Name>  Timeline: <Start → End>

Goal
- <One paragraph outcome>

Scope (In/Out)
- In: <features, routes, tables>
- Out: <explicitly excluded>

Technical Requirements
- <APIs, modules, schema changes>

Non-Technical Requirements
- <comms, approvals, content, training>

Acceptance Criteria
- <verifiable statements>

Risks & Mitigations
- <risk → mitigation>

Flags & Gating
- <flag keys, default, enablement plan>

Links
- Spec refs, designs, ADRs, tickets
```

- Test Plan Template
```
Areas
- Unit: <list>
- Integration (DB/RLS): <list>
- Contract (plugins/APIs): <list>
- E2E (site/admin/checkout/webhooks): <list>

Data Setup
- Tenants: <ids>
- Seeds: <tables/fixtures>

Pass/Fail Criteria
- <thresholds, SLOs, budgets>
```

- Release Checklist (PR/Phase Exit)
```
[ ] Spec finalized and linked
[ ] Code behind flags; defaults off
[ ] Unit/Integration/Contract/E2E tests added and passing
[ ] RLS policies reviewed/updated; policy tests passing
[ ] Observability updated: Sentry tags, dashboards, alerts
[ ] Docs updated: spec, ADRs, runbooks
[ ] Staging enablement tested; canary plan ready
[ ] Production enablement plan with rollback and kill switch
```

### 12) Manual Commands (you run)
- Local dev checks
```
npm run lint && npm run build
npm run dev
```
- E2E (example)
```
npm run test:e2e
```
- Supabase migrations (apply in staging first)
```
# Use Supabase SQL editor or CLI; ensure backups and rollback scripts exist
```

### 13) Governance
- Keep docs minimal and centralized under `Commercenest/docs/`; avoid directory sprawl.
- Update planning_progress.md weekly; link sub-phase specs and ADRs.
- Enforce PR template and CI gates; no merges without green checks and completed checklist.



### 14) Frontend Tenant Architecture (RSC-safe composition)
- Context: Next.js App Router (15.4.x) may throw an invariant (clientReferenceManifest) when composing server components dynamically (e.g., rendering components returned from async registries or maps).
- Decision: Avoid dynamic component registries for now. Use static variant selection with explicit imports per section.
  - Each section has default and per-tenant variants under `src/ui/sections/*` and `src/tenants/<key>/sections/*`.
  - Pages/layouts select variants via a `switch (tenantKey)` with static imports (safe for RSC and build manifests).
  - Branding differences come from CSS variables set by `TenantProvider`; runtime content remains DB-driven.
- Client vs Server:
  - Interactive-only or placeholder sections can be client components to stabilize builds.
  - When converting a section to server, use a server wrapper that statically imports tenant variants and renders the selected one.
- Module gating: Gate visibility with `config.enabledModules` + DB `tenant_modules` checks.
- Future: When Next.js fixes the invariant, we can restore dynamic composition (registry) without changing tenant variant files.