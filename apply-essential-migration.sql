-- Essential migration to fix user orders and cashback
-- Apply this in Supabase SQL Editor

-- 1. Add customer_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- 2. Add cashback fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS wallet_used_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cash_paid_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cashback_pct DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cashback_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_purchase_price_cents INTEGER,
ADD COLUMN IF NOT EXISTS total_profit_pct DECIMAL(10,2);

-- 3. Create memberships table (simplified)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  membership_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Add membership_id to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES memberships(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_memberships_customer ON memberships(customer_id);

-- 6. Update existing orders to set cash_paid_cents = total_cents (for existing orders)
UPDATE orders 
SET cash_paid_cents = total_cents 
WHERE cash_paid_cents = 0 AND total_cents > 0;

-- 7. Create default memberships for existing customers
INSERT INTO memberships (tenant_id, customer_id, membership_type, is_active)
SELECT DISTINCT c.tenant_id, c.id, 'FREE', true
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM memberships m 
  WHERE m.customer_id = c.id AND m.tenant_id = c.tenant_id
)
ON CONFLICT DO NOTHING;

-- 8. Link existing orders to customers by email
UPDATE orders 
SET customer_id = c.id
FROM customers c
WHERE orders.email = c.email 
  AND orders.customer_id IS NULL
  AND orders.email != 'guest@example.com';

COMMIT;