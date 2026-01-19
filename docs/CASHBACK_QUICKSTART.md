# Cashback System - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration
```bash
# Copy the SQL migration content
# File: migrations/create_cashback_system.sql

# Go to Supabase Dashboard → SQL Editor → New Query
# Paste the migration and run it
```

### Step 2: Set Product Costs
```sql
-- Example: Set cost for all products
UPDATE products 
SET cost_price_cents = FLOOR(price_cents * 0.7)  -- 70% of price
WHERE cost_price_cents IS NULL;
```

### Step 3: Test It!
```typescript
// Create a test order
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'test-customer-id',
    items: [
      { productId: 'product-1', quantity: 1 }
    ],
    walletUsedRupees: 0  // Use full cash
  })
})

const { order } = await response.json()
console.log('Cashback earned:', order.cashback.earned / 100)
```

## 📊 Key Concepts

### 1. Cashback ONLY on Cash Paid
```
Order: ₹100
Payment: ₹10 wallet + ₹90 cash
Cashback: ₹90 × 15% = ₹13.50 ✅
NOT: ₹100 × 15% = ₹15.00 ❌
```

### 2. Profit-Based Slabs
```
Cost: ₹70, Price: ₹100
Profit: (100-70)/70 = 42.86%
Slab: 41-50% → 15% cashback
```

### 3. Active Membership Required
```
Customer → Free Membership (1 year)
          ↓
    Active? → Yes → Cashback Credited ✅
          ↓
    Active? → No → Cashback ₹0 ❌
```

## 🎯 Testing Scenarios

### Test 1: Full Cash → Full Cashback
```typescript
// Setup
const order = {
  totalSalePrice: 100,
  totalPurchasePrice: 70,  // 42.86% profit
  walletUsed: 0,
  cashPaid: 100
}

// Expected Result
{
  profitPct: 42.86,
  cashbackPct: 15,
  cashbackAmount: 15.0  // ₹100 × 15%
}
```

### Test 2: Partial Wallet → Cashback on Cash Only
```typescript
const order = {
  totalSalePrice: 100,
  totalPurchasePrice: 70,
  walletUsed: 10,
  cashPaid: 90
}

// Expected Result
{
  cashbackAmount: 13.5  // ₹90 × 15%, NOT ₹100 × 15%
}
```

### Test 3: Full Wallet → Zero Cashback
```typescript
const order = {
  totalSalePrice: 100,
  totalPurchasePrice: 70,
  walletUsed: 100,
  cashPaid: 0
}

// Expected Result
{
  cashbackAmount: 0  // No cash paid!
}
```

### Test 4: Edge Case - 30.9% Profit
```typescript
const order = {
  totalSalePrice: 130.9,
  totalPurchasePrice: 100,  // 30.9% profit
  walletUsed: 0,
  cashPaid: 130.9
}

// Expected Result
{
  profitPct: 30.9,
  cashbackPct: 0,  // Below 31% threshold
  cashbackAmount: 0
}
```

### Test 5: Edge Case - 31% Profit
```typescript
const order = {
  totalSalePrice: 131,
  totalPurchasePrice: 100,  // 31% profit
  walletUsed: 0,
  cashPaid: 131
}

// Expected Result
{
  profitPct: 31.0,
  cashbackPct: 10,  // First slab!
  cashbackAmount: 13.1  // ₹131 × 10%
}
```

## 🔧 API Quick Reference

### Create Order with Cashback
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "items": [
      { "productId": "prod-1", "quantity": 1 }
    ],
    "walletUsedRupees": 10
  }'
```

### Get Wallet Balance
```bash
curl http://localhost:3000/api/wallet?customerId=customer-123
```

### Preview Cashback
```bash
curl -X POST http://localhost:3000/api/wallet/preview-cashback \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-123",
    "totalSalePriceCents": 10000,
    "totalPurchasePriceCents": 7000,
    "walletUsedCents": 1000,
    "cashPaidCents": 9000
  }'
```

### Get Cashback Stats
```bash
curl http://localhost:3000/api/wallet/cashback-stats?customerId=customer-123
```

## 📱 Frontend Integration

### Basic Checkout
```tsx
import WalletCheckout from '@/components/checkout/WalletCheckout'

function CheckoutPage() {
  const handleSubmit = async (data) => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerId: user.id,
        items: cartItems,
        walletUsedRupees: data.walletUsedRupees
      })
    })
    
    if (response.ok) {
      const { order } = await response.json()
      alert(`Order placed! Cashback: ₹${order.cashback.earned / 100}`)
    }
  }
  
  return (
    <WalletCheckout
      customerId={user.id}
      items={cartItems}
      onSubmit={handleSubmit}
    />
  )
}
```

## 🐛 Common Issues

### Issue: "Product has no cost price"
**Fix:** Set cost_price_cents for all products
```sql
UPDATE products SET cost_price_cents = 7000 WHERE id = 'prod-id';
```

### Issue: "Insufficient wallet balance"
**Fix:** Check wallet balance before order
```typescript
const { balance } = await fetch(`/api/wallet?customerId=${id}`).then(r => r.json())
if (walletUsed > balance.cents / 100) {
  alert('Insufficient wallet balance')
}
```

### Issue: No cashback credited
**Check:**
1. ✅ Membership is active?
2. ✅ Profit % > 31%?
3. ✅ Cash paid > 0?

## 📈 Monitoring Queries

### Total Cashback Given Today
```sql
SELECT 
  COUNT(*) as orders,
  SUM(cashback_amount_cents) / 100 as total_rupees
FROM cashback_transactions
WHERE created_at::date = CURRENT_DATE;
```

### Average Cashback %
```sql
SELECT AVG(cashback_pct) as avg_cashback
FROM cashback_transactions
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Top Customers by Cashback Earned
```sql
SELECT 
  customer_id,
  COUNT(*) as orders,
  SUM(cashback_amount_cents) / 100 as total_earned
FROM cashback_transactions
GROUP BY customer_id
ORDER BY total_earned DESC
LIMIT 10;
```

## 🎓 Learning Path

1. ✅ Read [CASHBACK_SYSTEM.md](./CASHBACK_SYSTEM.md) - Full documentation
2. ✅ Run database migration
3. ✅ Try the test scenarios above
4. ✅ Review test files for more examples
5. ✅ Integrate WalletCheckout component
6. ✅ Monitor cashback transactions

## 💡 Pro Tips

1. **Maximize Cashback:** Pay more with cash, less with wallet
2. **Strategic Wallet Use:** Save cashback for low-profit items
3. **Monitor Slabs:** Adjust pricing to hit higher cashback tiers
4. **Customer Education:** Show cashback preview prominently

---

**Need Help?** Check the comprehensive [CASHBACK_SYSTEM.md](./CASHBACK_SYSTEM.md) documentation.
