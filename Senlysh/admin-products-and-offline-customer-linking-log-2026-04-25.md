# Implementation Log - 2026-04-25

## Scope
This log records two admin-side changes completed today:
1. Product list pagination improvements in Admin Products.
2. Create Order customer flow enhancement to optionally create online login access for offline customers.

## Change 1: Admin Products Pagination

### Objective
Allow admins to browse older products from the products listing with proper page controls.

### What was implemented
- Added reliable total row counting in products query to compute total pages.
- Added previous/next pagination controls and page number buttons.
- Added page-size selector (20, 50, 100).
- Added go-to-page input with Enter and Go button support.
- Preserved existing filter/search params while paging.
- Reset page to 1 when page size changes.

### Files updated
- src/app/(admin)/admin/products/actions.ts
- src/app/(admin)/admin/products/page.tsx
- src/app/(tenant-admin)/[tenant]/admin/products/page.tsx
- src/app/(admin)/admin/products/ProductPagination.tsx (new)

### Key behavior notes
- Query now requests exact count from Supabase select.
- Invalid page values are sanitized to page 1.
- Invalid pageSize values fallback to 20.

## Change 2: Create Order -> New Customer with Password

### Objective
From admin Create Order flow, support creating a new customer with login credentials so offline and online activity resolves to the same customer profile.

### What was implemented
- Added optional online access toggle in inline customer creation UI.
- Added password and confirm password fields when toggle is enabled.
- Added client-side validation:
  - email required when online access enabled
  - password minimum 8 characters
  - password confirmation must match
- Extended admin customers API payload to accept createOnlineAccess and password.
- Extended server customer creation logic to:
  - create Supabase Auth user when online access is requested
  - set user_id on customers row
  - link existing offline customers (without user_id) to newly created auth account
  - prevent duplicate linking if user_id already exists
  - ensure wallet account is present
  - rollback auth user on customer insert/update failure to avoid partial state

### Files updated
- src/components/admin/orders/OfflineOrderCreateForm.tsx
- src/app/api/admin/customers/route.ts
- src/server/admin/offlineOrders.ts

### Data consistency impact
- Offline orders, wallet ledger, and cashback are keyed by customer_id.
- Online customer APIs resolve customer by user_id.
- Linking user_id to the same customer row unifies offline and online history for that customer.

## Validation performed
- Type/error checks run on all touched files.
- No editor errors reported after implementation.

## Operational note
- This flow uses Supabase Admin auth user creation and assumes valid service role configuration in environment variables.

## Author
GitHub Copilot (GPT-5.3-Codex)
