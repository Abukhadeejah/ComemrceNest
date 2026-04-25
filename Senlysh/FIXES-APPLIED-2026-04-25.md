# Implementation Log — Follow-up Fixes
**Date**: April 25, 2026  
**Task**: Address incomplete and broken implementations from prior patch  
**Scope**: Pagination component, API auth handling, customer linking error paths

---

## FINDINGS

Code inspection confirmed the following issues in the prior patch:

| Issue | Location | Problem |
|-------|----------|---------|
| Pagination infinite loop | ProductPagination.tsx:27 | useEffect dependency array includes goToPage (new function every render), triggering infinite cycles when page out-of-bounds |
| Phone-linking auth rollback error ignored | offlineOrders.ts:325 | deleteUser() called without capturing error; email and new-customer paths had explicit handling |
| Phone-linking wallet handling missing | offlineOrders.ts:330 | ensureWalletAccount() has no try/catch; email and new-customer paths had proper error wrapping |
| API route using page-route auth | customers/route.ts:22 | assertTenantAdmin() uses redirect() semantics instead of JSON error responses appropriate for API endpoints |

These were distinct from prior work. Earlier fixes verified as correctly implemented:
- Hardcoded tenant ID removed
- Admin role enforcement present
- Client email validation regex correct
- Password length validation present
- Email field updated during customer linking

---

## FILES MODIFIED

- `src/app/api/admin/customers/route.ts`
- `src/app/(admin)/admin/products/ProductPagination.tsx`
- `src/server/admin/offlineOrders.ts`

---

## CHANGES

### Pagination: Remove infinite loop trigger

**File**: ProductPagination.tsx, lines 18–32  
**Problem**: useEffect with goToPage in dependency array creates infinite loop when page exceeds totalPages. Each render generates new goToPage function reference; useEffect sees dependency change; calls goToPage; triggers re-render; loop continues.

**Change**:
- Removed auto-redirect logic from useEffect
- Simplified effect to sync pageInput with page prop only
- Moved page clamping logic into display calculations (startItem, endItem) where it only affects rendered values, not navigation
- Result: Invalid page values no longer trigger re-navigation, but display ranges remain correct

Explicit user navigation via goToPage() button click still works as intended.

---

### Phone-linking path: Capture auth user rollback error

**File**: offlineOrders.ts, lines 324–327  
**Problem**: If customer linking fails after auth user creation, deleteUser() called but error discarded. Leaves orphaned auth user in system. Email-linking and new-customer paths already had explicit error capture and logging.

**Change**:
- Capture error from deleteUser()
- Log error with context (authUserId, customerId, deleteError)
- Throw original linking error after logging

This matches the pattern already used in email-linking and new-customer paths.

---

### Phone-linking path: Add wallet error handling

**File**: offlineOrders.ts, lines 330–333  
**Problem**: ensureWalletAccount() call has no error wrapper. If wallet creation fails, entire operation fails. Email-linking and new-customer paths wrap this in try/catch with graceful degradation.

**Change**:
- Wrap ensureWalletAccount() in try/catch
- Log error if wallet creation fails
- Return customer regardless (wallet failure does not prevent customer creation/linking)

This assumes wallet may be auto-created on first order and is not a hard pre-condition for customer existence.

---

### API route: Return JSON error responses instead of redirecting

**File**: customers/route.ts, lines 1–40  
**Problem**: assertTenantAdmin() function uses redirect() on auth errors, appropriate for page routes but not API routes. API clients need JSON status codes, not redirect directives.

**Change**:
- Import assertTenantAdminApi instead of assertTenantAdmin
- Wrap auth check in try/catch
- Return NextResponse.json with status 401 or 403 on auth failure
- Preserves auth enforcement but uses correct response semantics for API context

The assertTenantAdminApi helper throws TenantAdminAuthError with status codes already set.

---

## VALIDATION

### Type checking
```
npx tsc --noEmit
```
No TypeScript errors on modified files. Strict mode passes.

### Linting
```
npx eslint src/app/api/admin/customers/route.ts \
  "src/app/(admin)/admin/products/ProductPagination.tsx" \
  src/server/admin/offlineOrders.ts
```
No style or syntax issues reported.

### Scenario testing

Tested the following specific scenarios to validate behaviour:

| Scenario | Outcome |
|----------|---------|
| Pagination: ?page=1 with normal data | Display shows correct range, no issues |
| Pagination: ?page=999 with totalPages=2 | Display clamps to page 2, shows correct range, no loops or freezing |
| Pagination: ?page=1 with count=0 | Display shows "0 of 0", no crashes |
| Pagination: Page change with existing search params | Search and filter params preserved in new URL |
| API: Unauthenticated POST /api/admin/customers | Returns JSON 401 response |
| API: Non-admin authenticated POST | Returns JSON 403 response |
| API: Admin authenticated POST with valid input | Customer created successfully |
| Phone linking: Customer link succeeds, wallet fails | Customer linked successfully, error logged, operation completes |
| Phone linking: Customer link succeeds, deleteUser fails during rollback | Error logged with context, operation fails correctly on link failure |
| All three customer paths: Consistent error patterns | Auth rollback and wallet handling follow same patterns across phone, email, and new customer paths |

Validation limited to these specific scenarios. Broader integration testing not performed.

---

## DECISIONS

### Pagination validation moved to display layer only

The auto-redirect logic was creating the infinite loop. Removed it entirely. Page clamping now happens only when computing display values (startItem/endItem), not when deciding whether to navigate.

Reasoning: If backend query returns an invalid page value, that is a backend validation problem. Component should handle it gracefully (which it now does) but should not try to auto-correct the URL in a way that triggers re-navigation. Explicit user clicks on page buttons still navigate correctly.

Risk: If the backend pagination query itself does not validate the page parameter, invalid pages will display as clamped ranges rather than being silently corrected. This is preferable to crashing or looping, but indicates a broader validation gap upstream.

---

### Phone-linking wallet failure: graceful degradation

Phone-linking path now wraps ensureWalletAccount() in try/catch and returns customer even if wallet creation fails (same pattern as email-linking and new-customer paths).

Reasoning: Wallet is treated as an operational convenience, not a pre-condition for customer existence. If wallet fails to create, customer is still valid. Wallet may auto-create on first transaction.

Assumption: The business logic actually supports this. If wallet *must* exist at creation time, then all three paths should fail fast instead of degrading gracefully. This needs confirmation from business requirements.

---

### API auth: switch to API-safe helper

Changed from assertTenantAdmin (redirects) to assertTenantAdminApi (throws typed error).

Reasoning: API routes must return JSON with appropriate status codes. Next.js redirect() is semantically wrong in API context. assertTenantAdminApi throws TenantAdminAuthError with status already set, allowing clean JSON response handling.

Risk: Low. The helper already exists and is designed for this use case. Error types match existing patterns elsewhere in codebase.

---

## REMAINING RISKS & ASSUMPTIONS

### Wallet auto-creation timing

The phone-linking path now returns a customer even if ensureWalletAccount() fails. This assumes the wallet can be created later (e.g., on first transaction).

Status: Assumption, not confirmed. If wallet *must* exist at customer creation time to satisfy business invariants, then graceful degradation is wrong and all three paths should fail fast instead.

Action needed: Confirm with product/business whether wallet auto-creation timing is acceptable.

---

### Page validation at backend

Component gracefully handles out-of-bounds page values but does not auto-correct the URL. If the backend getProducts() query doesn't validate the page parameter, then invalid pages will display clamped ranges rather than silently moving to a valid page.

Status: Low priority but indicates a validation gap. Currently safe (component won't crash), but suboptimal user experience.

Action needed: Review getProducts() implementation to confirm it validates page parameter.

---

### Tenant resolution in API route

API route still depends on resolveTenantIdFromRequest() to extract the tenant ID. If that function has issues (e.g., corrupted cookie, missing tenant context), auth checks cannot help.

Status: Pre-existing, not introduced by these changes. But worth noting as a dependency.

---

### Broader integration testing

Validation covered isolated scenarios but not full end-to-end flows. Specifically:
- Full pagination workflow with various data sizes
- Customer creation flow with actual offline→online upgrade scenario
- Concurrent requests to auth endpoint
- Error recovery paths under load

Status: Not tested. Code changes appear sound but integration behaviour in production load is unknown.

---

## SUMMARY

### What was fixed
1. Pagination infinite loop removed by stripping auto-redirect logic
2. Phone-linking auth rollback error now captured and logged
3. Phone-linking wallet failure now handled gracefully with logging
4. API route auth now returns JSON 401/403 instead of redirects

### What was validated
- TypeScript strict mode: pass
- Linting: pass
- 10 specific scenarios: no issues in tested cases
- Three customer-linking paths: consistent error handling

### What remains unknown
- Wallet auto-creation timing is an assumption, not confirmed with business
- Broader integration testing (load, concurrency, edge cases) not performed
- Backend page validation status unknown
- Production deployment impact unknown

### Prior patch claims vs. actual state

The prior patch claimed "6 targeted fixes" and "All changes pass TypeScript strict mode." Reality:
- 4 fixes were implemented correctly; 2 were incomplete (pagination broken, phone-linking paths missing error handling)
- TypeScript doesn't catch React hook dependency issues, so strict mode passing didn't catch the infinite loop

Current work addresses the 4 identified issues. Changes are type-safe and pass linting but have not undergone production testing.
