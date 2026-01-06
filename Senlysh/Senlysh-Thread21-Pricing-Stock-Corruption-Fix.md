# Senlysh Thread 21 - Pricing/Stock Overwrite Fix

## Session Date
January 6, 2026

## Issue
Editing an existing product could overwrite pricing/stock fields with unintended values (0 or null). In `updateProduct`, missing FormData numeric fields were coerced to 0/null and written back, so an edit with empty inputs (or missing keys) could clobber existing data. This risk matched the observed corruption of `price_cents`, `compare_at_price_cents`, `cost_per_item_cents`, and `stock`.

## Root Cause
`updateProduct` parsed numerics with default fallbacks:
```ts
price_cents: formData.get('price_cents') ? parseInt(...) : 0,
compare_at_price_cents: ... : null,
stock: ... : 0,
```
When a field was absent/empty, the update payload still set these columns to 0/null, overwriting the row.

## Fix
- Added safe parsers that return `undefined` when the FormData field is absent/empty.
- Built an explicit `updatePayload` and log to ensure only provided values are sent.
- Numeric fields now stay untouched if not present in FormData, preventing accidental clobbering.

## Files Changed
- `src/app/(admin)/admin/products/actions.ts`
  - Parse numeric fields with `parseIntOrUndefined`/`parseFloatOrUndefined`.
  - Construct `updatePayload` to avoid defaulting to 0/null for missing fields.
  - Added debug log with productId, tenantId, and payload.

## Verification Notes
- Re-edit products and confirm pricing/stock stay unchanged unless explicitly modified.
- Inspect server logs for `[updateProduct]` entries to confirm single-row updates and correct payloads.

## Next Steps
- Review draft autosave flows to ensure drafts are not reused across products.
- Remove debug logs after verifying stability.
