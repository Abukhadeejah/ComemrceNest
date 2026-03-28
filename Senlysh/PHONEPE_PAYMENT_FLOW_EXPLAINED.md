# PhonePe Payment Flow & Response Structure

## Overview
This document explains what PhonePe returns after payment completion and how it differs between test mode and production mode.

## Payment Flow

### 1. Payment Initiation
```typescript
// Your code creates a payment
const payRequest = StandardCheckoutPayRequest.builder()
  .merchantOrderId(orderId)        // Your order ID (e.g., "ORD_123456")
  .amount(amountCents)              // Amount in paise (e.g., 50000 = ₹500)
  .redirectUrl(successPageUrl)      // Where to redirect after payment
  .build()

const response = await phonepeClient.pay(payRequest)
// Returns: { redirectUrl, orderId, state }
```

### 2. User Payment Process
- User is redirected to PhonePe payment page
- User scans QR code or enters UPI details
- **TEST MODE**: User clicks "Success" or "Failure" button
- **PRODUCTION MODE**: User completes actual payment in their UPI app

### 3. PhonePe Webhook Callback
After payment completion, PhonePe sends a webhook to your server with the payment result.

## Webhook Response Structure

### Webhook Payload Format
```json
{
  "X-VERIFY": "checksum_signature_here",
  "response": "base64_encoded_data_here"
}
```

### Decoded Response Structure
After decoding the base64 `response` field:

```json
{
  "success": true,
  "code": "PAYMENT_SUCCESS",
  "message": "Your payment is successful.",
  "data": {
    "merchantId": "YOUR_MERCHANT_ID",
    "merchantTransactionId": "ORD_123456",
    "transactionId": "PHONEPE_TXN_ID_12345",
    "amount": 50000,
    "state": "COMPLETED",
    "responseCode": "SUCCESS",
    "paymentInstrument": {
      "type": "UPI",
      "utr": "123456789012"
    }
  }
}
```

## Payment States

PhonePe returns different `state` values based on payment outcome:

### 1. COMPLETED (Success)
```json
{
  "state": "COMPLETED",
  "code": "PAYMENT_SUCCESS",
  "responseCode": "SUCCESS"
}
```
**Your Action**: Mark order as `paid`

### 2. FAILED (Failure)
```json
{
  "state": "FAILED",
  "code": "PAYMENT_ERROR",
  "responseCode": "PAYMENT_DECLINED"
}
```
**Your Action**: Mark order as `failed`

### 3. PENDING (In Progress)
```json
{
  "state": "PENDING",
  "code": "PAYMENT_PENDING",
  "responseCode": "PENDING"
}
```
**Your Action**: Keep order as `pending`

## Test Mode vs Production Mode

### Test Mode Behavior

**What Happens:**
1. User clicks checkout → Redirected to PhonePe test page
2. User scans QR code → Sees "Success" and "Failure" buttons
3. User clicks "Success" → PhonePe **MAY OR MAY NOT** call your webhook
4. User is redirected to your success page

**⚠️ IMPORTANT TEST MODE ISSUES:**
- **Webhooks are unreliable** in test mode
- PhonePe test environment doesn't always call webhooks to localhost
- Orders may remain "pending" even after clicking "Success"
- You need to manually update order status in admin panel

**Test Mode Response:**
```json
{
  "state": "COMPLETED",  // If user clicked "Success"
  "code": "PAYMENT_SUCCESS",
  "data": {
    "merchantTransactionId": "ORD_123456",
    "transactionId": "TEST_TXN_12345",
    "amount": 50000,
    "state": "COMPLETED"
  }
}
```

### Production Mode Behavior

**What Happens:**
1. User clicks checkout → Redirected to PhonePe payment page
2. User scans QR code → Opens their UPI app (GPay, PhonePe, Paytm, etc.)
3. User enters UPI PIN → Payment processed by bank
4. PhonePe **RELIABLY** calls your webhook with result
5. User is redirected to your success page

**✅ Production Mode Advantages:**
- **Webhooks are reliable** and always called
- Real-time payment status updates
- Automatic order status changes
- Proper transaction IDs from banks

**Production Mode Response:**
```json
{
  "state": "COMPLETED",
  "code": "PAYMENT_SUCCESS",
  "data": {
    "merchantTransactionId": "ORD_123456",
    "transactionId": "PHONEPE_PROD_TXN_67890",
    "amount": 50000,
    "state": "COMPLETED",
    "paymentInstrument": {
      "type": "UPI",
      "utr": "123456789012"  // Real bank UTR number
    }
  }
}
```

## Your Current Implementation

### Webhook Handler Logic
```typescript
// File: src/app/api/webhooks/phonepe/route.ts

export async function POST(request: NextRequest) {
  // 1. Receive webhook
  const body = await request.json()
  
  // 2. Verify signature
  const webhookData = await verifyPhonePeWebhook(body)
  
  // 3. Extract payment details
  const merchantTransactionId = webhookData.data?.merchantTransactionId
  const state = webhookData.data?.state
  
  // 4. Determine order status
  let orderStatus: 'paid' | 'failed' | 'pending' = 'pending'
  
  if (state === 'COMPLETED') {
    orderStatus = 'paid'
  } else if (state === 'FAILED') {
    orderStatus = 'failed'
  }
  
  // 5. Update order in database
  await supabaseAdmin
    .from('orders')
    .update({ status: orderStatus })
    .eq('order_number', merchantTransactionId)
  
  // 6. If paid, process wallet deduction and cashback
  if (orderStatus === 'paid') {
    await processCouponUsage(merchantTransactionId)
    await processWalletAndCashbackForCompletedOrder(merchantTransactionId)
  }
}
```

## Status Mapping

| PhonePe State | Your Order Status | Description |
|---------------|-------------------|-------------|
| `COMPLETED` | `paid` | Payment successful, money received |
| `FAILED` | `failed` | Payment failed, no money received |
| `PENDING` | `pending` | Payment in progress or not completed |

## What Gets Processed on "Paid" Status

When order status changes to `paid`, your system automatically:

1. ✅ **Deducts wallet balance** (if wallet was used)
2. ✅ **Records coupon usage** (if coupon was applied)
3. ✅ **Calculates and credits cashback** (if user has active membership)
4. ✅ **Updates order with cashback details**

## Test Mode Workaround

Since webhooks are unreliable in test mode, you have a workaround:

### Manual Status Update (Admin Panel)
```typescript
// File: src/app/api/admin/orders/update-status/route.ts

// When admin changes order status to "paid", it triggers:
// 1. Wallet deduction
// 2. Cashback processing
// 3. Coupon usage recording
```

This is why you can manually mark orders as "paid" in the admin panel during testing.

## Environment Variables Required

```env
# PhonePe Configuration
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=UAT  # or PRODUCTION
PHONEPE_CALLBACK_URL=https://yourdomain.com/api/webhooks/phonepe
```

## Testing Checklist

### Test Mode Testing:
- [ ] Create order and initiate payment
- [ ] Click "Success" on PhonePe test page
- [ ] Check if webhook was called (may not be)
- [ ] Manually update order status in admin panel if needed
- [ ] Verify wallet deduction happens
- [ ] Verify cashback is credited

### Production Mode Testing:
- [ ] Create order with small amount (₹1-10)
- [ ] Complete real UPI payment
- [ ] Webhook should be called automatically
- [ ] Order status should update to "paid" automatically
- [ ] Wallet and cashback should process automatically
- [ ] No manual intervention needed

## Common Issues & Solutions

### Issue 1: Order Stays "Pending" in Test Mode
**Cause**: PhonePe test mode doesn't call webhooks to localhost
**Solution**: Manually update order status in admin panel

### Issue 2: Webhook Not Received
**Cause**: 
- Test mode limitation
- Incorrect callback URL
- Firewall blocking webhooks
**Solution**: 
- Use ngrok or similar for local testing
- Verify PHONEPE_CALLBACK_URL is publicly accessible
- Check server logs for webhook attempts

### Issue 3: Signature Verification Failed
**Cause**: Incorrect SALT_KEY or SALT_INDEX
**Solution**: Verify environment variables match PhonePe dashboard

## Summary

**Test Mode:**
- User clicks "Success" button
- Webhook **may not be called**
- Order stays "pending"
- Manual admin intervention needed
- Good for UI/UX testing only

**Production Mode:**
- User completes real payment
- Webhook **always called**
- Order automatically updates to "paid"
- Wallet and cashback processed automatically
- Fully automated flow

**Key Takeaway**: Test mode is for testing the payment UI flow, but you'll need to manually update order statuses. Production mode handles everything automatically through webhooks.
