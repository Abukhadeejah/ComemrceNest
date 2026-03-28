# Senlysh Master Log

Compiled from Senlysh Markdown logs. Dates are inferred from filenames or file content when present. Undated items are grouped at the end.

## 2024
- [Senlysh/README_COST_PRICE_FIX.md](Senlysh/README_COST_PRICE_FIX.md): Issue: cost price corruption during product updates. Solution: fix package with logging and payload safeguards. Outcome: documented fixes, verification, deployment readiness.
- [Senlysh/COST_PRICE_DOCUMENTATION_INDEX.md](Senlysh/COST_PRICE_DOCUMENTATION_INDEX.md): Issue: cost price corruption docs scattered. Solution: documentation index and reading paths. Outcome: clear doc navigation and checklist.
- [Senlysh/COST_PRICE_VERIFICATION.md](Senlysh/COST_PRICE_VERIFICATION.md): Issue: verify cost price fixes. Solution: verification steps and tests. Outcome: fixes confirmed and deployment-ready.

## 2025-01-27
- [Senlysh/TENANT_ISOLATION_VERIFICATION.md](Senlysh/TENANT_ISOLATION_VERIFICATION.md): Issue: verify tenant isolation and report failures. Solution: audit tenant scoping and document E2E failures. Outcome: isolation verified; testing blocked by runtime errors.

## 2025-02-11
- [Senlysh/DELIVERY_SUMMARY.md](Senlysh/DELIVERY_SUMMARY.md): Issue: production attributes bug fix delivery summary. Solution: documented scope and deploy steps. Outcome: fix ready with QA checklist.
- [Senlysh/DOCUMENTATION_INDEX.md](Senlysh/DOCUMENTATION_INDEX.md): Issue: need structured doc guide for attributes bug fix. Solution: doc index and reading order. Outcome: documentation package navigable.

## 2025-09-01
- [Senlysh/DEVELOPMENT_LOGS.md](Senlysh/DEVELOPMENT_LOGS.md): Issue: multi-tenant admin routing, PDP updates, and UI issues. Solution: admin scoping, rewrites, webhook and UI additions. Outcome: Bluebell and Senlysh flows stabilized; E2E verified.

## 2025-09-02
- [Senlysh/DEVELOPMENT_LOGS.md](Senlysh/DEVELOPMENT_LOGS.md): Issue: admin auth guard and staging issues. Solution: middleware guard and safe defaults. Outcome: admin access stabilized; follow-ups logged.

## 2025-10-09
- [Senlysh/Dev.md](Senlysh/Dev.md): Issue: tax selection loop and admin layout issues. Solution: admin UI refactors and deploy workflow updates. Outcome: mobile admin stable and fixes logged.

## 2025-10-10
- [Senlysh/Senlysh-Thread1.md](Senlysh/Senlysh-Thread1.md): Issue: large TypeScript error backlog and setup issues. Solution: type fixes and prop corrections. Outcome: zero TS errors; build ready.
- [Senlysh/Senlysh-Thread2.md](Senlysh/Senlysh-Thread2.md): Issue: Bluebell price hiding and deployment prep. Solution: price hiding and WhatsApp CTA, repo restructure, Vercel config. Outcome: local success; deployment blocked by LightningCSS.

## 2025-10-10 to 2025-10-22
- [Senlysh/Senlysh-Thread3.md](Senlysh/Senlysh-Thread3.md): Issue: deployment and LightningCSS failures. Solution: optional deps and rebuild steps. Outcome: local build success; deployment plan documented.

## 2025-10-22
- [Senlysh/Senlysh-Thread4.md](Senlysh/Senlysh-Thread4.md): Issue: auth UI, header, logo, tests, and merge conflicts. Solution: UI fixes, logo path, header blur, Playwright setup, merge resolution. Outcome: UX improved and tests ready.

## 2025-10-10 to 2025-10-24
- [Senlysh/Senlysh-Thread5.md](Senlysh/Senlysh-Thread5.md): Issue: multi-topic project log. Solution: consolidated fixes across TS, deploy, menus, and admin UX. Outcome: production-ready summary.

## 2025-10-24
- [Senlysh/Senlysh-Thread6.md](Senlysh/Senlysh-Thread6.md): Issue: category levels scope change. Solution: 2-level implementation and request clarification. Outcome: work paused pending decision.
- [Senlysh/Senlysh-Thread7.md](Senlysh/Senlysh-Thread7.md): Issue: category management scope change. Solution: 2-level UI and hold. Outcome: paused awaiting confirmation.
- [Senlysh/Senlysh-Thread8.md](Senlysh/Senlysh-Thread8.md): Issue: basic mobile menu and linear category selection. Solution: upgraded mobile menu and nested tree selection. Outcome: improved UX, ready to test.

## 2025-10-29
- [Senlysh/Senlysh-Thread9.md](Senlysh/Senlysh-Thread9.md): Issue: missing legal pages. Solution: created policy pages. Outcome: compliance pages added.

## 2025-10-29 to 2025-10-30
- [Senlysh/Senlysh-Thread10.md](Senlysh/Senlysh-Thread10.md): Issue: footer and legal link mismatches and 404s. Solution: align links and paths; tenant-aware routing guidance. Outcome: resolution guidance with next steps.

## 2025-11-01 to 2025-11-02
- [Senlysh/Senlysh-Thread11.md](Senlysh/Senlysh-Thread11.md): Issue: legal pages missing and routing gaps. Solution: created legal pages, footer links, middleware updates. Outcome: pages live; routing fixed; hydration issue noted.

## 2025-11-12
- [Senlysh/Senlysh-Thread13.md](Senlysh/Senlysh-Thread13.md): Issue: draft auto-save incomplete. Solution: schema and route plan. Outcome: marked incomplete, testing required.
- [Senlysh/Senlysh-Thread14.md](Senlysh/Senlysh-Thread14.md): Issue: draft auto-save errors. Solution: schema and route fixes; async params. Outcome: draft system working with TODOs.

## 2025-11-26
- [Senlysh/Senlysh-Thread17.md](Senlysh/Senlysh-Thread17.md): Issue: ProductForm invalid element and cache issues. Solution: recreate component, disable cache, add logs. Outcome: component restored; cache workaround noted.

## 2025-12-03
- [Senlysh/Senlysh-Thread18.md](Senlysh/Senlysh-Thread18.md): Issue: auth 401 in production. Solution: remove cookie cleanup; add SSR cookie debugging. Outcome: auth cookies persist; diagnostics improved.
- [Senlysh/Senlysh-Thread19.md](Senlysh/Senlysh-Thread19.md): Issue: ghost variant values in edit. Solution: load only used option values. Outcome: edit shows correct variants.
- [Senlysh/Senlysh-Thread20-Nested-Filters.md](Senlysh/Senlysh-Thread20-Nested-Filters.md): Issue: flat category filters. Solution: nested tree, multi-select, URL updates. Outcome: upgraded filters with counts and consistency.
- [Senlysh/Senlysh-Filters-Current-State.md](Senlysh/Senlysh-Filters-Current-State.md): Issue: filter UX and data mismatches. Solution: analysis and gap identification. Outcome: issues documented with test checklist.

## 2025-12-25
- [Senlysh/ATTRIBUTE_SIDEBAR_IMPLEMENTATION.md](Senlysh/ATTRIBUTE_SIDEBAR_IMPLEMENTATION.md): Issue: attribute filter sidebar missing values. Solution: robust queries and client handling. Outcome: sidebar shows filters; grid layout updated.

## 2026-01-06
- [Senlysh/Senlysh-Thread21-Pricing-Stock-Corruption-Fix.md](Senlysh/Senlysh-Thread21-Pricing-Stock-Corruption-Fix.md): Issue: pricing and stock overwritten on edit. Solution: parse only provided fields. Outcome: prevents clobbering.
- [Senlysh/Senlysh-Thread22-Varchar-Limit-Error-Fix.md](Senlysh/Senlysh-Thread22-Varchar-Limit-Error-Fix.md): Issue: varchar errors shown as unknown. Solution: improved error parsing and maxLength. Outcome: clear field errors and better UX.
- [Senlysh/Senlysh-Thread23-Complete-FormData-Validation-Audit.md](Senlysh/Senlysh-Thread23-Complete-FormData-Validation-Audit.md): Issue: varchar errors still slipping. Solution: full FormData audit and validation. Outcome: stronger validation and clearer errors.

## 2026-01-19
- [Senlysh/Senlysh-Thread24-Optional-Wallet-Checkout.md](Senlysh/Senlysh-Thread24-Optional-Wallet-Checkout.md): Issue: wallet auto-use in checkout. Solution: optional toggle, slider, cashback preview. Outcome: user-controlled wallet usage.

## 2026-01-20
- [Senlysh/SESSION_SUMMARY.md](Senlysh/SESSION_SUMMARY.md): Issue: coupon discount bug and TS errors. Solution: fix cents math and TS issues. Outcome: correct discounts and clean TS build.
- [Senlysh/TYPESCRIPT_ERRORS_FIX.md](Senlysh/TYPESCRIPT_ERRORS_FIX.md): Issue: 11 TS errors. Solution: type fixes and Next.js params updates. Outcome: build passes.
- [Senlysh/COUPON_DISCOUNT_CALCULATION_FIX.md](Senlysh/COUPON_DISCOUNT_CALCULATION_FIX.md): Issue: percent coupon applied as tiny discount. Solution: fix cents math and totals. Outcome: correct discount and payment amount.

## 2026-01-21
- [Senlysh/TENANT_PAYMENT_PROVIDERS.md](Senlysh/TENANT_PAYMENT_PROVIDERS.md): Issue: document per-tenant providers. Solution: PhonePe vs Razorpay config doc. Outcome: clear integration guide.
- [Senlysh/COUPON_PRODUCTION_FIX.md](Senlysh/COUPON_PRODUCTION_FIX.md): Issue: coupons admin 404 and NextAuth 500 in prod. Solution: env vars, middleware, domain mapping. Outcome: admin coupons work after redeploy.
- [Senlysh/COUPON_SYSTEM_ANALYSIS.md](Senlysh/COUPON_SYSTEM_ANALYSIS.md): Issue: coupon system gaps. Solution: identify missing tables and services. Outcome: roadmap to readiness.
- [Senlysh/COUPON_SYSTEM_FIXES_COMPLETE.md](Senlysh/COUPON_SYSTEM_FIXES_COMPLETE.md): Issue: coupon module and webhook gaps. Solution: migrations, services, webhooks, fix script. Outcome: coupon system production-ready.

## 2026-02-05
- [Senlysh/CASHBACK_AND_WALLET_FIXES_SUMMARY.md](Senlysh/CASHBACK_AND_WALLET_FIXES_SUMMARY.md): Issue: cashback not processing and wallet policy unclear. Solution: migration and shopping-only wallet policy. Outcome: cashback automated; withdrawals disabled.
- [Senlysh/CHECKOUT_WALLET_INTEGRATION_COMPLETE.md](Senlysh/CHECKOUT_WALLET_INTEGRATION_COMPLETE.md): Issue: wallet usage and cashback calc incorrect. Solution: wallet UI and cash-only cashback logic. Outcome: checkout supports wallet with accurate preview.
- [Senlysh/WALLET_VISIBILITY_FIX_SUMMARY.md](Senlysh/WALLET_VISIBILITY_FIX_SUMMARY.md): Issue: wallet balance not visible. Solution: backfill ledger and fix user_id query. Outcome: balances restored.

## 2026-02-06
- [Senlysh/COMPLETE_CASHBACK_FIX.md](Senlysh/COMPLETE_CASHBACK_FIX.md): Issue: order items and cashback failing due to cache. Solution: clear cache, fix columns, add logging. Outcome: order items saved; cashback restored.
- [Senlysh/IDEMPOTENCY_PROTECTION_COMPLETE.md](Senlysh/IDEMPOTENCY_PROTECTION_COMPLETE.md): Issue: duplicate webhook retries causing double processing. Solution: idempotency checks and flags. Outcome: safe webhook retries.

## 2026-02-09
- [Senlysh/CASHBACK_CURRENT_STATUS.md](Senlysh/CASHBACK_CURRENT_STATUS.md): Issue: order items missing and PhonePe unauthorized. Solution: restart server and credential fix plan. Outcome: blockers documented with test plan.
- [Senlysh/CLONE_PRODUCT_FEATURE.md](Senlysh/CLONE_PRODUCT_FEATURE.md): Issue: need quick product duplication. Solution: clone action and UI. Outcome: draft copies with variants and categories.
- [Senlysh/DELETED_FILES_LOG.md](Senlysh/DELETED_FILES_LOG.md): Issue: production cleanup. Solution: delete test and temp files. Outcome: repo cleaned for production.
- [Senlysh/SESSION_SUMMARY_FEB9.md](Senlysh/SESSION_SUMMARY_FEB9.md): Issue: login prompt and cashback order items missing. Solution: login modal and column fixes. Outcome: prompt UX improved; cashback pending restart.

## 2026-02-10
- [Senlysh/ATTRIBUTES_NOT_SAVING_FIX.md](Senlysh/ATTRIBUTES_NOT_SAVING_FIX.md): Issue: attributes not saving on edit. Solution: always append attributes to FormData. Outcome: attributes persist and remove properly.
- [Senlysh/DRAFT_API_FIX.md](Senlysh/DRAFT_API_FIX.md): Issue: draft delete failing due to schema mismatch. Solution: correct column names and non-blocking delete. Outcome: updates succeed even if delete fails.
- [Senlysh/EDIT_FORM_COMPLETE_FIX.md](Senlysh/EDIT_FORM_COMPLETE_FIX.md): Issue: edit form missing images, description, attributes. Solution: form reset and image sync. Outcome: all fields load on edit.
- [Senlysh/FIXES_ALREADY_APPLIED.md](Senlysh/FIXES_ALREADY_APPLIED.md): Issue: confirm previous edit-form fixes. Solution: verification checklist. Outcome: ready to deploy and test.
- [Senlysh/PRICE_BUG_QUICK_REFERENCE.md](Senlysh/PRICE_BUG_QUICK_REFERENCE.md): Issue: zero price bug when sale price empty. Solution: treat empty sale price as null and fallback to MRP. Outcome: correct create pricing.
- [Senlysh/PRODUCT_EDIT_FORM_FIX.md](Senlysh/PRODUCT_EDIT_FORM_FIX.md): Issue: edit form missing images and attributes due to defaultValues. Solution: sync initialData into form and images. Outcome: edit form reliably loads full data.
- [Senlysh/SESSION_SUMMARY_FEB10.md](Senlysh/SESSION_SUMMARY_FEB10.md): Issue: zero price bug and edit form data not loading. Solution: null handling and reset form. Outcome: correct pricing and data load.
- [Senlysh/SALE_PRICE_EDIT_FIX.md](Senlysh/SALE_PRICE_EDIT_FIX.md): Issue: sale price shown as MRP when blank. Solution: treat equal price as null. Outcome: correct sale price display.

## 2026-02-11
- [Senlysh/DISCOUNT_CASHBACK_RESOLUTION_STATUS.md](Senlysh/DISCOUNT_CASHBACK_RESOLUTION_STATUS.md): Issue: discount calc and membership cache errors. Solution: SQL adjustment and graceful fallback. Outcome: coupon calc fixed; cache issue non-blocking.

## Undated
- [Senlysh/ADMIN_INTEGRATION_TEST_PLAN.md](Senlysh/ADMIN_INTEGRATION_TEST_PLAN.md): Issue: admin integration test coverage. Solution: workflows for cache, tenant, and admin flows. Outcome: full manual test plan.
- [Senlysh/ADMIN_ORDERS_BUTTONS_FIX.md](Senlysh/ADMIN_ORDERS_BUTTONS_FIX.md): Issue: order action buttons not working. Solution: auth bypass and improved mark-paid flow. Outcome: buttons work; cashback auto-processed.
- [Senlysh/ADMIN_ORDERS_ENHANCEMENT.md](Senlysh/ADMIN_ORDERS_ENHANCEMENT.md): Issue: missing status management and cashback display. Solution: status API and UI details. Outcome: full workflow with cashback visibility.
- [Senlysh/ADMIN_ORDERS_FINAL_STATUS.md](Senlysh/ADMIN_ORDERS_FINAL_STATUS.md): Issue: verify final orders system state. Solution: final verification with examples. Outcome: orders actions functional.
- [Senlysh/ADMIN_ORDERS_FIX_SUMMARY.md](Senlysh/ADMIN_ORDERS_FIX_SUMMARY.md): Issue: orders hidden due to auth. Solution: endpoints and temp auth bypass. Outcome: orders visible and status updates work.
- [Senlysh/ADMIN_ORDERS_STATUS_FIX.md](Senlysh/ADMIN_ORDERS_STATUS_FIX.md): Issue: 405 on status API. Solution: cache restart and route verification. Outcome: PATCH works after restart.
- [Senlysh/ALIGNMENT_FIX_COMPLETE.md](Senlysh/ALIGNMENT_FIX_COMPLETE.md): Issue: product card height misalignment. Solution: side-by-side price and variants layout. Outcome: aligned carousels.
- [Senlysh/ALL_DELIVERABLES.md](Senlysh/ALL_DELIVERABLES.md): Issue: need consolidated deliverables list. Solution: documented files and code changes. Outcome: single delivery scope list.
- [Senlysh/BANK_WITHDRAWAL_REMOVAL_COMPLETE.md](Senlysh/BANK_WITHDRAWAL_REMOVAL_COMPLETE.md): Issue: wallet withdrawal messaging present. Solution: remove references and disable redeem. Outcome: shopping-only wallet policy.
- [Senlysh/BEST_SELLERS_VARIANT_SUPPORT.md](Senlysh/BEST_SELLERS_VARIANT_SUPPORT.md): Issue: Best Sellers lacked variants. Solution: add variant UI and pricing. Outcome: section parity with Latest Products.
- [Senlysh/BUG_FIXES_SUMMARY.md](Senlysh/BUG_FIXES_SUMMARY.md): Issue: Buy Now redirect and price mismatch. Solution: delay redirect and use DB prices. Outcome: correct checkout pricing and flow.
- [Senlysh/CASHBACK_CUSTOMER_ID_FIX_COMPLETE.md](Senlysh/CASHBACK_CUSTOMER_ID_FIX_COMPLETE.md): Issue: missing customer_id and order_items. Solution: always send customerId and add logging. Outcome: orders linked; items saved.
- [Senlysh/CASHBACK_IMPLEMENTATION_SUMMARY.md](Senlysh/CASHBACK_IMPLEMENTATION_SUMMARY.md): Issue: need full cashback system. Solution: migrations, services, APIs, and UI. Outcome: cashback stack production-ready.
- [Senlysh/CASHBACK_ISSUE_COMPLETE_DIAGNOSIS.md](Senlysh/CASHBACK_ISSUE_COMPLETE_DIAGNOSIS.md): Issue: paid orders without cashback. Solution: add customer_id and items insert. Outcome: future orders cashback-ready.
- [Senlysh/CASHBACK_NOT_WORKING_FIX.md](Senlysh/CASHBACK_NOT_WORKING_FIX.md): Issue: no cashback due to missing customer_id. Solution: enforce login and capture customer_id. Outcome: cashback processes for new orders.
- [Senlysh/CASHBACK_QUICKSTART.md](Senlysh/CASHBACK_QUICKSTART.md): Issue: quick setup guide needed. Solution: migration and test steps. Outcome: fast bootstrap path.
- [Senlysh/CASHBACK_SYSTEM.md](Senlysh/CASHBACK_SYSTEM.md): Issue: system documentation needed. Solution: rules, APIs, schema documented. Outcome: complete reference.
- [Senlysh/CLONE_AND_SIGNOUT_FIXES.md](Senlysh/CLONE_AND_SIGNOUT_FIXES.md): Issue: clone redirect and signout errors. Solution: propagate redirect errors and fix signout flow. Outcome: clone and signout reliable.
- [Senlysh/CODE_CHANGES_EXACT_DIFF.md](Senlysh/CODE_CHANGES_EXACT_DIFF.md): Issue: need exact diff for attributes bug fix. Solution: documented precise code changes. Outcome: diff reference.
- [Senlysh/COUPON_SCHEMA_FIX.md](Senlysh/COUPON_SCHEMA_FIX.md): Issue: missing coupons table columns. Solution: run migration or create table. Outcome: schema restored.
- [Senlysh/COUPON_SYSTEM_COMPLETE.md](Senlysh/COUPON_SYSTEM_COMPLETE.md): Issue: rebuild coupon system. Solution: admin and customer flows implemented. Outcome: full CRUD and validation.
- [Senlysh/COUPON_USAGE_LIMIT_FEATURE.md](Senlysh/COUPON_USAGE_LIMIT_FEATURE.md): Issue: per-user coupon limits needed. Solution: form step and table column. Outcome: per-user limits enforced.
- [Senlysh/COST_PRICE_COMPLETE_RESOLUTION.md](Senlysh/COST_PRICE_COMPLETE_RESOLUTION.md): Issue: cost price corruption. Solution: multi-fix summary. Outcome: full resolution and tests.
- [Senlysh/COST_PRICE_CORRUPTION_FIX.md](Senlysh/COST_PRICE_CORRUPTION_FIX.md): Issue: cost price nulling on edit. Solution: FormData, payload, and draft delete fixes. Outcome: cost price preserved.
- [Senlysh/COST_PRICE_FIX_BEFORE_AFTER.md](Senlysh/COST_PRICE_FIX_BEFORE_AFTER.md): Issue: need before and after diff. Solution: documented code changes. Outcome: clear comparison.
- [Senlysh/COST_PRICE_QUICK_FIX.md](Senlysh/COST_PRICE_QUICK_FIX.md): Issue: quick fix summary. Solution: steps and logs. Outcome: fast verification.
- [Senlysh/COST_PRICE_REAL_BUG_FOUND.md](Senlysh/COST_PRICE_REAL_BUG_FOUND.md): Issue: bug in edit page init. Solution: fix field mapping. Outcome: cost price loads correctly.
- [Senlysh/COST_PRICE_VISUAL_GUIDE.md](Senlysh/COST_PRICE_VISUAL_GUIDE.md): Issue: need visual flow. Solution: diagrammed fix pipeline. Outcome: easier validation.
- [Senlysh/DEPLOY_TO_PRODUCTION.md](Senlysh/DEPLOY_TO_PRODUCTION.md): Issue: deployment steps needed. Solution: git and Vercel checklist. Outcome: production deploy guide.
- [Senlysh/DEVELOPMENT_NOTES.md](Senlysh/DEVELOPMENT_NOTES.md): Issue: PLP build and lint cleanup. Solution: implement PLP and document pending tasks. Outcome: PLP complete; backlog noted.
- [Senlysh/EDIT_FORM_NOT_SAVING_DEBUG.md](Senlysh/EDIT_FORM_NOT_SAVING_DEBUG.md): Issue: edit form not saving. Solution: debug guide and checks. Outcome: faster root-cause tracing.
- [Senlysh/EDIT_FORM_TEST_GUIDE.md](Senlysh/EDIT_FORM_TEST_GUIDE.md): Issue: edit-form QA steps. Solution: test guide. Outcome: quick validation.
- [Senlysh/EXECUTIVE_SUMMARY.md](Senlysh/EXECUTIVE_SUMMARY.md): Issue: attributes bug summary for stakeholders. Solution: summarized root cause and fix. Outcome: approval-ready overview.
- [Senlysh/FEATURED_PRODUCTS_VARIANT_SUPPORT_AND_FIXES.md](Senlysh/FEATURED_PRODUCTS_VARIANT_SUPPORT_AND_FIXES.md): Issue: featured products lacked variants and syntax error. Solution: add variants and fix syntax. Outcome: home sections consistent.
- [Senlysh/FINAL_ORDERS_SOLUTION.md](Senlysh/FINAL_ORDERS_SOLUTION.md): Issue: orders API, customer linking, and pages. Solution: fix API fields, link customers, new orders page. Outcome: order history and cashback readiness.
- [Senlysh/FIXES_SUMMARY.md](Senlysh/FIXES_SUMMARY.md): Issue: missing orders API and cashback webhooks. Solution: customer orders and webhook fixes. Outcome: orders visible and cashback ready.
- [Senlysh/FIX_IMPLEMENTATION_SUMMARY.md](Senlysh/FIX_IMPLEMENTATION_SUMMARY.md): Issue: attributes missing on edit in production. Solution: attribute query and mapping. Outcome: attributes pre-selected.
- [Senlysh/GHOST_VARIANTS_FINAL_FIX.md](Senlysh/GHOST_VARIANTS_FINAL_FIX.md): Issue: ghost variants shown. Solution: filter values by usage and cleaned fetch. Outcome: ghost variants removed.
- [Senlysh/IDEMPOTENCY_DEPLOYMENT_GUIDE.md](Senlysh/IDEMPOTENCY_DEPLOYMENT_GUIDE.md): Issue: safe idempotency rollout. Solution: migration and verification steps. Outcome: deployment checklist.
- [Senlysh/IDEMPOTENCY_QUICK_START.md](Senlysh/IDEMPOTENCY_QUICK_START.md): Issue: fast idempotency setup. Solution: 3-step setup. Outcome: quick deploy path.
- [Senlysh/INDIVIDUAL_PRODUCT_PRICE_RESTORATION.md](Senlysh/INDIVIDUAL_PRODUCT_PRICE_RESTORATION.md): Issue: product price removed during WhatsApp removal. Solution: restore price block and UX. Outcome: price display restored.
- [Senlysh/INTEGRATION_SUMMARY.md](Senlysh/INTEGRATION_SUMMARY.md): Issue: admin integration gaps. Solution: cache tags, DB wiring, inventory, tenant isolation. Outcome: admin panel integrated.
- [Senlysh/JUSPAY_MIGRATION_GUIDE.md](Senlysh/JUSPAY_MIGRATION_GUIDE.md): Issue: migrate checkout to Juspay. Solution: new service, route, webhook, env vars. Outcome: code ready; config pending.
- [Senlysh/LATEST_PRODUCTS_ENHANCEMENT_AND_SPACING_FIX.md](Senlysh/LATEST_PRODUCTS_ENHANCEMENT_AND_SPACING_FIX.md): Issue: spacing and buttons inconsistent. Solution: unify padding, margins, button styles. Outcome: consistent layout.
- [Senlysh/LOGIN_PROMPT_INTEGRATION.md](Senlysh/LOGIN_PROMPT_INTEGRATION.md): Issue: checkout without login caused errors. Solution: login modal and guarded payment action. Outcome: clean UX.
- [Senlysh/LOGIN_REDIRECT_LOOP_FIX.md](Senlysh/LOGIN_REDIRECT_LOOP_FIX.md): Issue: login redirect loop. Solution: link customers by user_id and email fallback. Outcome: stable login flow.
- [Senlysh/MEMBERSHIP_PRICING_UPDATE.md](Senlysh/MEMBERSHIP_PRICING_UPDATE.md): Issue: pricing changes and CTA removal. Solution: update tiers and remove header button. Outcome: new pricing shown.
- [Senlysh/MULTI_PROVIDER_PAYMENT_INTEGRATION.md](Senlysh/MULTI_PROVIDER_PAYMENT_INTEGRATION.md): Issue: tenant-specific payment providers. Solution: resolver and checkout routing by tenant. Outcome: PhonePe for Senlysh; Razorpay for Bluebell.
- [Senlysh/NAN_PRICE_FIX.md](Senlysh/NAN_PRICE_FIX.md): Issue: NaN price on product pages. Solution: map price_cents to pricecents and guard nulls. Outcome: correct price display.
- [Senlysh/NEXT_STEPS_TO_FIX_CASHBACK.md](Senlysh/NEXT_STEPS_TO_FIX_CASHBACK.md): Issue: cashback flow unstable. Solution: restart and verification steps. Outcome: recovery runbook.
- [Senlysh/ORDER_DETAILS_FIX.md](Senlysh/ORDER_DETAILS_FIX.md): Issue: order details failed for PhonePe and missing customer linkage. Solution: support both providers and link customer. Outcome: order details visible; cashback path enabled.
- [Senlysh/ORDERS_AND_CASHBACK_SOLUTION.md](Senlysh/ORDERS_AND_CASHBACK_SOLUTION.md): Issue: missing orders view and cashback tooling. Solution: new orders page and backfill scripts. Outcome: order history and processing workflow.
- [Senlysh/ORDERS_AUTHENTICATION_FIX_COMPLETE.md](Senlysh/ORDERS_AUTHENTICATION_FIX_COMPLETE.md): Issue: 401s from NextAuth mismatch. Solution: Supabase auth helper. Outcome: orders and membership APIs authenticated.
- [Senlysh/PHONEPE_BUG_FIX_SUMMARY.md](Senlysh/PHONEPE_BUG_FIX_SUMMARY.md): Issue: test mode orders stuck pending. Solution: verify-payment fallback and success page flow. Outcome: orders update and cashback runs.
- [Senlysh/PHONEPE_ENV_VARIABLES.md](Senlysh/PHONEPE_ENV_VARIABLES.md): Issue: incomplete PhonePe env setup. Solution: document env vars. Outcome: consistent config.
- [Senlysh/PHONEPE_INTEGRATION_FINAL.md](Senlysh/PHONEPE_INTEGRATION_FINAL.md): Issue: implement Standard Checkout. Solution: update integration, webhooks, config. Outcome: integration ready to test.
- [Senlysh/PHONEPE_PAYMENT_FLOW_EXPLAINED.md](Senlysh/PHONEPE_PAYMENT_FLOW_EXPLAINED.md): Issue: clarify webhook flow. Solution: document payloads and state mapping. Outcome: clear status handling.
- [Senlysh/PHONEPE_TEST_MODE_FIX.md](Senlysh/PHONEPE_TEST_MODE_FIX.md): Issue: test mode webhooks not firing. Solution: verify-payment fallback on success page. Outcome: orders update and cashback processes.
- [Senlysh/PRICE_ZERO_BUG_FIX.md](Senlysh/PRICE_ZERO_BUG_FIX.md): Issue: empty sale price saved as 0. Solution: rupeesToCents returns null and fallback to MRP. Outcome: correct pricing.
- [Senlysh/PRE_DEPLOYMENT_VERIFICATION_CHECKLIST.md](Senlysh/PRE_DEPLOYMENT_VERIFICATION_CHECKLIST.md): Issue: need pre-deploy checks. Solution: checklist for code, docs, tests, and DB. Outcome: structured verification path.
- [Senlysh/PREMIUM_MEMBERSHIP_SYSTEM_COMPLETE.md](Senlysh/PREMIUM_MEMBERSHIP_SYSTEM_COMPLETE.md): Issue: build premium membership system. Solution: schema, pricing, APIs, and PhonePe flow. Outcome: membership and cashback rules implemented.
- [Senlysh/PREMIUM_MEMBERSHIP_SYSTEM_UPDATE.md](Senlysh/PREMIUM_MEMBERSHIP_SYSTEM_UPDATE.md): Issue: update to 1-year free membership. Solution: schema and UI updates. Outcome: free membership and smart CTA.
- [Senlysh/PRODUCT_CARD_ALIGNMENT_FIX.md](Senlysh/PRODUCT_CARD_ALIGNMENT_FIX.md): Issue: variant cards taller than price. Solution: horizontal variant display and placeholder. Outcome: alignment fixed.
- [Senlysh/PRODUCTION_ATTRIBUTES_BUG_DEBUG_PLAN.md](Senlysh/PRODUCTION_ATTRIBUTES_BUG_DEBUG_PLAN.md): Issue: attributes not preselected in production. Solution: query and mapping plan. Outcome: fix plan and validation steps.
- [Senlysh/PRODUCTION_DEPLOYMENT_CHECKLIST.md](Senlysh/PRODUCTION_DEPLOYMENT_CHECKLIST.md): Issue: edit form works locally but not in prod. Solution: deployment and cache checks. Outcome: troubleshooting guide.
- [Senlysh/PRODUCTION_VS_LOCAL_ANALYSIS.md](Senlysh/PRODUCTION_VS_LOCAL_ANALYSIS.md): Issue: empty placeholder. Solution: none. Outcome: none.
- [Senlysh/QUICK_REFERENCE_COMPARISON.md](Senlysh/QUICK_REFERENCE_COMPARISON.md): Issue: tenant-admin edit missing attribute selections. Solution: add query and mapping. Outcome: parity with admin edit.
- [Senlysh/README.md](Senlysh/README.md): Issue: general repo info. Solution: N/A. Outcome: setup guidance.
- [Senlysh/RESTART_AND_TEST.md](Senlysh/RESTART_AND_TEST.md): Issue: stale cache blocking fixes. Solution: restart and verification steps. Outcome: validation runbook.
- [Senlysh/SUPABASE_AUTH_STANDARDIZATION_COMPLETE.md](Senlysh/SUPABASE_AUTH_STANDARDIZATION_COMPLETE.md): Issue: mixed Supabase auth libs. Solution: standardize on @supabase/ssr. Outcome: clean auth flow.
- [Senlysh/VARCHAR_50_FIX_COMPLETE.md](Senlysh/VARCHAR_50_FIX_COMPLETE.md): Issue: image URL overflow in varchar(50). Solution: store flag and avoid URL in size_guide_type. Outcome: image uploads succeed.
- [Senlysh/WALLET_403_ERROR_FIX.md](Senlysh/WALLET_403_ERROR_FIX.md): Issue: wallet API 403 due to module validation. Solution: enable customer_wallet and customers_premium modules. Outcome: wallet access passes.
- [Senlysh/WALLET_DEDUCTION_FIX_COMPLETE.md](Senlysh/WALLET_DEDUCTION_FIX_COMPLETE.md): Issue: wallet not deducted on paid orders. Solution: debit logic in admin and webhook. Outcome: correct balances.
- [Senlysh/WALLET_MODULE_FIX_COMPLETE.md](Senlysh/WALLET_MODULE_FIX_COMPLETE.md): Issue: wallet module not registered. Solution: add to registry and tenant modules. Outcome: wallet enabled.
- [Senlysh/WALLET_TROUBLESHOOTING_GUIDE.md](Senlysh/WALLET_TROUBLESHOOTING_GUIDE.md): Issue: wallet data load failures. Solution: step-by-step diagnostics. Outcome: troubleshooting checklist.
- [Senlysh/WHATSAPP_REMOVAL_AND_VARIANT_ORDERING_FIX.md](Senlysh/WHATSAPP_REMOVAL_AND_VARIANT_ORDERING_FIX.md): Issue: WhatsApp buttons replaced price and variants unordered. Solution: remove WhatsApp and sort variants. Outcome: prices restored and consistent ordering.
- [Senlysh/Senlysh-Thread15mini.md](Senlysh/Senlysh-Thread15mini.md): Issue: RHF and TS integration issues. Solution: list of fixes and files. Outcome: refactor guidance.
- [Senlysh/Senlysh-Thread16(part1).md](Senlysh/Senlysh-Thread16(part1).md): Issue: RHF and TS integration issues. Solution: file list and type fixes. Outcome: refactor guidance.
- [Senlysh/Senlysh-Thread16(part2).md](Senlysh/Senlysh-Thread16(part2).md): Issue: RHF and TS integration issues. Solution: file list and type fixes. Outcome: refactor guidance.
