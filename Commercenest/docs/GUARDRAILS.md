# 🛡️ GUARDRAIL SYSTEM - Feature Protection

## ⚠️ CRITICAL: READ BEFORE ANY CHANGES

This document protects all existing features from accidental deletion or modification. **ALWAYS** consult this document before making any changes.

---

## 🎯 PROTECTED FEATURES - DO NOT MODIFY

### 🏠 **BLUEBELL TENANT - FULLY PROTECTED**
**Status**: ✅ Production Ready - NO CHANGES WITHOUT APPROVAL

#### **Protected Pages**
- `/bluebell` - Homepage with custom branding
- `/bluebell/products` - Products with sophisticated filters
- `/bluebell/products/[slug]` - Product detail pages
- `/bluebell/portfolio` - Portfolio showcase
- `/bluebell/cart` - Shopping cart

#### **Protected Components**
- `BluebellProductFilters.tsx` - Sophisticated filter design
- `BluebellProductGrid.tsx` - Product grid with animations
- `BluebellProductSearch.tsx` - Search functionality
- `BluebellHomeComponent.tsx` - Homepage layout

#### **Protected Styling**
- **Colors**: `#01589D` (Bluebell blue), `#FDCE59` (mustard), `#DC2A38` (crimson)
- **Typography**: Playfair Display (serif), Inter (sans-serif)
- **Animations**: Hover effects, transitions, marquee animations

### 🏢 **SENLYSH TENANT - FULLY PROTECTED**
**Status**: ✅ Production Ready - NO CHANGES WITHOUT APPROVAL

#### **Protected Pages**
- `/senlysh` - Homepage
- `/senlysh/products` - Products page
- `/senlysh/products/[slug]` - Product detail pages
- `/senlysh/portfolio` - Portfolio page
- `/senlysh/cart` - Shopping cart

### ⚙️ **ADMIN PANEL - FULLY PROTECTED**
**Status**: ✅ Production Ready - NO CHANGES WITHOUT APPROVAL

#### **Protected Pages**
- `/admin` - Dashboard
- `/admin/products` - Products management
- `/admin/categories` - Categories management
- `/admin/orders` - Orders management
- `/admin/customers` - Customers management
- `/admin/analytics` - Analytics
- `/admin/settings` - Settings

---

## 🔒 PROTECTION RULES

### **BEFORE ANY CHANGES**
1. ✅ Read this guardrail document
2. ✅ Create backup git branch
3. ✅ Identify affected protected features
4. ✅ Plan testing strategy
5. ✅ Get approval if modifying protected features
6. ✅ Document proposed changes
7. ✅ Have rollback plan ready

### **🚨 TYPESCRIPT/LINT ERROR RESOLUTION PROTOCOL**

#### **✅ APPROVED Error Resolution Methods:**
- **Add missing imports** without changing existing functionality
- **Fix type definitions** without altering component behavior
- **Remove unused imports/variables** that don't affect functionality
- **Fix prop types** without changing component interfaces
- **Add proper TypeScript types** to existing code
- **Use type assertions** (`as any`) temporarily if needed
- **Add `// @ts-ignore` comments** for complex cases

#### **❌ FORBIDDEN Actions:**
- **Never break component functionality** - if it works, don't change it
- **Never modify existing props or interfaces** - add new ones instead
- **Never change styling or design** - even for "cleaner" code
- **Never affect user experience** - no changes that affect how users interact
- **Never break cross-tenant functionality** - changes must not affect other tenants

#### **🛡️ Error Resolution Process:**
1. **Isolate the error** - identify exact file and line
2. **Assess impact** - will fix break any existing functionality?
3. **Choose safest approach** - prefer warnings over breaking changes
4. **Test immediately** - verify no functionality is lost
5. **Rollback if needed** - immediately revert if anything breaks
6. **Document the fix** - record what was changed and why

#### **📋 Example: Safe Error Resolution**
**Scenario**: TypeScript error in `BluebellProductFilters.tsx`
**❌ WRONG Approach**: 
- Change component props or interface
- Modify existing functionality
- Break the filter design

**✅ CORRECT Approach**:
- Add missing import: `import { useState } from 'react'`
- Add type assertion: `const data = response as ProductData`
- Add `// @ts-ignore` comment for complex cases
- Test immediately to ensure filters still work
- Document the fix in development log

### **DURING CHANGES**
1. ✅ Test end-to-end with browser MCP
2. ✅ Verify no TypeScript errors
3. ✅ Verify no lint errors
4. ✅ Test cross-tenant functionality
5. ✅ Test responsive design
6. ✅ Verify no performance regressions

### **AFTER CHANGES**
1. ✅ Update this guardrail document
2. ✅ Document changes in development log
3. ✅ Verify all protected features still work
4. ✅ Test all affected pages
5. ✅ Update protected features list if needed

---

## 🚨 EMERGENCY PROCEDURES

### **If Features Are Lost**
1. **IMMEDIATE**: Git rollback to last working state
2. **RESTORE**: Use this document to restore features
3. **TEST**: Verify all functionality works
4. **DOCUMENT**: Update this guardrail document

### **If Design Is Broken**
1. **REFERENCE**: Use PLP.html and design files
2. **RESTORE**: Use exact hex codes from this document
3. **VERIFY**: Test all styling and animations
4. **DOCUMENT**: Update this guardrail document

---

## 📋 QUICK CHECKLIST

### **Before Making Changes**
- [ ] Read this guardrail document
- [ ] Create backup branch
- [ ] Plan testing strategy
- [ ] Get approval if needed
- [ ] Document changes

### **After Making Changes**
- [ ] Test all affected pages
- [ ] Verify no regressions
- [ ] Update documentation
- [ ] Commit with clear message

---

## 🎯 SUCCESS METRICS

### **Protection Goals**
- ✅ Zero accidental feature deletions
- ✅ Zero design regressions
- ✅ Zero infinite repair cycles
- ✅ All existing functionality preserved
- ✅ Consistent user experience maintained

---

**🛡️ GUARDRAIL SYSTEM ACTIVE**

**Last Updated**: 2025-01-27
**Status**: ✅ ACTIVE
**Protected Features**: 25+ components and pages
**Protection Level**: MAXIMUM

**⚠️ REMEMBER**: This system prevents infinite repair cycles. Always consult this document first!

---

## 🔐 Multitenant Technical Guardrails (Supplement)

These rules codify tenant safety and SSR/auth behavior. They complement, not replace, the protection rules above.

1) Tenant resolution
   - Use `src/middleware.ts` to set `x-pathname` and `x-tenant-admin`; persist a `tenant` cookie for `/admin` without prefix
   - Use `resolveTenantIdFromRequest()` in server code; NEVER hardcode tenant IDs

2) Auth
   - UI is gated client-side via `AuthGate`
   - Server reads should not crash on unauthenticated SSR; return empty data instead
   - Server mutations MUST call `assertTenantAdmin(tenantId)`

3) Routing
   - Site pages live under `/(site)/[tenant]/...`
   - Admin pages live under `/(tenant-admin)/[tenant]/admin/...`
   - Use `ADMIN_URLS`/`SITE_URLS` helpers for links; avoid raw strings

4) Cookies & SSR
   - `getAuthenticatedUserId()` derives from the Supabase auth cookie first, then falls back to SSR `getUser()`
   - Do not block SSR waiting on auth; prefer graceful empty states

5) Assets & Images
   - Brand images must be SVGs under `public/`
   - Supabase images may be rendered `unoptimized` to avoid delays
   - Normalize malformed URLs (e.g., `https:/` → `https://`)

6) Lint & Types
   - No new lint errors; prefer explicit types for public APIs
   - Avoid `any`; guard with `Array.isArray` and null checks

7) ADR for foundational changes
   - No architectural shifts without a short ADR and explicit approval

---

## 🌐 Host-based Tenancy Routing Model (Production) – Canonical

This section defines how routing, links, and tenancy resolution work across environments.

1) Resolution source of truth
   - Middleware resolves tenant exactly once per request.
   - Production: derive from `Host` (e.g., `bluebell.in` → `bluebell`).
   - Staging/local: support `/{tenant}/...` path fallback and a `tenant` cookie; header set for server.

2) URL model
   - Production: clean paths without tenant segment (e.g., `/products`, `/admin`).
   - Staging/local: path-based tenancy (`/{tenant}/...`) stays supported for QA.
   - UI must generate links via `SITE_URLS`/`ADMIN_URLS` so host/path differences are abstracted.

3) API shape
   - Keep `/api/...` tenant-agnostic; resolve tenant in handler from headers/cookies.
   - Never duplicate API trees per tenant.

4) Caching & data safety
   - Include `tenantId`/host in cache/revalidation keys to prevent cross-tenant data bleed.
   - All queries must filter by `tenantId`; never trust session alone for scoping.

5) SEO & sitemaps
   - Generate canonical URLs per domain; per-tenant sitemap/robots.
   - Mark path-based staging routes as `noindex`.

6) Admin exposure
   - Prod: `/admin` on custom domains (plus children) with UI gating and server mutation checks.
   - Staging/local: also support `/{tenant}/admin/...`.

7) Enforcement guardrails
   - No hardcoded route strings in UI. Use URL helpers only.
   - Middleware must remain lightweight (no DB calls). Unknown hosts: return 404 or landing, per config.
   - Payments/webhooks include `tenantId` in metadata; do not rely on Host in webhook handlers.