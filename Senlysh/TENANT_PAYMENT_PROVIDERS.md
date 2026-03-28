# Tenant-Specific Payment Providers

**Date:** January 21, 2026  
**Status:** ✅ DOCUMENTED  

## 🏢 Tenant Configuration

### Senlysh
- **Payment Provider**: PhonePe
- **Configuration**: `src/tenants/senlysh/config.ts`
- **Webhook Handler**: `src/app/api/webhooks/phonepe/route.ts`
- **Environment Variables**:
  ```bash
  PHONEPE_MERCHANT_ID=your_merchant_id
  PHONEPE_SALT_KEY=your_salt_key
  PHONEPE_SALT_INDEX=1
  PHONEPE_ENV=SANDBOX # or PRODUCTION
  ```

### Bluebell
- **Payment Provider**: Razorpay
- **Configuration**: `src/tenants/bluebell/config.ts`
- **Webhook Handler**: `src/app/api/webhooks/razorpay/route.ts`
- **Environment Variables**:
  ```bash
  RAZORPAY_KEY_ID=your_key_id
  RAZORPAY_KEY_SECRET=your_key_secret
  RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
  ```

## 🔄 Payment Flow

### Senlysh (PhonePe)
1. Customer applies coupon in checkout
2. Checkout API creates PhonePe payment
3. Customer completes payment on PhonePe
4. PhonePe webhook confirms payment
5. Coupon usage is recorded automatically

### Bluebell (Razorpay)
1. Customer applies coupon in checkout
2. Checkout API creates Razorpay order
3. Customer completes payment via Razorpay
4. Razorpay webhook confirms payment
5. Coupon usage is recorded automatically

## 🎯 Coupon System Integration

The coupon system works seamlessly with both payment providers:

### Common Components
- **Coupon Validation**: `src/app/api/coupons/validate/route.ts`
- **Admin Interface**: `src/app/(admin)/admin/coupons/`
- **Usage Service**: `src/lib/coupons/usageService.ts`
- **Database Schema**: Same for both tenants

### Provider-Specific Components
- **PhonePe Webhook**: Handles Senlysh coupon completion
- **Razorpay Webhook**: Handles Bluebell coupon completion
- **Checkout Integration**: Automatically routes to correct provider

## 🧪 Testing by Tenant

### Senlysh Testing
```bash
# Access Senlysh admin
http://localhost:3000/senlysh/admin/coupons

# Test Senlysh checkout with PhonePe
http://localhost:3000/senlysh/checkout
```

### Bluebell Testing
```bash
# Access Bluebell admin
http://localhost:3000/bluebell/admin/coupons

# Test Bluebell checkout with Razorpay
http://localhost:3000/bluebell/checkout
```

## 🔧 Configuration Details

### Payment Provider Resolution
The system automatically determines the payment provider based on tenant configuration:

```typescript
// From src/server/payments.ts
export async function getPaymentProvider(tenantId: string): Promise<PaymentProvider> {
  const tenantIdToKey: Record<string, string> = {
    '11111111-1111-4111-8111-11111111bb01': 'bluebell',  // Razorpay
    '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c': 'senlysh',   // PhonePe
  }
  
  const tenantKey = tenantIdToKey[tenantId]
  const config = getTenantConfig(tenantKey)
  return config?.payments?.provider || 'razorpay'
}
```

### Tenant Config Files
```typescript
// Senlysh config
payments: {
  provider: 'phonepe'
}

// Bluebell config  
payments: {
  provider: 'razorpay'
}
```

## 🚨 Important Notes

1. **Webhook URLs**: Each payment provider needs its webhook URL configured:
   - PhonePe: `https://yourdomain.com/api/webhooks/phonepe`
   - Razorpay: `https://yourdomain.com/api/webhooks/razorpay`

2. **Environment Variables**: Both sets of credentials can coexist in the same environment

3. **Coupon Validation**: Works the same for both tenants - provider is determined at checkout

4. **Database**: Single coupon system serves both tenants with proper tenant isolation

## 🔍 Troubleshooting

### Senlysh Issues (PhonePe)
- Check PhonePe environment variables
- Verify PhonePe webhook configuration
- Monitor PhonePe webhook logs

### Bluebell Issues (Razorpay)
- Check Razorpay environment variables
- Verify Razorpay webhook secret
- Monitor Razorpay webhook logs

### Common Issues
- Tenant ID mapping in `getPaymentProvider()`
- Coupon module enabled for both tenants
- Database permissions and RLS policies