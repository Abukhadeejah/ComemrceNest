# Cashback System - Visual Flow Diagrams

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CASHBACK SYSTEM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │   Frontend   │ ───> │   API Layer  │ ───> │   Database   │      │
│  │  Component   │      │   Endpoints  │      │    Tables    │      │
│  └──────────────┘      └──────────────┘      └──────────────┘      │
│         │                      │                      │              │
│         │                      │                      │              │
│  WalletCheckout          /api/orders            memberships         │
│         │                /api/wallet           cashback_transactions │
│         │                      │               wallet_ledger         │
│         └──────────────────────┴──────────────────────────┐         │
│                                                            │         │
│                         ┌──────────────┐                  │         │
│                         │ Cashback     │ <────────────────┘         │
│                         │ Engine       │                            │
│                         │ (Pure Logic) │                            │
│                         └──────────────┘                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 💰 Order Flow with Cashback

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ORDER CREATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

1. CUSTOMER INITIATES ORDER
   ↓
   Product: ₹100 (cost ₹70, profit 42.86%)
   Wallet Balance: ₹20
   
2. CUSTOMER SELECTS PAYMENT SPLIT
   ↓
   ┌─────────────────────────────┐
   │  Wallet Slider              │
   │  ├─────●───────────────┤    │  ← User moves slider
   │  ₹0   ₹10            ₹20    │
   └─────────────────────────────┘
   
   Selected: ₹10 wallet + ₹90 cash
   
3. REAL-TIME CASHBACK PREVIEW
   ↓
   ┌─────────────────────────────┐
   │  🎉 Cashback Preview        │
   │  Profit: 42.86%             │
   │  Cashback Rate: 15%         │
   │  Will Earn: ₹13.50          │  ← Calculated on ₹90 cash only
   │  (on ₹90 cash paid)         │
   └─────────────────────────────┘
   
4. CUSTOMER CONFIRMS ORDER
   ↓
   
5. BACKEND PROCESSING
   ↓
   ┌─────────────────────────────────────────┐
   │ a) Validate payment split               │
   │    ✓ Wallet balance sufficient?         │
   │    ✓ Total = wallet + cash?             │
   │                                          │
   │ b) Create order in database             │
   │    order.total_cents = 10000            │
   │    order.wallet_used_cents = 1000       │
   │    order.cash_paid_cents = 9000         │
   │                                          │
   │ c) Debit wallet                          │
   │    wallet_ledger: DEBIT ₹10             │
   │    New balance: ₹20 - ₹10 = ₹10         │
   │                                          │
   │ d) Check membership                      │
   │    ✓ Active membership found            │
   │                                          │
   │ e) Calculate cashback                    │
   │    Profit: 42.86% → Slab: 15%           │
   │    Cashback: ₹90 × 15% = ₹13.50         │
   │                                          │
   │ f) Credit cashback to wallet             │
   │    wallet_ledger: CREDIT ₹13.50         │
   │    New balance: ₹10 + ₹13.50 = ₹23.50   │
   │                                          │
   │ g) Record transaction                    │
   │    cashback_transactions: saved         │
   └─────────────────────────────────────────┘
   
6. RESPONSE TO CUSTOMER
   ↓
   ┌─────────────────────────────┐
   │  ✅ Order Placed!            │
   │  Order #ORD-ABC-12345       │
   │  Cashback Earned: ₹13.50    │
   │  New Wallet: ₹23.50         │
   └─────────────────────────────┘
```

## 🎯 Payment Split Scenarios

```
SCENARIO 1: FULL CASH (Maximum Cashback)
┌──────────────────────────────────────────┐
│ Order: ₹100                              │
│ ├─ Wallet: ₹0   (0% of total)           │
│ └─ Cash:   ₹100 (100% of total)         │
│                                          │
│ Cashback Base: ₹100                     │
│ Cashback Rate: 15%                      │
│ Cashback Earned: ₹15.00 ✅              │
└──────────────────────────────────────────┘

SCENARIO 2: PARTIAL WALLET (Reduced Cashback)
┌──────────────────────────────────────────┐
│ Order: ₹100                              │
│ ├─ Wallet: ₹10  (10% of total) ❌       │
│ └─ Cash:   ₹90  (90% of total) ✅       │
│                                          │
│ Cashback Base: ₹90 (not ₹100!)         │
│ Cashback Rate: 15%                      │
│ Cashback Earned: ₹13.50                 │
└──────────────────────────────────────────┘

SCENARIO 3: FULL WALLET (Zero Cashback)
┌──────────────────────────────────────────┐
│ Order: ₹100                              │
│ ├─ Wallet: ₹100 (100% of total) ❌      │
│ └─ Cash:   ₹0   (0% of total)           │
│                                          │
│ Cashback Base: ₹0                       │
│ Cashback Rate: 15%                      │
│ Cashback Earned: ₹0.00                  │
└──────────────────────────────────────────┘
```

## 📊 Cashback Slab Decision Tree

```
                     Calculate Profit %
                           │
                  (Sale - Cost) / Cost × 100
                           │
                           ├─ < 31% ──────> 0% Cashback ❌
                           │
                           ├─ 31-40% ─────> 10% Cashback
                           │
                           ├─ 41-50% ─────> 15% Cashback
                           │
                           ├─ 51-60% ─────> 20% Cashback
                           │
                           ├─ 61-70% ─────> 25% Cashback
                           │
                           ├─ 71-80% ─────> 30% Cashback
                           │
                           ├─ 81-90% ─────> 35% Cashback
                           │
                           ├─ 91-100% ────> 40% Cashback
                           │
                           ├─ 101-150% ───> 50% Cashback
                           │
                           ├─ 151-200% ───> 50% Cashback
                           │
                           ├─ 201-250% ───> 50% Cashback
                           │
                           ├─ 251-300% ───> 55% Cashback
                           │
                           ├─ 351-400% ───> 55% Cashback
                           │
                           ├─ 451-500% ───> 55% Cashback
                           │
                           └─ > 500% ─────> 0% Cashback ❌
```

## 🔐 Membership Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  MEMBERSHIP CHECK                            │
└─────────────────────────────────────────────────────────────┘

Customer Places Order
         │
         ↓
Query: memberships WHERE customer_id = ? AND is_active = true
         │
         ├─ Found ──────────────> Check valid_until date
         │                                │
         │                                ├─ Future Date ──> ✅ ELIGIBLE
         │                                │                   │
         │                                │              Credit Cashback
         │                                │
         │                                └─ Past Date ───> ❌ EXPIRED
         │                                                   │
         │                                              Record but ₹0
         │
         └─ Not Found ──────────> ❌ NO MEMBERSHIP
                                        │
                                   Record but ₹0
```

## 🔄 Wallet Balance Calculation

```
┌──────────────────────────────────────────────────────────────┐
│                  WALLET BALANCE VIEW                          │
│                 (v_wallet_balances)                           │
└──────────────────────────────────────────────────────────────┘

wallet_ledger entries:
  │
  ├─ CREDIT  +₹15.00  (Cashback from Order #1)
  ├─ DEBIT   -₹10.00  (Payment for Order #2)
  ├─ CREDIT  +₹20.00  (Cashback from Order #2)
  ├─ DEBIT   -₹5.00   (Payment for Order #3)
  └─ CREDIT  +₹8.00   (Cashback from Order #3)
       │
       ↓
  SUM(CREDIT entries) - SUM(DEBIT entries)
       │
       ↓
  (15 + 20 + 8) - (10 + 5) = ₹28.00
       │
       ↓
  Current Balance: ₹28.00
```

## 📈 Customer Cashback Journey

```
DAY 1: SIGNUP
┌────────────────────────┐
│ Customer Registers     │
│ ↓                      │
│ Wallet Created: ₹0     │
│ ↓                      │
│ FREE Membership        │
│ (Valid 1 year)         │
└────────────────────────┘

DAY 2: FIRST ORDER
┌────────────────────────┐
│ Order: ₹200            │
│ Payment: ₹0 wallet     │
│         +₹200 cash     │
│ ↓                      │
│ Cashback: ₹30          │
│ Wallet: ₹0 → ₹30       │
└────────────────────────┘

DAY 10: SECOND ORDER
┌────────────────────────┐
│ Order: ₹150            │
│ Payment: ₹30 wallet    │
│         +₹120 cash     │
│ ↓                      │
│ Cashback: ₹18          │
│ (on ₹120 cash only!)   │
│ ↓                      │
│ Wallet: ₹30 - ₹30      │
│        +₹18 = ₹18      │
└────────────────────────┘

DAY 30: THIRD ORDER
┌────────────────────────┐
│ Order: ₹100            │
│ Payment: ₹18 wallet    │
│         +₹82 cash      │
│ ↓                      │
│ Cashback: ₹12.30       │
│ ↓                      │
│ Wallet: ₹18 - ₹18      │
│        +₹12.30         │
│        = ₹12.30        │
└────────────────────────┘

TOTAL EARNED: ₹60.30 cashback on ₹450 orders
```

## 🎨 Frontend Component Structure

```
<WalletCheckout>
  │
  ├─ <WalletBalanceCard>
  │    └─ Display: ₹XX.XX
  │
  ├─ <OrderSummary>
  │    └─ List items + total
  │
  ├─ <WalletSlider>
  │    ├─ Range: 0 to maxBalance
  │    ├─ Current value display
  │    └─ Quick buttons (None/Half/Max)
  │
  ├─ <PaymentSplitViz>
  │    ├─ Wallet amount (blue)
  │    └─ Cash amount (green)
  │
  ├─ <CashbackPreview>
  │    ├─ Profit %
  │    ├─ Cashback %
  │    └─ Amount to earn
  │
  └─ <SubmitButton>
       └─ Pay ₹XX.XX
```

## 🧪 Test Scenario Matrix

```
┌──────────────┬─────────┬─────────┬──────────┬────────────┐
│ Scenario     │ Wallet  │ Cash    │ Cashback │ Pass/Fail  │
├──────────────┼─────────┼─────────┼──────────┼────────────┤
│ Full Cash    │ ₹0      │ ₹100    │ ₹15.00   │ ✅ PASS    │
│ Partial      │ ₹10     │ ₹90     │ ₹13.50   │ ✅ PASS    │
│ Full Wallet  │ ₹100    │ ₹0      │ ₹0.00    │ ✅ PASS    │
│ 30.9% Profit │ ₹0      │ ₹130.9  │ ₹0.00    │ ✅ PASS    │
│ 31% Profit   │ ₹0      │ ₹131    │ ₹13.10   │ ✅ PASS    │
│ No Member    │ ₹0      │ ₹100    │ ₹0.00    │ ✅ PASS    │
│ Expired      │ ₹0      │ ₹100    │ ₹0.00    │ ✅ PASS    │
└──────────────┴─────────┴─────────┴──────────┴────────────┘
```

---

**Legend:**
- ✅ = Eligible for cashback
- ❌ = Not eligible
- → = Data flow
- ↓ = Sequential step
