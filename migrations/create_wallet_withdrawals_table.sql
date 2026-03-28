-- Create wallet withdrawals table for tracking withdrawal requests
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  bank_details JSONB NOT NULL DEFAULT '{}',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_tenant_id ON wallet_withdrawals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_customer_id ON wallet_withdrawals(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_account_id ON wallet_withdrawals(account_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_requested_at ON wallet_withdrawals(requested_at);

-- Add RLS (Row Level Security)
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own withdrawals" ON wallet_withdrawals
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers 
      WHERE user_id = auth.uid() AND tenant_id = wallet_withdrawals.tenant_id
    )
  );

CREATE POLICY "Users can create their own withdrawals" ON wallet_withdrawals
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers 
      WHERE user_id = auth.uid() AND tenant_id = wallet_withdrawals.tenant_id
    )
  );

-- Admin policies (for tenant admins to manage withdrawals)
CREATE POLICY "Tenant admins can manage withdrawals" ON wallet_withdrawals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = wallet_withdrawals.tenant_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_wallet_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_withdrawals_updated_at
  BEFORE UPDATE ON wallet_withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_withdrawals_updated_at();