# Cashback System Documentation

## Overview

Complete cashback system implementation where **cashback is ONLY calculated on cash paid**, NOT on wallet amount used.

## Business Rules

### Core Principle
**Cashback = Cash Paid × Cashback%**

- Wallet money used → **ZERO cashback**
- Cash paid → **Full cashback** based on profit margin

### Example
Product: ₹100, cost ₹70 (42.86% profit)
- Payment: ₹10 wallet + ₹90 cash
- Cashback slab: 15% (41-50% profit range)
- **Cashback earned: ₹90 × 15% = ₹13.50** (NOT ₹100 × 15%)

## Cashback Slabs

| Profit % Range | Cashback % |
|----------------|------------|
| 31–40%         | 10%        |
| 41–50%         | 15%        |
| 51–60%         | 20%        |
| 61–70%         | 25%        |
| 71–80%         | 30%        |
| 81–90%         | 35%        |
| 91–100%        | 40%        |
| 101–150%       | 50%        |
| 151–200%       | 50%        |
| 201–250%       | 50%        |
| 251–300%       | 55%        |
| 351–400%       | 55%        |
| 451–500%       | 55%        |

### Edge Cases
- Profit **30.9%** → **0% cashback** (below threshold)
- Profit **31.0%** → **10% cashback** (first slab)

## User Journey

### 1. Customer Signup
```
New Customer → User Created
              ↓
        Wallet Account (₹0 balance)
              ↓
        FREE Membership (valid 1 year)
```

### 2. First Order (Full Cash)
```
Order: ₹100 (profit 42.86%)
Payment: ₹0 wallet + ₹100 cash
         ↓
Cashback: ₹100 × 15% = ₹15
         ↓
Wallet: ₹0 → ₹15
```

### 3. Second Order (Using Cashback)
```
Order: ₹200 (profit 42.86%)
Payment: ₹15 wallet + ₹185 cash
         ↓
Cashback: ₹185 × 15% = ₹27.75 (NOT ₹200 × 15%)
         ↓
Wallet: ₹15 - ₹15 + ₹27.75 = ₹27.75
```

### 4. Order Paid Fully from Wallet
```
Order: ₹50
Payment: ₹50 wallet + ₹0 cash
         ↓
Cashback: ₹0 × 15% = ₹0 (no cash paid!)
         ↓
Wallet: ₹27.75 - ₹50 = -₹22.25 (insufficient, order fails)
```

## Database Schema

### Tables Created

#### `memberships`
- Tracks customer membership status
- FREE membership auto-created on signup
- Valid for 1 year by default

#### `cashback_transactions`
- Records every cashback calculation
- Links to order and membership
- Tracks wallet vs cash split

#### `cashback_slabs`
- Reference table for profit → cashback mapping
- Pre-populated with business rules

#### `orders` (updated)
New columns:
- `total_purchase_price_cents` - Total cost of goods
- `total_profit_pct` - Calculated profit %
- `wallet_used_cents` - Amount paid from wallet
- `cash_paid_cents` - Amount paid in cash
- `cashback_pct` - Cashback % applied
- `cashback_amount_cents` - Actual cashback credited
- `membership_id` - Membership used for cashback

### Database Functions

#### `get_cashback_percentage(profit_pct)`
Returns cashback % for given profit %

#### `create_default_membership()`
Trigger: Auto-creates wallet + membership on customer signup

#### View: `v_wallet_balances`
Real-time wallet balance calculation

## API Endpoints

### Order Creation
```typescript
POST /api/orders
Body: {
  customerId: string
  items: Array<{
    productId: string
    quantity: number
  }>
  walletUsedRupees: number
}

Response: {
  order: {
    id: string
    orderNumber: string
    totalCents: number
    walletUsedCents: number
    cashPaidCents: number
    cashback: {
      earned: number  // In cents
      percentage: number
      profitPercentage: number
      membershipUsed: boolean
    }
  }
}
```

### Wallet Balance
```typescript
GET /api/wallet?customerId={id}

Response: {
  balance: {
    cents: number
    rupees: string
    formatted: string  // "₹123.45"
  }
  recentTransactions: Array<{...}>
}
```

### Cashback Preview
```typescript
POST /api/wallet/preview-cashback
Body: {
  customerId: string
  totalSalePriceCents: number
  totalPurchasePriceCents: number
  walletUsedCents: number
  cashPaidCents: number
}

Response: {
  eligible: boolean
  reason?: string
  profitPct: number
  cashbackPct: number
  cashbackAmount: number  // In cents
}
```

### Cashback Statistics
```typescript
GET /api/wallet/cashback-stats?customerId={id}

Response: {
  stats: {
    totalEarned: { cents, rupees, formatted }
    totalOrders: number
    averagePercentage: number
  }
  recentCashback: Array<{...}>
}
```

## Frontend Components

### WalletCheckout
Interactive checkout with:
- Real-time wallet balance display
- Wallet usage slider
- Payment split visualization
- Live cashback preview
- Quick select buttons (No Wallet, Half, Max)

```tsx
import WalletCheckout from '@/components/checkout/WalletCheckout'

<WalletCheckout
  customerId="user-id"
  items={[
    {
      productId: "prod-1",
      productName: "Product Name",
      quantity: 1,
      priceCents: 10000,  // ₹100
      costCents: 7000     // ₹70
    }
  ]}
  onSubmit={({ walletUsedRupees, cashPaidRupees }) => {
    // Process payment
  }}
/>
```

## Code Structure

```
src/
├── lib/
│   └── cashback/
│       ├── cashbackEngine.ts      # Pure calculation functions
│       └── cashbackService.ts     # Database operations
├── app/
│   └── api/
│       ├── orders/
│       │   └── route.ts           # Order creation with cashback
│       └── wallet/
│           ├── route.ts           # Wallet balance
│           ├── transactions/
│           ├── cashback-stats/
│           └── preview-cashback/
└── components/
    └── checkout/
        └── WalletCheckout.tsx     # Frontend checkout UI

migrations/
└── create_cashback_system.sql     # Database setup

tests/
├── cashback-engine.test.ts        # Unit tests
└── cashback-service.test.ts       # Integration tests
```

## Installation & Setup

### 1. Run Database Migration
```sql
-- Execute in Supabase SQL Editor
-- File: migrations/create_cashback_system.sql
```

This creates:
- ✅ `memberships` table
- ✅ `cashback_transactions` table
- ✅ `cashback_slabs` table (with data)
- ✅ Updated `orders` table
- ✅ Database functions and triggers
- ✅ RLS policies

### 2. Update Product Costs
Ensure all products have `cost_price_cents` set:

```sql
UPDATE products 
SET cost_price_cents = 7000  -- Example: ₹70
WHERE cost_price_cents IS NULL;
```

### 3. Test the System

```bash
# Run unit tests
npm test tests/cashback-engine.test.ts

# Run integration tests (requires test DB)
NODE_ENV=test npm test tests/cashback-service.test.ts
```

## Usage Examples

### Calculate Cashback (Backend)
```typescript
import { calculateCashback } from '@/lib/cashback/cashbackEngine'

const result = calculateCashback({
  totalSalePrice: 100,
  totalPurchasePrice: 70,  // 42.86% profit
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

### Process Order with Cashback
```typescript
import { processCashbackForOrder } from '@/lib/cashback/cashbackService'

const result = await processCashbackForOrder({
  tenantId: 'tenant-123',
  orderId: 'order-456',
  customerId: 'customer-789',
  totalSalePriceCents: 10000,    // ₹100
  totalPurchasePriceCents: 7000, // ₹70
  walletUsedCents: 1000,         // ₹10
  cashPaidCents: 9000            // ₹90
})

console.log(result)
// {
//   cashbackEarned: 1350,  // ₹13.50 in cents
//   cashbackPct: 15,
//   profitPct: 42.86,
//   membershipUsed: 'membership-id',
//   transactionId: 'txn-id'
// }
```

### Frontend Checkout
```typescript
// In your checkout page
const handleCheckout = async (data) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: session.user.id,
      items: cartItems,
      walletUsedRupees: data.walletUsedRupees
    })
  })
  
  const order = await response.json()
  console.log('Cashback earned:', order.order.cashback.earned / 100)
}
```

## Testing Checklist

- [ ] Full cash payment → full cashback credited
- [ ] Partial wallet usage → cashback on cash only
- [ ] Full wallet payment → zero cashback
- [ ] Profit 30.9% → 0% cashback
- [ ] Profit 31% → 10% cashback
- [ ] No active membership → 0% cashback credited
- [ ] Expired membership → 0% cashback credited
- [ ] Multiple items with different profit margins
- [ ] Wallet balance updates correctly after order
- [ ] Cashback preview shows correct amount
- [ ] Payment validation rejects insufficient wallet
- [ ] Database constraints prevent invalid splits

## Security Considerations

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Tenant isolation** enforced at database level
✅ **Payment validation** prevents overspending wallet
✅ **Membership verification** before crediting cashback
✅ **Audit trail** via cashback_transactions table
✅ **Immutable transactions** (no updates, only inserts)

## Troubleshooting

### Issue: No cashback credited despite eligible order
**Check:**
1. Is customer membership active? `SELECT * FROM memberships WHERE customer_id = ?`
2. Does product have cost_price_cents set?
3. Is profit% above 31% threshold?
4. Was any cash paid? (Full wallet = ₹0 cashback)

### Issue: Cashback amount seems wrong
**Verify:**
1. Cashback is on `cash_paid_cents`, NOT `total_cents`
2. Check profit calculation: `(sale - cost) / cost × 100`
3. Verify correct slab applied

### Issue: Wallet balance not updating
**Check:**
1. `wallet_accounts` exists for customer
2. `wallet_ledger` entries created
3. View `v_wallet_balances` for calculated balance

## Maintenance

### Expire Memberships (Cron Job)
```sql
-- Run daily
UPDATE memberships 
SET is_active = false 
WHERE valid_until < NOW() AND is_active = true;
```

### Add New Cashback Slab
```sql
INSERT INTO cashback_slabs (min_profit_pct, max_profit_pct, cashback_pct)
VALUES (501.0, 600.0, 60.0);
```

### View Cashback Analytics
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as orders,
  SUM(cashback_amount_cents) as total_cashback,
  AVG(cashback_pct) as avg_cashback_pct
FROM cashback_transactions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

## Support

For questions or issues:
1. Check test files for examples
2. Review API endpoints documentation
3. Verify database migration completed
4. Check Supabase logs for errors

---

**Key Takeaway:** Cashback is **ONLY** on cash paid, wallet usage gets **ZERO** cashback. This encourages customers to save cashback for future purchases while still paying cash for current orders.
