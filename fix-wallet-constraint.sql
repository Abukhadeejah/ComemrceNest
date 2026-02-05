-- Fix wallet_ledger constraint to allow CREDIT and DEBIT
-- Drop the existing constraint if it exists
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_entry_type_check;

-- Add the correct constraint allowing CREDIT and DEBIT
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_entry_type_check 
CHECK (entry_type IN ('CREDIT', 'DEBIT'));

-- Ensure wallet_accounts table exists with proper structure
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id, tenant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_customer ON wallet_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_accounts_tenant ON wallet_accounts(tenant_id);