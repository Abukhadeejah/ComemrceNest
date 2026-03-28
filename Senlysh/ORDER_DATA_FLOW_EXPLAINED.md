# Order Data Flow - Complete Explanation

## Question: Where do order details come from - Database or PhonePe?

**Answer: Order details come from the DATABASE. PhonePe only handles payment processing.**

---

## Complete Order Flow (Step by Step)

### 1. CHECKOUT - Order Creation
**File:** `src/app/api/checkout/route.ts`

When a customer clicks "Place Order":

```
Customer → Checkout Page → POST /api/checkout
```

**What happens:**
1. Calculate cart totals (products, tax, discounts, wallet deduction)
2. **CREATE ORDER IN DATABASE** with status `pending`
3. **INSERT ORDER ITEMS** (products, quantities, prices) into database
4. Store coupon usage (if applicable) as pending
5. Create PhonePe payment link
6. Redirect customer to PhonePe payment page

**Database Tables Updated:**
- `orders` table: New row with `status = 'pending'`
- `order_items` table: All products with quantities and prices
- `pending_coupon_usage` table: Coupon info (if used)

**Important Fields Saved:**
```typescript
{
  order_number: "phonepe_abc123_1234567890_xyz",
  tenant_id: "...",
  customer_id: "...",  // ✅ Customer linked from start
  status: "pending",
  total_cents: 50000,  // ₹500.00
  wallet_used_cents: 10000,  // ₹100.00
  cash_paid_cents: 40000,  // ₹400.00
  payment_provider: "phonepe",
  email: "customer@example.com",
  currency: "INR",
  coupon_id: "...",
  coupon_code: "SAVE20",
  discount_amount_cents: 5000  // ₹50.00
}
```

**Order Items Saved:**
```typescript
[
  {
    order_id: "...",
    product_id: "...",
    quantity: 2,
    unit_price_cents: 15000,  // ₹150.00 per item
    subtotal_cents: 30000  // ₹300.00 total
  },
  // ... more items
]
```

---

### 2. PAYMENT - Customer Pays via PhonePe
**External:** PhonePe Payment Gateway

Customer completes payment on PhonePe's website/app.

**PhonePe does NOT store:**
- Product details
- Quantities
- Customer address
- Order items

**PhonePe only knows:**
- Payment amount
- Transaction ID
- Success/Failure status

---

### 3. WEBHOOK - Payment Confirmation
**File:** `src/app/api/webhooks/phonepe/route.ts`

After payment, PhonePe sends a webhook to our server:

```
PhonePe → POST /api/webhooks/phonepe → Our Server
```

**What happens:**
1. Verify webhook signature (security check)
2. Extract payment status: `COMPLETED` or `FAILED`
3. **UPDATE ORDER STATUS** in database:
   - `COMPLETED` → `status = 'paid'`
   - `FAILED` → `status = 'failed'`
4. If payment successful (`paid`):
   - Debit wallet (if wallet was used)
   - Calculate and credit cashback
   - Mark coupon as used
   - Set `post_payment_processed = true` (prevents duplicate processing)

**Database Tables Updated:**
- `orders` table: `status` changed to `paid`, cashback fields updated
- `wallet_ledger` table: Wallet debit entry
- `wallet_ledger` table: Cashback credit entry
- `coupon_usage` table: Coupon marked as used
- `pending_coupon_usage` table: Marked as processed

**Idempotency Protection:**
- Webhook checks `post_payment_processed` flag
- If already `true`, returns success without processing again
- Prevents duplicate cashback/wallet deductions if PhonePe retries webhook

---

### 4. ORDER DETAILS PAGE - Display to User/Admin
**Files:**
- Admin: `src/app/(admin)/admin/orders/[id]/page.tsx`
- Customer: `src/app/(site)/orders/[orderId]/page.tsx`

When viewing order details:

```
User clicks "View Details" → Fetch from DATABASE → Display
```

**What happens:**
1. Query `orders` table by order ID
2. Join with `order_items` table to get products
3. Join with `products` table to get product names, images, SKUs
4. Display all information from database

**Data Source:**
```sql
SELECT 
  orders.*,
  order_items.*,
  products.name,
  products.sku,
  products.hero_image_url
FROM orders
JOIN order_items ON orders.id = order_items.order_id
JOIN products ON order_items.product_id = products.id
WHERE orders.id = '...'
```

**Everything displayed comes from database:**
- Order number
- Customer email
- Order status
- Total amount
- Wallet used
- Cash paid
- Cashback earned
- Product names
- Product quantities
- Product prices
- Product images
- SKU codes
- Variant info

---

### 5. INVOICE DOWNLOAD - PDF Generation
**File:** `src/app/api/orders/[orderId]/invoice/route.ts`

When user clicks "Download Invoice":

```
User clicks button → GET /api/orders/[id]/invoice → Generate PDF
```

**What happens:**
1. Fetch order from database (same as order details page)
2. Fetch order items with product details
3. Generate professional PDF invoice
4. Return PDF file for download

**Data Source:** 100% from database

---

## Summary: Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CHECKOUT                                                 │
│    Customer places order                                    │
│    ↓                                                         │
│    CREATE ORDER IN DATABASE (status: pending)               │
│    INSERT ORDER ITEMS IN DATABASE                           │
│    ↓                                                         │
│    Redirect to PhonePe                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PAYMENT                                                  │
│    Customer pays on PhonePe website                         │
│    (PhonePe only knows: amount, transaction ID)             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WEBHOOK                                                  │
│    PhonePe sends payment status to our server               │
│    ↓                                                         │
│    UPDATE ORDER STATUS IN DATABASE (pending → paid)         │
│    PROCESS WALLET DEDUCTION IN DATABASE                     │
│    PROCESS CASHBACK IN DATABASE                             │
│    MARK COUPON AS USED IN DATABASE                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ORDER DETAILS / INVOICE                                  │
│    User/Admin views order                                   │
│    ↓                                                         │
│    FETCH ALL DATA FROM DATABASE                             │
│    Display order details, products, quantities, prices      │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Points

1. **All order data is stored in YOUR database** (Supabase)
2. **PhonePe only handles payment processing** - it doesn't store product details
3. **Order is created BEFORE payment** with status `pending`
4. **Webhook updates order status** after payment confirmation
5. **Order details page reads from database** - not from PhonePe
6. **Invoice PDF is generated from database data** - not from PhonePe

---

## Database Tables Involved

### `orders` table
- Order metadata (number, status, totals, customer, payment info)
- Wallet and cashback amounts
- Coupon information

### `order_items` table
- Products in the order
- Quantities
- Unit prices
- Line totals

### `products` table
- Product names
- SKUs
- Images
- Pricing

### `wallet_ledger` table
- Wallet debit entries (payment)
- Wallet credit entries (cashback)

### `coupon_usage` table
- Records which coupons were used
- Discount amounts

### `pending_coupon_usage` table
- Temporary storage before payment confirmation
- Moved to `coupon_usage` after successful payment

---

## Why This Architecture?

1. **Reliability**: Order data persists even if PhonePe is down
2. **Flexibility**: Can switch payment providers without losing order history
3. **Features**: Can add custom fields (cashback, wallet, coupons) that PhonePe doesn't support
4. **Control**: Full control over order data and business logic
5. **Performance**: Fast queries from your database vs API calls to PhonePe

---

## Troubleshooting

### Order shows "pending" but payment was successful
- Check webhook logs in PhonePe dashboard
- Verify webhook URL is correct: `https://yourdomain.com/api/webhooks/phonepe`
- Check server logs for webhook errors
- Manually update order status if needed

### Order items not showing
- Check `order_items` table in database
- Verify items were inserted during checkout
- Check for errors in checkout API logs

### Cashback not credited
- Check `post_payment_processed` flag in orders table
- Verify webhook processed successfully
- Check `wallet_ledger` table for credit entry
- Review webhook logs for errors

---

**Created:** 2026-03-04
**Purpose:** Explain order data flow from checkout to display
