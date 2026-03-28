# Juspay Migration Guide

## ✅ Completed Steps

### 1. Created Juspay Payment Service
- **File**: `src/server/payments/juspay.ts`
- Handles Juspay API integration
- Supports order creation, status checks, and refunds

### 2. Updated Checkout API
- **File**: `src/app/api/checkout/route.ts`
- Migrated from Razorpay to Juspay
- Returns payment URL and SDK payload

### 3. Created Juspay Webhook Handler
- **File**: `src/app/api/webhooks/juspay/route.ts`
- Handles payment success notifications
- Credits cashback to customer wallet

### 4. Database Migration
- **File**: `migrations/add_juspay_support.sql`
- Added `juspay_order_id` column
- Added `payment_id` column for transaction tracking

### 5. Updated Configuration
- **File**: `next.config.ts`
- Added Juspay API domains

## 🔧 Required Actions

### 1. Install Juspay SDK (Optional)
```bash
npm install juspay-express-checkout-sdk
```
*Note: The current implementation uses direct API calls, so SDK is optional*

### 2. Update Environment Variables

Add to `.env.local`:
```bash
# Juspay Credentials
JUSPAY_MERCHANT_ID=your_merchant_id_here
JUSPAY_API_KEY=your_api_key_here
JUSPAY_WEBHOOK_USERNAME=your_webhook_username
JUSPAY_WEBHOOK_PASSWORD=your_webhook_password
JUSPAY_ENVIRONMENT=sandbox  # or 'production'
```

Add to Vercel/Production:
- Go to Project Settings → Environment Variables
- Add all 5 Juspay variables above

### 3. Run Database Migration

```sql
-- Run this in your Supabase SQL Editor
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS juspay_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_juspay_order_id ON orders(juspay_order_id);
```

### 4. Update tenant_payment_settings Table

Add Juspay credentials for your tenant:
```sql
INSERT INTO tenant_payment_settings (
  tenant_id,
  provider,
  env,
  enabled,
  key_id,
  key_secret
) VALUES (
  'your-tenant-id',
  'juspay',
  'test',  -- or 'live'
  true,
  'your_merchant_id',
  'your_api_key'
);
```

### 5. Configure Juspay Webhook

In your Juspay dashboard:
1. Go to Webhooks settings
2. Add webhook URL: `https://yourdomain.com/api/webhooks/juspay`
3. Select events: `ORDER_COMPLETED`, `PAYMENT_SUCCESS`
4. Set authentication: Basic Auth with your webhook username/password

### 6. Update Frontend Checkout Flow

Your checkout component needs to:
1. Call `/api/checkout` to create order
2. Redirect user to `paymentUrl` or use `sdkPayload` for embedded checkout
3. Handle return URL after payment

Example:
```typescript
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amountPaise: 50000, // ₹500
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210'
    },
    items: [...],
    returnUrl: 'https://yourdomain.com/orders/success'
  })
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl; // Redirect to Juspay payment page
```

## 🔄 Key Differences: Razorpay vs Juspay

| Feature | Razorpay | Juspay |
|---------|----------|--------|
| Order Creation | `client.orders.create()` | `client.createOrder()` |
| Amount Format | Paise (integer) | Rupees (string with decimals) |
| Order ID | Auto-generated | You provide |
| Payment Flow | Modal/Redirect | Redirect/SDK |
| Webhook Auth | HMAC signature | Basic Auth |
| Webhook Event | `payment.captured` | `ORDER_COMPLETED` |

## 📝 Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Test order creation in sandbox
- [ ] Test webhook reception
- [ ] Test payment success flow
- [ ] Test cashback crediting
- [ ] Test order status updates
- [ ] Verify admin panel shows orders correctly

## 🚨 Rollback Plan

If you need to rollback to Razorpay:
1. Revert `src/app/api/checkout/route.ts` from git
2. Keep both webhook handlers active
3. Update environment variables back to Razorpay
4. Update `tenant_payment_settings` to use Razorpay

## 📚 Juspay Documentation

- API Docs: https://developer.juspay.in/docs
- Webhook Guide: https://developer.juspay.in/docs/webhooks
- SDK Integration: https://developer.juspay.in/docs/express-checkout

## 🆘 Support

If you encounter issues:
1. Check Juspay dashboard for order status
2. Check webhook logs in `/api/webhooks/juspay`
3. Verify environment variables are set correctly
4. Check database for order records
5. Review Juspay API response errors

---

**Migration Status**: ✅ Code Ready | ⏳ Configuration Pending
