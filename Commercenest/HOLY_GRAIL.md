# 🚫 HOLY GRAIL - CODE THAT MUST NEVER BE CHANGED

## 📋 OVERVIEW
This document identifies the **MOST CRITICAL** components in the CommerceNest codebase that maintain the system's core functionality and security. **CHANGING ANY OF THESE COMPONENTS WILL BREAK THE ENTIRE PLATFORM**.

## ⚠️ WARNING: READ THIS BEFORE ANY CODE CHANGES

**BEFORE MAKING ANY CHANGES:**
1. **Read this document completely**
2. **Understand why each component is critical**
3. **Get explicit approval before touching any Holy Grail code**
4. **Test extensively after any changes (even seemingly minor ones)**

---

## 🔥 CRITICAL COMPONENT #1: MIDDLEWARE.TS
**File:** `Commercenest/web/src/middleware.ts`  
**Critical Level:** 🔴 MAXIMUM - Platform-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Lines 73-90: Admin Route Security Logic**
```typescript
if (isAdminRoute) {
  // SECURITY FIX: /admin routes should redirect to tenant-specific admin
  // This prevents cross-tenant access by forcing explicit tenant context
  const cookieTenant = request.cookies.get('tenant')?.value;
  // CRITICAL FIX: Never default to a specific tenant - this causes cross-tenant contamination
  // If cookie is invalid, redirect to platform homepage instead
  const inferredTenant = cookieTenant === 'bluebell' || cookieTenant === 'senlysh' ? cookieTenant : null;
  if (!inferredTenant) {
    // Redirect to platform homepage if no valid tenant cookie
    const redirectResp = NextResponse.redirect(new URL('/', request.url));
    return redirectResp;
  }

  // Redirect /admin to /{tenant}/admin to enforce tenant isolation
  const redirectResp = NextResponse.redirect(new URL(`/${inferredTenant}/admin`, request.url));
  redirectResp.cookies.set('tenant', inferredTenant, { path: '/', sameSite: 'lax' });
  return redirectResp;
}
```

#### **Lines 22-25: Global Route Protection**
```typescript
// Global (non-tenant) routes that must not be rewritten
const globalNoRewrite = new Set(['/login', '/checkout', '/cart'])
const isGlobalRoute = globalNoRewrite.has(pathname)
```

#### **Lines 113-121: Senlysh PDP Special Handling**
```typescript
// Senlysh PDP: /senlysh/products/{slug} -> /products/{slug}
if (tenantFromPath === 'senlysh' && segments.length >= 3 && segments[1] === 'products') {
  const globalTarget = `/${segments.slice(1).join('/')}` // /products/{slug}[...]
  headers.set('x-pathname', globalTarget)
  headers.set('x-tenant-admin', tenantFromPath)
  const response = NextResponse.rewrite(new URL(globalTarget, request.url), { request: { headers } })
  response.cookies.set('tenant', tenantFromPath, { path: '/', sameSite: 'lax' })
  return response
}
```

### 💥 WHAT HAPPENS IF CHANGED:
- **Cross-tenant data leakage**
- **Admin panel security breaches**
- **Complete tenant isolation breakdown**
- **Senlysh product pages stop working**
- **All URL routing becomes unpredictable**

---

## 🔥 CRITICAL COMPONENT #2: SERVER/TENANT.TS
**File:** `Commercenest/web/src/server/tenant.ts`  
**Critical Level:** 🔴 MAXIMUM - Platform-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Lines 96-109: Tenant ID Resolution Logic**
```typescript
// 3. Special handling for localhost development
if (host === 'localhost') {
  const pathSegments = pathname.split('/').filter(Boolean)

  if (pathSegments.length > 0) {
    const firstSegment = pathSegments[0].toLowerCase()

    if (firstSegment === 'bluebell') {
      return '11111111-1111-4111-8111-11111111bb01' // Bluebell Interiors
    }

    if (firstSegment === 'senlysh') {
      return '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh Fashion
    }
  }

  // For root paths (/, /products, etc.), return null for platform content
  // Root routes are reserved for CommerceNest platform, not tenant-specific content
  // Ignore any host-based mappings for localhost root routes
  return null
}
```

#### **Lines 40-46: Tenant Admin Header Priority**
```typescript
// 1. Try tenant admin header first (most reliable for tenant-specific routes)
if (tenantAdmin) {
  const tenantId = await resolveTenantIdFromKey(tenantAdmin)
  if (tenantId) {
    return tenantId
  }
}
```

### 💥 WHAT HAPPENS IF CHANGED:
- **All tenant resolution fails**
- **Admin panels stop working**
- **Product pages break**
- **Cross-tenant data mixing**
- **Authentication completely fails**

---

## 🔥 CRITICAL COMPONENT #3: DATABASE MULTITENANCY SCHEMA
**File:** `Commercenest/supabase/migrations/0001_core_multitenancy.sql`  
**Critical Level:** 🔴 MAXIMUM - Platform-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Tenant Isolation Functions (Lines 240-262)**
```sql
-- RLS helpers
create or replace function public.is_tenant_member(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tid and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_editor(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tid and tm.user_id = auth.uid() and tm.role in ('tenant_admin','tenant_editor')
  );
$$;

create or replace function public.is_tenant_admin(tid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = tid and tm.user_id = auth.uid() and tm.role = 'tenant_admin'
  );
$$;
```

#### **Core Table Structure (Lines 36-107)**
```sql
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade, -- THIS PATTERN
  -- ... all tenant_id foreign keys
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  -- ... product fields
);
```

### 💥 WHAT HAPPENS IF CHANGED:
- **Complete data isolation breakdown**
- **All tenant data becomes accessible to everyone**
- **Security completely compromised**
- **Data corruption across all tenants**

---

## 🔥 CRITICAL COMPONENT #4: AUTH GATE SECURITY
**File:** `Commercenest/web/src/components/admin/AuthGate.tsx`  
**Critical Level:** 🔴 MAXIMUM - Security-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Lines 22-23: Credential Settings**
```typescript
const res = await fetch('/api/auth/check-tenant-access', {
  cache: 'no-store',
  credentials: 'include'  // CRITICAL: Must be 'include', not 'same-origin'
})
```

#### **Lines 33-43: Security Response Handling**
```typescript
// If unauthorized for this tenant, redirect to login
if (res.status === 403) {
  router.replace('/login')
  return
}

// If unauthenticated, redirect to login
if (res.status === 401) {
  router.replace('/login')
  return
}
```

### 💥 WHAT HAPPENS IF CHANGED:
- **Admin panel becomes accessible to unauthorized users**
- **Cross-tenant admin access possible**
- **Security completely bypassed**
- **Admin functions exposed to wrong tenants**

---

## 🔥 CRITICAL COMPONENT #5: BADGE SYSTEM LOGIC
**File:** `Commercenest/web/src/utils/badges.ts`  
**Critical Level:** 🔴 HIGH - Feature-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Lines 29-129: Badge Generation Function**
```typescript
export function generateProductBadges(config: BadgeConfig): ProductBadge[] {
  // ... ENTIRE FUNCTION LOGIC MUST REMAIN INTACT

  // Featured badge
  if (config.is_featured && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: 'Featured',
      className: 'bg-blue-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '⭐'
    })
  }

  // Bestseller badge
  if (config.is_bestseller && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: 'Bestseller',
      className: 'bg-amber-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '🏆'
    })
  }

  // ... ALL BADGE LOGIC MUST REMAIN UNCHANGED
}
```

#### **Lines 127-128: Badge Sorting**
```typescript
// Sort badges by priority (lower number = higher priority)
return badges.sort((a, b) => a.priority - b.priority)
```

### 💥 WHAT HAPPENS IF CHANGED:
- **Badge filters stop working**
- **Product filtering breaks**
- **Search results become inaccurate**
- **User experience completely degraded**

---

## 🔥 CRITICAL COMPONENT #6: TENANT ACCESS API
**File:** `Commercenest/web/src/app/api/auth/check-tenant-access/route.ts`  
**Critical Level:** 🔴 HIGH - Security-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Lines 13-16: Tenant Resolution**
```typescript
const tenantId = await resolveTenantIdFromRequest()
if (!tenantId) {
  return NextResponse.json({ error: 'no tenant context' }, { status: 400 })
}
```

#### **Lines 18-24: Database Access Check**
```typescript
// Check if user has access to this tenant
const { data: member, error } = await supabaseAdmin
  .from('tenant_members')
  .select('role')
  .eq('user_id', userId)
  .eq('tenant_id', tenantId)
  .maybeSingle()
```

#### **Lines 31-33: Access Control**
```typescript
if (!member) {
  return NextResponse.json({ error: 'unauthorized for this tenant' }, { status: 403 })
}
```

### 💥 WHAT HAPPENS IF CHANGED:
- **Unauthorized users can access admin functions**
- **Cross-tenant access becomes possible**
- **Security completely compromised**

---

## 🔥 CRITICAL COMPONENT #7: TENANT-SPECIFIC ROUTING
**File:** `Commercenest/web/src/app/(site)/senlysh/products/[slug]/page.tsx`  
**Critical Level:** 🔴 HIGH - Feature-breaking

### 🚫 WHAT CAN NEVER BE CHANGED:

#### **Lines 11-18: Tenant Resolution Guard**
```typescript
// Resolve tenant dynamically (guardrails: avoid hardcoding tenant IDs)
const tenantId = await resolveTenantIdFromRequest()
if (!tenantId) {
  notFound()
}
```

#### **Lines 19-25: Database Query**
```typescript
const { data: product, error } = await fetchProductBySlug(tenantId, slug)

if (error || !product) {
  notFound()
}
```

### 💥 WHAT HAPPENS IF CHANGED:
- **Product detail pages break**
- **404 errors for valid products**
- **Tenant-specific content not found**
- **User experience completely broken**

---

## 🚨 EMERGENCY BREAK GLASS PROTOCOL

### **IF HOLY GRAIL CODE MUST BE CHANGED:**

1. **GET EXPLICIT WRITTEN APPROVAL** from project lead
2. **Document the exact change** and rationale in detail
3. **Create comprehensive backup** of current working state
4. **Test on staging first** with all test cases
5. **Have rollback plan ready**
6. **Monitor production closely** for 24 hours after deployment

### **WARNING SIGNS OF HOLY GRAIL BREAKAGE:**
- Admin panel showing "Loading admin..." forever
- Products not displaying on storefront
- Wrong tenant content appearing
- Authentication failures
- Badge filters not working
- 404 errors on valid pages

---

## 📞 SUPPORT CONTACTS
- **Project Lead:** [Contact Info]
- **DevOps:** [Contact Info]
- **Security Team:** [Contact Info]

**REMEMBER: This document exists because we've already broken the Holy Grail code multiple times and suffered the consequences. Don't repeat those mistakes.**
