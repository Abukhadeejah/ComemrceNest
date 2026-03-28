-- Add PhonePe transaction ID column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_phonepe_transaction_id 
ON orders(phonepe_transaction_id);

-- Add comment
COMMENT ON COLUMN orders.phonepe_transaction_id IS 'PhonePe transaction ID for tracking payments';
