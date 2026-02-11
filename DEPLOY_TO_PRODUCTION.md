# Deploy to Production - Quick Guide

## All Recent Fixes Ready to Deploy

The following fixes are ready to be deployed to production:

1. ✅ **Price ₹0 Bug Fix** - Sale price now uses MRP when left blank
2. ✅ **Product Edit Form Fix** - All fields load correctly (images, attributes, description)
3. ✅ **Sale Price Edit Fix** - Shows blank when only MRP was set
4. ✅ **Clone Product Fix** - Works in production
5. ✅ **Admin Signout Fix** - Redirects correctly
6. ✅ **Coupon Usage Limit** - Per-user usage limits

## Deployment Steps

### Option 1: Using Git (Recommended)

```bash
# 1. Check current status
git status

# 2. Add all changes
git add .

# 3. Commit with descriptive message
git commit -m "Fix: Product edit form and pricing issues

- Fix product edit form not loading images, attributes, and description
- Fix sale price showing MRP value in edit form
- Fix price showing as ₹0 when sale price left blank
- Fix clone product and admin signout issues
- Add coupon usage limit per user feature"

# 4. Push to main branch (triggers auto-deploy on Vercel)
git push origin main
```

### Option 2: Manual Vercel Deploy

```bash
# If you have Vercel CLI installed
vercel --prod
```

## After Deployment

### 1. Wait for Deployment (2-3 minutes)
- Check Vercel Dashboard
- Wait for "Ready" status
- Note the deployment URL

### 2. Clear Your Browser Cache
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

Or test in Incognito/Private mode

### 3. Verify Fixes

#### Test 1: Edit Form Loads Data
1. Go to Admin → Products
2. Click "Edit" on any product
3. **Verify:**
   - ✅ Images appear in Media section
   - ✅ Attributes are checked
   - ✅ Description is filled
   - ✅ All fields show correct values

#### Test 2: Sale Price Edit
1. Create product with only MRP (₹500)
2. Save
3. Edit
4. **Verify:** Sale price field is blank ✅

#### Test 3: Price Not ₹0
1. Create product with only MRP
2. Save
3. **Verify:** Product shows correct price (not ₹0) ✅

#### Test 4: Clone Product
1. Go to Admin → Products
2. Click clone button
3. **Verify:** Product clones successfully ✅

#### Test 5: Admin Signout
1. Click signout in admin panel
2. **Verify:** Redirects to login page ✅

## Troubleshooting

### If Changes Don't Appear

1. **Hard refresh:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear cache:** Browser settings → Clear browsing data
3. **Try Incognito mode**
4. **Check deployment:** Vercel dashboard → Verify latest commit is deployed
5. **Clear build cache:** Vercel settings → Clear build cache → Redeploy

### If Deployment Fails

1. Check Vercel deployment logs for errors
2. Check for TypeScript errors:
   ```bash
   npm run build
   ```
3. Fix any errors and push again

### If Still Not Working

Check the detailed troubleshooting guide:
- See `Senlysh/PRODUCTION_DEPLOYMENT_CHECKLIST.md`

## Environment Variables

Ensure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any PhonePe/payment gateway variables

## Files Changed in This Update

### Core Fixes
- `src/app/(admin)/admin/products/ProductForm.tsx`
- `src/app/(admin)/admin/products/components/AttributesSection.tsx`
- `src/app/(admin)/admin/products/components/PricingSection.tsx`
- `src/app/(admin)/admin/products/actions.ts`
- `src/app/(admin)/admin/products/[id]/edit/page.tsx`
- `src/app/(admin)/admin/products/ProductTable.tsx`
- `src/app/api/auth/signout/route.ts`
- `src/components/admin/layout/AdminHeader.tsx`
- `next.config.ts`

### Coupon Feature
- `src/app/(admin)/admin/coupons/CouponManager.tsx`

## Quick Deploy Command

```bash
git add . && git commit -m "Fix: Product edit form and pricing issues" && git push origin main
```

Then wait 2-3 minutes and hard refresh your browser!

---

**Need Help?** Check `Senlysh/PRODUCTION_DEPLOYMENT_CHECKLIST.md` for detailed troubleshooting.
