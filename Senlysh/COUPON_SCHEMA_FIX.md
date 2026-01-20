# Fix: Missing 'discount_type' Column in Coupons Table

## Problem
The error "Could not find the 'discount_type' column of 'coupons' in the schema cache" indicates that the coupons table migration hasn't been executed or the table is missing required columns.

## Solution

You need to run the coupons system migration in your Supabase database.

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute the Migration**
   - Open the file: `migrations/create_coupons_system.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see "Success. No rows returned" or similar
   - The coupons table will now have all required columns including `discount_type`

### Option 2: Using Supabase CLI (If installed)

```bash
# Make sure you're in the project directory
cd f:\ComemrceNest\Commercenest\web

# Run the migration
supabase db push --include-all migrations/create_coupons_system.sql
```

### Option 3: Manual Table Creation

If you need to manually create just the coupons table, run this SQL:

```sql
-- Create coupons table with all required columns
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Coupon identification
  code VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount_cents INTEGER,
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Usage restrictions
  min_order_value_cents INTEGER DEFAULT 0,
  max_uses INTEGER,
  uses_per_customer INTEGER DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_coupon_code_per_tenant UNIQUE (tenant_id, code),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from),
  CONSTRAINT valid_max_discount CHECK (
    discount_type = 'fixed' OR max_discount_cents IS NULL OR max_discount_cents > 0
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(tenant_id, is_active);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
```

## Verification

After running the migration, test the API:

1. **Test GET endpoint:**
   ```bash
   # This should now work without errors
   curl http://localhost:3000/api/admin/coupons
   ```

2. **Test POST endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/coupons \
     -H "Content-Type: application/json" \
     -d '{
       "code": "TEST10",
       "description": "Test discount",
       "discount_type": "percentage",
       "discount_value": 10,
       "valid_from": "2026-01-01",
       "valid_until": "2026-12-31"
     }'
   ```

## What This Migration Creates

- **coupons table**: Main table for storing discount coupons
  - `discount_type`: 'percentage' or 'fixed' 
  - `discount_value`: The discount amount
  - `code`: Unique coupon code per tenant
  - Plus validity dates, usage limits, and more

- **coupon_usage table**: Tracks redemptions
- **Indexes**: For performance
- **RLS Policies**: For security
- **Helper Functions**: For validation and stats

## Files Involved

- Migration: `migrations/create_coupons_system.sql`
- API Route: `src/app/api/admin/coupons/route.ts`
- Schema Check: `scripts/check-coupons-schema.js`

## Need Help?

If you encounter any issues:
1. Check Supabase logs in the dashboard
2. Verify your database connection settings in `.env.local`
3. Ensure the `tenants` table exists (referenced by foreign key)
