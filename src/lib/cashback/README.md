# Cashback System

Complete implementation of a wallet-based cashback system where **cashback is calculated ONLY on cash paid**, excluding wallet money used.

## 🎯 Core Principle

```
Cashback = Cash Paid × Cashback%
(Wallet money gets ZERO cashback)
```

**Example:**
- Order: ₹100 (cost ₹70, profit 42.86%)
- Payment: ₹10 wallet + ₹90 cash
- Cashback slab: 15% (41-50% profit)
- **Cashback earned: ₹90 × 15% = ₹13.50** ✅
- NOT: ₹100 × 15% = ₹15.00 ❌

## 📁 File Structure

```
cashback/
├── cashbackEngine.ts       # Pure calculation functions
└── cashbackService.ts      # Database operations
```

## 🚀 Quick Start

### 1. Import and Use

```typescript
import { calculateCashback } from '@/lib/cashback/cashbackEngine'

const result = calculateCashback({
  totalSalePrice: 100,
  totalPurchasePrice: 70,
  walletUsed: 10,
  cashPaid: 90
})

console.log(result)
// {
//   profitPct: 42.86,
//   cashbackPct: 15,
//   cashbackAmount: 13.5  // ₹90 × 15%
// }
```

### 2. Process Order with Cashback

```typescript
import { processCashbackForOrder } from '@/lib/cashback/cashbackService'

const result = await processCashbackForOrder({
  tenantId: 'tenant-123',
  orderId: 'order-456',
  customerId: 'customer-789',
  totalSalePriceCents: 10000,
  totalPurchasePriceCents: 7000,
  walletUsedCents: 1000,
  cashPaidCents: 9000
})

console.log(result.cashbackEarned)  // 1350 cents = ₹13.50
```

## 📊 Cashback Slabs

| Profit % | Cashback % |
|----------|------------|
| 31–40%   | 10%        |
| 41–50%   | 15%        |
| 51–60%   | 20%        |
| 61–70%   | 25%        |
| 71–80%   | 30%        |
| 81–90%   | 35%        |
| 91–100%  | 40%        |
| 101–150% | 50%        |
| 151–200% | 50%        |
| 201–250% | 50%        |
| 251–300% | 55%        |
| 351–400% | 55%        |
| 451–500% | 55%        |

## 🔧 Available Functions

### cashbackEngine.ts (Pure Functions)

#### `calculateProfitPercentage(purchasePrice, salePrice)`
Returns profit percentage.

```typescript
calculateProfitPercentage(70, 100)  // 42.86
```

#### `getCashbackSlab(purchasePrice, salePrice)`
Returns profit % and matching cashback %.

```typescript
getCashbackSlab(70, 100)
// { profitPct: 42.86, cashbackPct: 15 }
```

#### `calculateCashback(orderData)`
**Main function** - Calculates cashback on cash paid only.

```typescript
calculateCashback({
  totalSalePrice: 100,
  totalPurchasePrice: 70,
  walletUsed: 10,
  cashPaid: 90
})
// { profitPct: 42.86, cashbackPct: 15, cashbackAmount: 13.5 }
```

#### `validatePaymentSplit(total, walletBalance, walletUsed, cashPaid)`
Validates payment before processing.

```typescript
validatePaymentSplit(100, 50, 30, 70)
// { valid: true }
```

#### `calculateMultiItemCashback(items, walletUsed, cashPaid)`
Calculates cashback for orders with multiple items.

```typescript
calculateMultiItemCashback(
  [
    { salePrice: 60, purchasePrice: 40, quantity: 1 },
    { salePrice: 40, purchasePrice: 30, quantity: 1 }
  ],
  10,
  90
)
// Returns overall cashback + per-item breakdown
```

#### Utility Functions
- `centsToRupees(cents)` - Convert cents to rupees
- `rupeesToCents(rupees)` - Convert rupees to cents
- `formatRupees(amount)` - Format as "₹XX.XX"

### cashbackService.ts (Database Operations)

#### `getActiveMembership(customerId, tenantId)`
Checks if customer has active membership.

```typescript
const membership = await getActiveMembership(customerId, tenantId)
if (membership) {
  // Customer eligible for cashback
}
```

#### `getWalletBalance(customerId, tenantId)`
Returns current wallet balance in cents.

```typescript
const balanceCents = await getWalletBalance(customerId, tenantId)
console.log(`Balance: ₹${balanceCents / 100}`)
```

#### `processCashbackForOrder(input)`
**Complete order flow** - Validates membership, calculates cashback, credits wallet.

```typescript
const result = await processCashbackForOrder({
  tenantId,
  orderId,
  customerId,
  totalSalePriceCents,
  totalPurchasePriceCents,
  walletUsedCents,
  cashPaidCents
})
```

#### `creditCashbackToWallet(accountId, tenantId, orderId, amount)`
Credits cashback to customer wallet.

#### `debitWalletForOrder(accountId, tenantId, orderId, amount)`
Debits wallet for order payment.

#### `getCashbackHistory(customerId, tenantId, limit)`
Returns customer's cashback transaction history.

#### `getCashbackStats(customerId, tenantId)`
Returns cashback statistics (total earned, average %).

#### `previewCashback(customerId, tenantId, ...)`
Preview cashback before order placement (for frontend).

## 🧪 Testing

### Run Unit Tests
```bash
npm test tests/cashback-engine.test.ts
```

### Quick Manual Test
```bash
node scripts/test-cashback.js
```

### Test Scenarios
1. Full cash → Full cashback ✅
2. Partial wallet → Cashback on cash only ✅
3. Full wallet → Zero cashback ✅
4. Profit 30.9% → 0% cashback ✅
5. Profit 31% → 10% cashback ✅
6. No membership → 0% cashback ✅

## 📖 Documentation

- **[Complete System Docs](../../docs/CASHBACK_SYSTEM.md)** - Full reference
- **[Quick Start Guide](../../docs/CASHBACK_QUICKSTART.md)** - 5-min setup
- **[Flow Diagrams](../../docs/CASHBACK_FLOW_DIAGRAMS.md)** - Visual guides
- **[Deployment Checklist](../../docs/CASHBACK_DEPLOYMENT_CHECKLIST.md)** - Go-live guide

## ⚠️ Important Notes

1. **Cashback is ONLY on cash paid**
   - Wallet usage gets zero cashback
   - Always calculate on `cashPaid`, not `totalSalePrice`

2. **Active membership required**
   - Cashback calculated but only credited if membership active
   - FREE membership auto-created on signup (valid 1 year)

3. **Cost price required**
   - All products MUST have `cost_price_cents` set
   - Without cost price, cashback calculation will fail

4. **Currency handling**
   - All database operations use cents (integer)
   - All calculations use rupees (decimal)
   - Convert appropriately: `rupeesToCents()` and `centsToRupees()`

## 🔒 Security

- ✅ Payment validation prevents overspending
- ✅ Membership verification before crediting
- ✅ Tenant isolation enforced
- ✅ Immutable transaction records
- ✅ Audit trail via cashback_transactions

## 🐛 Common Issues

### "Product has no cost price"
**Solution:** Set `cost_price_cents` for the product
```sql
UPDATE products SET cost_price_cents = 7000 WHERE id = 'prod-id';
```

### "Insufficient wallet balance"
**Solution:** Check balance before order
```typescript
const balance = await getWalletBalance(customerId, tenantId)
if (walletUsed > balance) {
  throw new Error('Insufficient balance')
}
```

### "No active membership"
**Solution:** Check membership status
```typescript
const membership = await getActiveMembership(customerId, tenantId)
if (!membership) {
  // Show message to customer
}
```

## 💡 Tips

1. **Maximize cashback:** Pay more with cash, less with wallet
2. **Strategic use:** Save wallet balance for low-profit items
3. **Monitor slabs:** Adjust pricing to hit higher cashback tiers
4. **Customer education:** Show preview prominently in checkout

## 📞 Support

For issues or questions:
1. Check test files for examples
2. Review complete documentation
3. Verify database migration completed
4. Check Supabase logs for errors

---

**Version:** 1.0.0  
**Status:** Production Ready ✅  
**Last Updated:** 2026-01-09
