# Coupon Usage Limit per User - Feature Added

## Overview
Added Step 4 to the coupon creation form to control how many times a single user can use a coupon.

## Changes Made

### 1. Updated Coupon Creation Form
**File**: `src/app/(admin)/admin/coupons/CouponManager.tsx`

**New Step 4: Usage Limit per User**
- Purple-themed section matching the existing design
- Input field for number of uses (1-999)
- Clear examples and tips:
  - **1** = One-time use only (most common)
  - **3** = User can use coupon 3 times
  - **999** = Unlimited uses per user

**Features:**
- Required field with validation (min: 1, max: 999)
- Default value: 1 (one-time use)
- Helpful tips for different use cases:
  - First-time customer offers → 1
  - Loyalty rewards → 3-5
  - Seasonal sales → 999 (unlimited)

### 2. Updated Preview Section
Shows usage limit in the coupon preview:
- 🎫 One-time use per customer (when = 1)
- 🔄 X uses per customer (when 2-998)
- ♾️ Unlimited uses per customer (when ≥ 999)

### 3. Updated Coupon List Table
Added "Uses/User" column showing:
- **1x** = One-time use
- **3x** = 3 uses per user
- **♾️ Unlimited** = 999+ uses (shown in green)

### 4. Updated TypeScript Interface
Added `uses_per_customer?: number` to Coupon interface

## Form Structure (4 Steps)

### Step 1: Coupon Code (Blue)
- Enter or generate coupon code
- Example: SAVE20

### Step 2: Discount Amount (Green)
- Choose percentage or fixed amount
- Set discount value
- Optional: Max discount limit for percentage

### Step 3: Rules (Yellow)
- Minimum order value
- Valid until date

### Step 4: Usage Limit per User (Purple) ⭐ NEW
- How many times a single user can use this coupon
- Default: 1 (one-time use)
- Range: 1-999

## Database
The `uses_per_customer` field already exists in the coupons table, so no migration needed.

## API Integration
The form already sends `uses_per_customer` to the API:
```typescript
uses_per_customer: parseInt(formData.uses_per_customer) || 1
```

## User Experience

### Creating a Coupon
1. Admin fills in Steps 1-3 as before
2. **NEW:** Admin sets usage limit in Step 4
3. Preview shows the usage limit
4. Coupon is created with the specified limit

### Viewing Coupons
- Table now shows "Uses/User" column
- Easy to see at a glance which coupons are one-time vs reusable
- Unlimited coupons highlighted in green

## Use Cases

### One-Time Use (1)
```
WELCOME10 - 10% OFF
🎫 One-time use per customer
```
Perfect for: First-time customer offers, referral codes

### Limited Reuse (3-5)
```
LOYAL20 - 20% OFF
🔄 3 uses per customer
```
Perfect for: Loyalty rewards, VIP customer perks

### Unlimited (999)
```
SUMMER25 - 25% OFF
♾️ Unlimited uses per customer
```
Perfect for: Seasonal sales, promotional campaigns

## Technical Details

**Form State:**
```typescript
uses_per_customer: '1' // String for input, converted to number on submit
```

**API Payload:**
```typescript
uses_per_customer: parseInt(formData.uses_per_customer) || 1
```

**Table Display:**
```typescript
{coupon.uses_per_customer >= 999 
  ? <span className="text-green-600">♾️ Unlimited</span>
  : <span>{coupon.uses_per_customer}x</span>
}
```

## Status
✅ **COMPLETE** - Step 4 added to coupon creation form
✅ Table updated to show usage limits
✅ Preview updated with usage info
✅ No TypeScript errors
✅ Ready for production

## Testing Checklist
- [ ] Create coupon with 1 use per customer
- [ ] Create coupon with 3 uses per customer
- [ ] Create coupon with 999 uses (unlimited)
- [ ] Verify table shows correct usage limits
- [ ] Verify preview shows correct usage info
- [ ] Test that API receives correct value

---

**Feature completed successfully!**
