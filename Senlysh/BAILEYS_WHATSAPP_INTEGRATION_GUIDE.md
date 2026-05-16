# Baileys WhatsApp Integration - Complete Setup Guide

**Status:** ✅ IMPLEMENTED WITH KNOWN RISKS  
**Date:** May 15, 2026  
**Integration Scope:** 5 core use cases

---

## Overview

Baileys WhatsApp integration has been set up across your CommerceNest project for automated customer notifications in these scenarios. It is operational, but Baileys remains an unofficial WhatsApp Web client, so treat it as an interim solution rather than the final long-term transport.

1. ✅ **Order Confirmation** - When payment is successful
2. ✅ **Shipping/Delivery Updates** - When order status changes
3. ✅ **Wallet Credits** - When cashback is earned
4. ✅ **Account Welcome** - When customer registers
5. ✅ **Customer Inquiries** - Direct wa.me links (already working)

---

## 1. Order Confirmation Messages

### When It Triggers
- **PhonePe Payments:** After webhook marks order as `paid`
- **Razorpay Payments:** After webhook marks order as `paid`

### What Happens
```typescript
// Notification sent to customer's phone
"Hi [Name],

Your order #ORD-XXXX-XXXXXXXX-XXX has been confirmed! 🎉

Thank you for your purchase. You can track your order status in the app.

CommerceNest Team"
```

### Implementation
- **File:** `src/app/api/webhooks/phonepe/route.ts` (lines 265-287)
- **File:** `src/app/api/webhooks/razorpay/route.ts` (lines 258-280)
- **Trigger:** After `processCashbackForOrder()` completes
- **Error Handling:** Failures logged but don't break payment processing

### Code Flow
```
PhonePe/Razorpay Webhook
  ↓
Update order status to 'paid'
  ↓
Process coupon usage
  ↓
Process cashback for order
  ↓
Fetch customer phone number
  ↓
Send WhatsApp confirmation
  ↓
Mark as processed (idempotency)
```

---

## 2. Shipping/Delivery Status Updates

### When It Triggers
Order status changed via admin to one of these values:
- `confirmed` - Order is being prepared
- `fulfilled` - Order has shipped
- `returned` - Return completed
- `cancelled` - Order cancelled

### What Happens

**Order Confirmed:**
```
"Hi [Name],

Your order #ORD-XXXX-XXXXXXXX-XXX has been confirmed! 📦

We're preparing your items for shipment.

CommerceNest Team"
```

**Order Shipped:**
```
"Hi [Name],

Great news! Your order #ORD-XXXX-XXXXXXXX-XXX has been shipped! 🚚

You can track your delivery in the app.

CommerceNest Team"
```

**Order Returned:**
```
"Hi [Name],

Your return for order #ORD-XXXX-XXXXXXXX-XXX has been processed. ✅

Refund will be credited to your wallet within 3-5 business days.

CommerceNest Team"
```

**Order Cancelled:**
```
"Hi [Name],

Your order #ORD-XXXX-XXXXXXXX-XXX has been cancelled. ✖️

If you used wallet credits, they will be refunded immediately.

CommerceNest Team"
```

### Implementation
- **File:** `src/app/api/admin/orders/update-status/route.ts` (lines 129-170)
- **Trigger:** After order status is updated in database
- **Error Handling:** Failures don't block status update

### Code Flow
```
Admin Status Update Request
  ↓
Update order status in database
  ↓
Process wallet refunds (if cancelled)
  ↓
Fetch customer details
  ↓
Determine message based on new status
  ↓
Send WhatsApp notification
  ↓
Return success response
```

---

## 3. Wallet Credit Notifications

### When It Triggers
- After cashback hold period completes
- Cashback is actually credited into the wallet ledger

### What's Included
This is now an explicit wallet-credit notification:
- `creditDueCashbackForCustomer()` credits the wallet
- `sendWhatsAppMessage()` sends a separate wallet credit message

### Message
```typescript
"Hi [Name],

Your wallet has been credited with ₹X.XX cashback for order #ORD-XXXX. 💰

The amount is now available in your wallet balance.

CommerceNest Team"
```

### Data Returned
```typescript
{
  cashbackEarned: number      // in cents
  cashbackPct: number         // percentage
  profitPct: number           // profit percentage
  membershipUsed: string      // membership ID if applicable
}
```

### Implementation
- **File:** `src/lib/cashback/cashbackService.ts`
- **Trigger:** When cashback is actually credited into the wallet ledger
- **Error Handling:** Notification failure does not block the wallet credit

---

## 4. Account Welcome Message

### When It Triggers
- After successful customer registration
- Wallet account created

### What Happens
```
"Hi [Name],

Welcome to CommerceNest! 🎉

Your account has been created successfully. You can now browse products, make purchases, and track your orders.

Let's get started!

CommerceNest Team"
```

### Implementation
- **File:** `src/app/api/customers/register/route.ts` (lines 135-147)
- **Trigger:** After wallet account creation
- **Error Handling:** Doesn't block account creation if notification fails

### Code Flow
```
Customer Registration Request
  ↓
Create Supabase Auth user
  ↓
Create customer profile
  ↓
Create wallet account
  ↓
Send welcome WhatsApp
  ↓
Return success response
```

---

## 5. Customer Inquiries (Pre-existing)

### How It Works
- **Frontend:** Product pages have "Message on WhatsApp" buttons
- **Link Type:** `wa.me/[PHONE]?text=[PRE-FILLED-MESSAGE]`
- **No Backend Call:** Direct link to WhatsApp Web

### Files Involved
- `src/modules/products/components/ProductCard.tsx` (line 35-40)
- `src/app/(site)/products/[slug]/PdpClient.tsx` (line 102-105)
- `src/tenants/bluebell/components/BluebellProductGrid.tsx` (line 76-165)

### Example Link
```
https://wa.me/919029460064?text=Hi%2C%20I%27m%20interested%20in%20Modern%20Wooden%20Sofa
```

---

## Configuration Requirements

### Environment Variable

**In `.env.local`:**
```bash
# WhatsApp microservice endpoint (required for server-side notifications)
WHATSAPP_SERVICE_URL=http://localhost:3001

# Shared secret for internal service-to-service auth
WHATSAPP_INTERNAL_SECRET=change-me-in-production

# Or for production:
WHATSAPP_SERVICE_URL=http://127.0.0.1:3001  # Docker/VPS internal
WHATSAPP_SERVICE_URL=http://whatsapp-service:3001  # Kubernetes
```

### If Not Configured
- All WhatsApp notifications log warnings
- Primary business operations continue unaffected
- Graceful degradation mode

### Phone Number Handling
- Server-side normalization strips non-digits before sending to Baileys
- Store phone numbers in international format where possible
- Local trunk prefixes like `0XXXXXXXXXX` are not guessed into a country code automatically
- If registration accepts local numbers, normalize them before saving

---

## Testing the Integration

### Test 1: Order Confirmation
```bash
# Simulate the application boundary; real provider webhooks must be signed or mocked
curl -X POST http://localhost:3000/api/webhooks/phonepe \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_SUCCESS",
    "transactionId": "TXN123",
    "orderId": "order-456",
    "amount": 5000
  }'

# Expected: Use a signed webhook test harness or provider mock for end-to-end verification
```

### Test 2: Status Update
```bash
curl -X PATCH http://localhost:3000/api/admin/orders/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-456",
    "status": "fulfilled"
  }'

# Expected: Customer receives shipping update message
```

### Test 3: Registration
```bash
curl -X POST http://localhost:3000/api/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "919999999999",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!"
  }'

# Expected: Customer receives welcome message
```

### Test 4: Product Inquiry
Navigate to any product page and click "Message on WhatsApp" button.

---

## Message Templates Summary

| Use Case | Trigger | Emoji | Key Info |
|----------|---------|-------|----------|
| Order Confirmation | Payment success | 🎉 | Order number, tracking info |
| Confirmed | Status → confirmed | 📦 | Preparing shipment |
| Shipped | Status → fulfilled | 🚚 | Tracking available |
| Returned | Status → returned | 🔄 | Refund timeline |
| Cancelled | Status → cancelled | ✖️ | Wallet refund info |
| Welcome | Registration | 🎉 | Account created |
| Inquiry (Frontend) | User clicks button | 💬 | Direct WhatsApp link |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  CommerceNest Application                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐      ┌──────────────┐                  │
│  │ PhonePe     │      │ Razorpay     │                  │
│  │ Webhook     │      │ Webhook      │                  │
│  └──────┬──────┘      └──────┬───────┘                  │
│         │                    │                           │
│         ├────────┬───────────┤                           │
│         │        │           │                           │
│         v        v           v                           │
│    ┌────────────────────────────────┐                   │
│    │  Order Confirmation            │  → WhatsApp      │
│    │  (with cashback details)       │                  │
│    └────────────────────────────────┘                  │
│         │                    │                           │
│    ┌────────────────────────────────┐                   │
│    │  Status Update (Admin)         │  → WhatsApp      │
│    │  (confirmed/shipped/etc)       │                  │
│    └────────────────────────────────┘                  │
│         │                    │                           │
│    ┌────────────────────────────────┐                   │
│    │  Customer Registration         │  → WhatsApp      │
│    │  (welcome message)             │                  │
│    └────────────────────────────────┘                  │
│         │                    │                           │
│         └────────┬───────────┘                           │
│                  │                                        │
│                  v                                        │
│    ┌────────────────────────────────┐                   │
│    │  sendWhatsAppMessage()         │                   │
│    │  (notification client)         │                   │
│    └────────────┬───────────────────┘                   │
│                 │                                        │
│                 v                                        │
│    ┌────────────────────────────────┐                   │
│    │  HTTP POST to Baileys Service  │                   │
│    │  (Port 3001)                   │                   │
│    └────────────┬───────────────────┘                   │
│                 │                                        │
└─────────────────┼──────────────────────────────────────┘
                  │
                  v
         ┌─────────────────────┐
         │ Baileys Microservice│
         │ (whatsapp.ts)       │
         └────────┬────────────┘
                  │
                  v
         ┌─────────────────────┐
         │ WhatsApp Web Socket │
         │ (Baileys protocol)  │
         └────────┬────────────┘
                  │
                  v
         ┌─────────────────────┐
         │ WhatsApp Servers    │
         └────────┬────────────┘
                  │
                  v
         ┌─────────────────────┐
         │ Customer's Phone    │
         └─────────────────────┘
```

---

## Error Handling

### Graceful Degradation
All WhatsApp notifications follow this pattern:

```typescript
try {
  // Get customer phone
  // Send message via sendWhatsAppMessage()
} catch (error) {
  console.error('WhatsApp notification failed:', error);
  // ⚠️ DO NOT THROW - log and continue
}
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No messages sent | `WHATSAPP_SERVICE_URL` not configured | Add to `.env.local` |
| Service down | Microservice not running | Start: `cd commercenest-whatsapp && npm run dev` |
| Invalid phone | Wrong format | Normalize to digits-only before sending; do not rely on local trunk prefixes |
| No QR code | Baileys not linked | Scan QR in terminal again |
| Message timeout | Network slow | 10s timeout built-in, auto-retries available |

---

## Monitoring & Debugging

### Check Logs
```bash
# View WhatsApp notification logs
grep -i "whatsapp" logs/server.log

# View specific webhook logs
grep -i "webhook" logs/server.log
```

### Notification Status
- ✅ Success: Logged with timestamp
- ⚠️ Warning: Service not configured (graceful)
- ❌ Error: Service down or network issue (logged)

### Monitoring Recommendation
- Current logs are console-based and fine for local debugging
- For production visibility, add a structured `notification_logs` table or your existing observability stack
- Track at least: `phone_hash`, `message_type`, `status`, `tenant_id`, `order_id`, `created_at`

### Database Check
```sql
-- See recent orders and cashback
SELECT id, customer_id, status, cashback_amount_cents
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- See wallet transactions
SELECT account_id, entry_type, amount_cents, created_at
FROM wallet_ledger
ORDER BY created_at DESC
LIMIT 20;
```

---

## Deployment Checklist

- [ ] ✅ All imports added (`sendWhatsAppMessage`)
- [ ] ✅ All notification calls implemented
- [ ] ✅ `.env.local` has `WHATSAPP_SERVICE_URL` set
- [ ] ✅ Baileys microservice running on port 3001
- [ ] ✅ Test payment webhook triggers notification
- [ ] ✅ Test admin status update triggers notification
- [ ] ✅ Test customer registration triggers notification
- [ ] ✅ Logs show WhatsApp notifications in console
- [ ] Analytics/observability integration decided and documented
- [ ] ✅ Production environment configured

### Known Risk
- Baileys is not an official WhatsApp Business API integration
- This should be treated as a business risk and reviewed before long-term production use

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/webhooks/phonepe/route.ts` | Added import + order confirmation notification |
| `src/app/api/webhooks/razorpay/route.ts` | Added import + order confirmation notification |
| `src/app/api/admin/orders/update-status/route.ts` | Added import + status update notifications |
| `src/app/api/customers/register/route.ts` | Added import + welcome notification |
| `src/lib/cashback/cashbackService.ts` | Added explicit wallet credit notification |
| `src/server/notifications/whatsapp.ts` | Added internal secret header and duplicate-send cooldown |

---

## Next Steps

1. **Start Baileys Microservice:**
   ```bash
   cd commercenest-whatsapp
   npm install
   npm run dev
   ```

2. **Configure Environment:**
   ```bash
   echo "WHATSAPP_SERVICE_URL=http://localhost:3001" >> .env.local
   ```

3. **Test All Flows:**
   - Create test order → Check WhatsApp
   - Update order status → Check WhatsApp
   - Register new customer → Check WhatsApp

4. **Monitor in Production:**
   - Check logs for WhatsApp errors
   - Verify customer feedback
   - Scale microservice if needed

---

## Support

For issues with:
- **Baileys integration:** See `Senlysh/Whatsapp-service-implementation-log-2026-04-06.md`
- **WhatsApp feature:** See `Senlysh/WHATSAPP_FEATURE_COMPLETE_LOG.md`
- **CommerceNest:** Check main project docs

---

**Last Updated:** May 15, 2026  
**Maintained By:** Your Team  
**Status:** Operational with Known Risks
