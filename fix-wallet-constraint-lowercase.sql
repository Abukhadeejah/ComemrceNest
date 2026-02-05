-- Fix wallet_ledger constraint to allow lowercase entry types
-- The existing data uses 'credit' and 'debit' (lowercase)
-- But the constraint was set to only allow 'CREDIT' and 'DEBIT' (uppercase)

-- Drop the existing constraint
ALTER TABLE wallet_ledger DROP CONSTRAINT IF EXISTS wallet_ledger_entry_type_check;

-- Add the correct constraint allowing lowercase entry types (which match existing data)
ALTER TABLE wallet_ledger ADD CONSTRAINT wallet_ledger_entry_type_check 
CHECK (entry_type IN ('credit', 'debit'));