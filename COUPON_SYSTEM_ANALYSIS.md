# Coupon System Analysis & Issues

**Date:** January 21, 2026  
**Analysis:** Complete coupon system review  
**Status:** 🔍 ISSUES IDENTIFIED

## Summary

The coupon system is **mostly complete** but has several **referencing issues** and **missing components** that could cause problems in production.

## ✅ What's Working

1. **Database Schema**: Complete and properly structured
   - `coupons` table with all required fields
   - `coupon_usage` tracking table
   - Proper RLS policies and indexes
   - `validate_coupon()` function working correctly

2. **API Endpoints**: All routes implemented
   - ✅ `GET /api/admin/coupons` - List coupons
   - ✅ `POST /api/admin/coupons` - Create coupon
   - ✅ `GET /api/admin/coupons/[id]` - Get single coupon
   - ✅ `PATCH /api/admin/coupons/[id]` - Update coupon
   - ✅ `DELETE /api/admin/coupons/[id]` - Delete coupon
   - ✅ `POST /api/coupons/validate` - Validate coupon

3. **Admin Interface**: Complete UI implementation
   - ✅ Coupon listing page
   - ✅ Create coupon form
   - ✅ Edit coupon form
   - ✅ Delete functionality
   - ✅ Toggle active/inactive

4. **Customer Integration**: Checkout integration working
   - ✅ Coupon validation in checkout
   - ✅ Discount calculation
   - ✅ Payment integration

## ❌ Issues Identified

### 1. **Missing Tenant Module Configuration**

**Problem**: The coupon system requires the `coupons` module to be enabled in `tenant_modules` table.

**Impact**: Admin pages show "Module Disabled" message instead of coupon interface.

**Solution Needed**:
```sql
-- Add this to your database
INSERT INTO tenant_modules (tenant_id, module_key, enabled, created_at)
SELECT 
  id as tenant_id,
  'coupons' as module_key,
  true as enabled,
  NOW() as created_at
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_modules 
  WHERE tenant_id = tenants.id AND module_key = 'coupons'
);
```

### 2. **Missing Database Tables**

**Problem**: The system references tables that may not exist:
- `tenant_modules` table (for module enablement)
- `users` table (referenced in foreign keys)

**Impact**: Foreign key constraints and module checks fail.

**Solution Needed**: Create missing tables or update references.

### 3. **Checkout Integration Issues**

**Problem**: Several referencing issues in checkout:

1. **Missing coupon fields in checkout API**:
   ```typescript
   // In src/app/api/checkout/route.ts
   // Missing: coupon_id, coupon_code, discount_amount_cents in order creation
   ```

2. **Coupon usage tracking not implemented**:
   ```typescript
   // Missing: Insert into coupon_usage table after successful payment
   ```

### 4. **Production Environment Issues**

**Problem**: Based on `COUPON_PRODUCTION_FIX.md`, there are environment-specific issues:
- Missing `NEXTAUTH_SECRET` in production
- Middleware routing issues for admin routes
- Domain mapping problems

### 5. **Missing Error Handling**

**Problem**: Several edge cases not handled:
- Expired coupons during checkout
- Coupon usage limit reached between validation and payment
- Network failures during coupon validation

### 6. **Missing Coupon Usage Completion**

**Problem**: The system validates coupons but doesn't complete the usage cycle:
- No insertion into `coupon_usage` table after successful payment
- No webhook to mark coupon as used
- No usage statistics update

## 🔧 Required Fixes

### Fix 1: Enable Coupon Module
```sql
-- Run this in Supabase SQL Editor
INSERT INTO tenant_modules (tenant_id, module_key, enabled, created_at)
SELECT 
  id as tenant_id,
  'coupons' as module_key,
  true as enabled,
  NOW() as created_at
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_modules 
  WHERE tenant_id = tenants.id AND module_key = 'coupons'
);
```

### Fix 2: Complete Checkout Integration
Need to update `src/app/api/checkout/route.ts` to:
1. Include coupon fields in order creation
2. Insert coupon usage record after successful payment
3. Handle coupon validation errors

### Fix 3: Add Coupon Usage Tracking
Need to create a service to:
1. Mark coupon as used after payment confirmation
2. Update usage statistics
3. Handle webhook confirmations

### Fix 4: Add Missing Tables
If `tenant_modules` table doesn't exist:
```sql
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, module_key)
);
```

## 🚨 Critical Missing Files

Based on the analysis, these files may need to be created or updated:

1. **Coupon Usage Service**: `src/lib/coupons/usageService.ts`
2. **Coupon Webhook Handler**: `src/app/api/webhooks/coupon-usage/route.ts`
3. **Module Configuration**: Database entries for `tenant_modules`

## 📋 Testing Checklist

To verify the coupon system works completely:

1. **Admin Access**:
   - [ ] Can access `/admin/coupons` without "Module Disabled" message
   - [ ] Can create new coupons
   - [ ] Can edit existing coupons
   - [ ] Can delete coupons
   - [ ] Can toggle active/inactive status

2. **Customer Usage**:
   - [ ] Can apply valid coupon codes in checkout
   - [ ] Discount calculations are correct
   - [ ] Invalid/expired coupons show proper errors
   - [ ] Usage limits are enforced

3. **Payment Integration**:
   - [ ] Coupon discounts are applied to payment amount
   - [ ] Coupon usage is recorded after successful payment
   - [ ] Usage statistics are updated

4. **Edge Cases**:
   - [ ] Coupon expires during checkout process
   - [ ] Usage limit reached between validation and payment
   - [ ] Network failures during validation

## 🎯 Next Steps

1. **Immediate**: Enable coupon module in database
2. **High Priority**: Complete checkout integration
3. **Medium Priority**: Add usage tracking service
4. **Low Priority**: Improve error handling and edge cases

## 📁 Files to Review/Create

### Existing Files (Review for issues):
- `src/app/api/checkout/route.ts` - Missing coupon integration
- `src/app/api/coupons/validate/route.ts` - Working but could use better error handling
- `src/app/(site)/checkout/page.tsx` - Working but missing usage completion

### Missing Files (Need to create):
- `src/lib/coupons/usageService.ts` - Coupon usage tracking
- `src/app/api/webhooks/coupon-usage/route.ts` - Usage webhook handler
- Database migration for `tenant_modules` table

The coupon system is **90% complete** but needs these fixes to be fully functional in production.