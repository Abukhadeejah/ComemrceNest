# Cost Price Fix - Quick Reference

## Problem
When editing a product, `cost_price_cents` disappears (becomes NULL).

## Root Causes
1. FormData skipped numeric fields with value 0
2. updatePayload included undefined values that overwrote database
3. Draft wasn't properly deleted after update

## Solutions Applied

### ✅ Fix #1: FormData Construction
- **File:** ProductForm.tsx, lines 285-290
- **Change:** Added else-if for value === 0 to always send numeric fields
- **Result:** cost_per_item_cents always in FormData

### ✅ Fix #2: Update Payload
- **File:** actions.ts, lines 903-965
- **Change:** Selective payload building, cost_per_item_cents always included
- **Result:** Undefined values don't overwrite database

### ✅ Fix #3: Draft Deletion
- **File:** ProductForm.tsx, lines 324-330
- **Change:** Proper async/await with try/catch
- **Result:** Draft deletion failures are logged and visible

## Key Console Logs

**When everything works correctly:**
```
🔴 COST PRICE AUDIT: cost_price_cents 5000 cents -> cost_per_item_cents 5000 [APPENDED TO FORMDATA]
🔴 COST PRICE FIX: Including cost_per_item_cents in updatePayload = 5000
🔴 COST PRICE UPDATE AUDIT: cost_per_item_cents in payload = 5000 [Will be sent to database]
🔴 COST PRICE UPDATE RESULT: Database returned cost_per_item_cents = 5000 [After update]
✅ Draft deleted after successful product update
```

**If something is wrong:**
```
⚠️ Failed to delete draft after update: [error]
[Missing any of the cost price logs above]
```

## Test Cases

| Scenario | Input | Expected Output | Log Contains |
|----------|-------|-----------------|--------------|
| Edit without change (non-zero) | cost: 500 | 500 preserved | "500 cents" |
| Edit without change (zero) | cost: 0 | 0 preserved | "cost_price_cents is 0" |
| Edit with change | cost: 500→600 | 600 updated | "600 cents" |
| Draft cleanup | After edit | Draft deleted | "Draft deleted" |

## Files to Check

1. **ProductForm.tsx** (lines 256-330)
   - FormData construction with 0-value handling
   - Draft deletion with error handling

2. **actions.ts** (lines 903-975)
   - buildUpdatePayload() function
   - Logging statements

## Deployment Steps

1. Deploy code to staging
2. Run test cases manually
3. Check console logs match expected output
4. Verify database values are correct
5. Deploy to production

## Monitoring

✅ **Good:** See cost price logs showing correct values
⚠️ **Warning:** See draft deletion errors
🔴 **Bad:** See cost_per_item_cents = null in database

## Documentation

- **COST_PRICE_CORRUPTION_FIX.md** - Complete problem analysis
- **COST_PRICE_FIX_BEFORE_AFTER.md** - Before/after code comparison
- **COST_PRICE_VERIFICATION.md** - Verification checklist

---

**Status: ✅ READY FOR TESTING**
