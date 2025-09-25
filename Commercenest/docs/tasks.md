## Membership, Wallet, Cashback & Rewards — Living Task Plan (Senlysh-first)

Status: Active (updated by dev as tasks complete)

### 0) Scope and Objectives
- Build an end-to-end customer module: registration → profile → addresses → wallet → cashback/rewards, aligned with multi-tenant rules and RLS.
- Senlysh-first implementation; patterns reusable for Bluebell.

### 1) Data Model and Contracts (DB-first)
- Tenancy: `tenants`, `tenant_domains`, `tenant_members`.
- Customers: `customers(id, tenant_id, user_id, email, ... )` with RLS.
- Addresses: `customer_addresses(id, tenant_id, customer_id, name, phone, line1, line2, city, state, pincode, country, is_default, created_at)`.
- Wallet:
  - `wallet_accounts(id, tenant_id, customer_id, created_at)`
  - `wallet_ledger(id, tenant_id, account_id, entry_type('credit'|'debit'), amount_cents, currency, source_key, reference_id, metadata, created_at)`
- Modules/flags (gating): `module_registry`, `tenant_modules` (customer_*), used by `validateCustomerFeatureAccess`.

Notes:
- Balance is derived from ledger (credits minus debits). No persistent `balance_cents` in schema.
- Cashback identification via `source_key` convention, e.g., `order:cashback`, `seed:cashback`.

### 2) API Surface (tenant + auth safe)
- Customer auth: Supabase session cookies; server routes use `createServerClient` with `cookies()` helpers.
- Resolve tenant from Host using middleware/server util.
- Endpoints:
  - `GET /api/customers/profile` — read/update via `PUT`.
  - `GET /api/customers/addresses`, `POST /api/customers/addresses`, `PUT /api/customers/addresses/:id`, `DELETE /api/customers/addresses/:id`.
  - `GET /api/customers/wallet` — balance + transactions.
  - Rewards (planned): `POST /api/rewards/calculate`, `GET /api/rewards/history`.

### 3) Flows
- Registration: email/password → create `customers` row → opt-ins saved.
- Profile: edit-in-place; validates phone, DOB; saves to `customers`.
- Addresses: CRUD; one default; validations on fields; UI modal for add/edit.
- Wallet: dashboard cards + filters + period; transactions reflect credits/debits; cashback grouped via `source_key`.
- Rewards/CB computation (Phase 3.3): default rules + Senlysh override using profit-based brackets; result credited to wallet as `credit` with `source_key='order:cashback'`.

### 4) Acceptance Criteria (Senlysh)
- Wallet page shows derived balance and 3 seeded transactions.
- Address book shows at least one default shipping address; CRUD and default toggle work under RLS.
- Customer pages protected by `CustomerAuthGate`; 401/403 eliminated for authenticated flows.
- Dev gating relaxed locally; production will require `tenant_modules` enablement.

### 5) Tasks (ordered, living checklist)
1. [x] Fix client/server Supabase auth and cookies; remove 401/403 on customer APIs.
2. [x] Implement wallet dashboard (cards, filters, period) and align schema usage.
3. [x] Address book upgrade: modal add/edit, default badge, client-side validation, optimistic updates.
4. [x] Rewards engine: design tenant-config + default rules; Senlysh profit-based cashback.
5. [x] Rewards API: `POST /api/rewards/calculate` (order context) and `GET /api/rewards/history`.
6. [x] Order integration: credit cashback to wallet post-payment with idempotency.
7. [x] Profile icon navigation: logged-in users go to profile page, not login page.
8. [x] Razorpay webhook payment processing: fixed payload structure issues, orders now update to 'paid' status automatically.
9. [ ] Pagination for wallet history; CSV export.
10. [ ] Module gating: ensure production checks use `tenant_modules` (remove dev bypass behind env flag in prod).
11. [ ] E2E tests (Playwright): Senlysh registration → profile → addresses → wallet; Bluebell parity checks.
12. [ ] Security & RLS advisor run; fix findings.

### 6) Implementation Notes
- Derive wallet balance on-the-fly from `wallet_ledger`.
- Tag cashback entries via `source_key='order:cashback'` and carry `metadata` (order_id, rule_id, bracket).
- Ensure idempotent credits on post-payment webhook/handler.
- Use keyset pagination for long histories.
- UI: keep cards and list composable for tenant-brand overrides.

### 7) Open Questions
- Cashback expiry policy? (per-tenant setting)
- Withdrawal flow requirements & KYC? (future)
- Should Bluebell get wallet in Phase 3.1 or 3.3?

### 8) Links
- Specs: `docs/CLIENT_MEMBERSHIP_SHIPPING_REPORT.md`, `docs/customer-modules-saas.md`, `docs/phase_delivery_process.md`.
- Code: `src/app/(site)/{tenant}/wallet/*`, `app/api/customers/*`, `src/server/customerModules.ts`.


