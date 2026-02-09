# Clone Product & Admin Signout Fixes - COMPLETE

## Overview
Fixed two production issues:
1. ✅ Clone product not working in production
2. ✅ Admin signout showing "page not working" error

---

## Issue 1: Clone Product Not Working in Production

### Problem
- Clone product feature worked locally but failed in production
- Error: "Unexpected error during product cloning"
- Redirect errors being caught and swallowed

### Root Causes
Two issues were preventing the clone from working:

1. **Server Action**: Try-catch block catching redirect errors
2. **Client Component**: Wrong error detection (checking `message` instead of `digest`)

### Solutions Applied

#### Fix 1: Server Action (actions.ts)
**File**: `src/app/(admin)/admin/products/actions.ts`

Removed try-catch wrapper:
```typescript
// ❌ Before: Caught redirect errors
export async function cloneProduct(productId: string) {
  try {
    await assertTenantAdmin(tenantId)
    // ...
  } catch (error) {
    throw error  // Still caught the redirect!
  }
}

// ✅ After: Let redirects propagate
export async function cloneProduct(productId: string) {
  await assertTenantAdmin(tenantId)
  // ... rest of code
}
```

#### Fix 2: Client Component (ProductTable.tsx)
**File**: `src/app/(admin)/admin/products/ProductTable.tsx`

Fixed error detection and re-throw:
```typescript
// ❌ Before: Wrong check, swallowed error
catch (error: any) {
  if (error?.message?.includes('NEXT_REDIRECT')) {
    return  // Swallowed!
  }
}

// ✅ After: Correct check, re-throw
catch (error: any) {
  if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
    throw error  // Re-throw to allow redirect!
  }
}
```

### Why This Works
- Next.js redirect errors have `digest` property: `"NEXT_REDIRECT;push;/unauthorized;307;"`
- Must be re-thrown (not swallowed) for redirect to work
- Now redirects propagate correctly through the call stack

---

## Issue 2: Admin Signout Redirect Not Working ✅

### Problem
- Clicking "Sign out" showed "page not working" error
- Form-based redirect failing in production

### Solution

#### Part 1: API Route
**File**: `src/app/api/auth/signout/route.ts`

Changed to JSON response:
```typescript
// ❌ Before: HTTP redirect
return NextResponse.redirect(new URL(redirectUrl, baseUrl))

// ✅ After: JSON response
return NextResponse.json({ success: true, redirectUrl })
```

#### Part 2: Client Component
**File**: `src/components/admin/layout/AdminHeader.tsx`

Changed to JavaScript redirect:
```typescript
// ❌ Before: Form submission
<form action="/api/auth/signout" method="post">
  <button type="submit">Sign out</button>
</form>

// ✅ After: Fetch + window.location
<button onClick={async () => {
  const response = await fetch('/api/auth/signout', { method: 'POST' })
  const data = await response.json()
  window.location.href = data.redirectUrl || '/login'
}}>
  Sign out
</button>
```

---

## Files Modified

1. ✅ `src/app/(admin)/admin/products/actions.ts`
   - Removed try-catch from cloneProduct

2. ✅ `src/app/(admin)/admin/products/ProductTable.tsx`
   - Fixed error detection (digest vs message)
   - Re-throw redirect errors

3. ✅ `src/app/api/auth/signout/route.ts`
   - Return JSON instead of redirect

4. ✅ `src/components/admin/layout/AdminHeader.tsx`
   - Use fetch + window.location

---

## Testing

### Clone Product ✅
- [x] Login as admin
- [x] Go to Products page
- [x] Click clone button
- [x] Verify product cloned with "(Copy)" suffix
- [x] Verify draft status

### Admin Signout ✅
- [x] Click "Sign out" in admin
- [x] Redirects to `/login`
- [x] Session cleared

---

## Status
✅ **BOTH ISSUES FIXED**
✅ No TypeScript errors
✅ Ready for production

## Deployment
- No database changes
- No env variables needed
- Just deploy code
- Test after deployment

---

**All fixes complete and tested!**
