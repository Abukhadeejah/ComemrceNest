# 🚀 Cashback System - Complete Setup Checklist

## Pre-Deployment Checklist

Use this checklist to ensure the cashback system is properly set up before going live.

### ✅ Database Setup

- [ ] **Run Migration Script**
  ```bash
  # In Supabase SQL Editor, execute:
  migrations/create_cashback_system.sql
  ```

- [ ] **Verify Tables Created**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('memberships', 'cashback_transactions', 'cashback_slabs');
  ```
  Expected: 3 rows returned

- [ ] **Verify Cashback Slabs Populated**
  ```sql
  SELECT COUNT(*) FROM cashback_slabs;
  ```
  Expected: 13 rows (profit slabs)

- [ ] **Verify Orders Table Updated**
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'orders' 
  AND column_name IN ('wallet_used_cents', 'cash_paid_cents', 'cashback_amount_cents');
  ```
  Expected: 3 columns found

- [ ] **Verify RLS Policies Enabled**
  ```sql
  SELECT tablename, policyname FROM pg_policies 
  WHERE tablename IN ('memberships', 'cashback_transactions');
  ```
  Expected: Policies listed

- [ ] **Test Database Function**
  ```sql
  SELECT get_cashback_percentage(35.0);
  ```
  Expected: 10.00 (35% profit → 10% cashback)

### ✅ Product Configuration

- [ ] **Set Cost Prices for All Products**
  ```sql
  -- Check products without cost price
  SELECT id, name, price_cents, cost_price_cents 
  FROM products 
  WHERE cost_price_cents IS NULL 
  LIMIT 5;
  ```

- [ ] **Update Missing Cost Prices**
  ```sql
  -- Example: Set cost to 70% of price
  UPDATE products 
  SET cost_price_cents = FLOOR(price_cents * 0.7)
  WHERE cost_price_cents IS NULL;
  ```

- [ ] **Verify Profit Margins**
  ```sql
  SELECT 
    name,
    price_cents / 100.0 as price,
    cost_price_cents / 100.0 as cost,
    ROUND(((price_cents - cost_price_cents)::numeric / cost_price_cents * 100), 2) as profit_pct
  FROM products 
  WHERE cost_price_cents IS NOT NULL
  LIMIT 5;
  ```

### ✅ Test Customer Setup

- [ ] **Create Test Customer**
  ```sql
  INSERT INTO customers (tenant_id, email, first_name, last_name)
  VALUES (
    (SELECT id FROM tenants LIMIT 1),
    'test@example.com',
    'Test',
    'Customer'
  )
  RETURNING id;
  ```

- [ ] **Verify Membership Auto-Created**
  ```sql
  SELECT * FROM memberships 
  WHERE customer_id = 'YOUR_TEST_CUSTOMER_ID';
  ```
  Expected: 1 row with FREE membership

- [ ] **Verify Wallet Account Created**
  ```sql
  SELECT * FROM wallet_accounts 
  WHERE customer_id = 'YOUR_TEST_CUSTOMER_ID';
  ```
  Expected: 1 row

- [ ] **Check Initial Wallet Balance**
  ```sql
  SELECT * FROM v_wallet_balances 
  WHERE customer_id = 'YOUR_TEST_CUSTOMER_ID';
  ```
  Expected: balance_cents = 0

### ✅ API Endpoints Testing

- [ ] **Test Wallet Balance Endpoint**
  ```bash
  curl http://localhost:3000/api/wallet?customerId=YOUR_CUSTOMER_ID
  ```
  Expected: 200 OK with balance data

- [ ] **Test Cashback Preview Endpoint**
  ```bash
  curl -X POST http://localhost:3000/api/wallet/preview-cashback \
    -H "Content-Type: application/json" \
    -d '{
      "customerId": "YOUR_CUSTOMER_ID",
      "totalSalePriceCents": 10000,
      "totalPurchasePriceCents": 7000,
      "walletUsedCents": 1000,
      "cashPaidCents": 9000
    }'
  ```
  Expected: Cashback preview with percentages

- [ ] **Test Order Creation Endpoint**
  ```bash
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customerId": "YOUR_CUSTOMER_ID",
      "items": [
        {"productId": "YOUR_PRODUCT_ID", "quantity": 1}
      ],
      "walletUsedRupees": 0
    }'
  ```
  Expected: Order created with cashback details

### ✅ Frontend Integration

- [ ] **Import WalletCheckout Component**
  ```tsx
  import WalletCheckout from '@/components/checkout/WalletCheckout'
  ```

- [ ] **Test Component Renders**
  - [ ] Wallet balance displays correctly
  - [ ] Slider moves smoothly
  - [ ] Payment split updates in real-time
  - [ ] Cashback preview updates dynamically
  - [ ] Quick buttons work (None, Half, Max)

- [ ] **Test Error States**
  - [ ] Insufficient wallet balance shows error
  - [ ] Invalid payment split rejected
  - [ ] No membership shows appropriate message

### ✅ End-to-End Testing

- [ ] **Test Full Cash Order**
  1. Customer with ₹0 wallet
  2. Place order for ₹100 (profit 42.86%)
  3. Use ₹0 wallet + ₹100 cash
  4. Verify cashback = ₹15.00
  5. Check wallet balance = ₹15.00

- [ ] **Test Partial Wallet Order**
  1. Customer with ₹15 wallet (from previous test)
  2. Place order for ₹100
  3. Use ₹10 wallet + ₹90 cash
  4. Verify cashback = ₹13.50 (on ₹90 only)
  5. Check wallet balance = ₹5 + ₹13.50 = ₹18.50

- [ ] **Test Full Wallet Order**
  1. Customer with ₹18.50 wallet
  2. Place order for ₹18.50
  3. Use ₹18.50 wallet + ₹0 cash
  4. Verify cashback = ₹0.00
  5. Check wallet balance = ₹0.00

- [ ] **Test Edge Case: 30.9% Profit**
  1. Product: cost ₹100, price ₹130.90
  2. Place order with full cash
  3. Verify cashback = ₹0 (below 31% threshold)

- [ ] **Test Edge Case: 31% Profit**
  1. Product: cost ₹100, price ₹131
  2. Place order with full cash
  3. Verify cashback = ₹13.10 (10% of ₹131)

- [ ] **Test No Membership**
  1. Manually deactivate customer membership
  2. Place order
  3. Verify cashback = ₹0 (recorded but not credited)

### ✅ Security & Validation

- [ ] **Test RLS Policies**
  ```sql
  -- Try to access another tenant's data (should fail)
  SET app.tenant_id = 'wrong-tenant-id';
  SELECT * FROM memberships WHERE customer_id = 'test-customer-id';
  ```
  Expected: 0 rows

- [ ] **Test Payment Validation**
  - [ ] Reject wallet usage > balance
  - [ ] Reject negative amounts
  - [ ] Reject mismatched totals

- [ ] **Test Concurrent Orders**
  - [ ] Place 2 orders simultaneously
  - [ ] Verify wallet balance is correct
  - [ ] Verify no race conditions

### ✅ Monitoring Setup

- [ ] **Create Monitoring Dashboard Query**
  ```sql
  -- Total cashback given today
  SELECT 
    COUNT(*) as orders,
    SUM(cashback_amount_cents) / 100 as total_cashback_rupees
  FROM cashback_transactions
  WHERE created_at::date = CURRENT_DATE;
  ```

- [ ] **Set Up Alerts**
  - [ ] Alert if cashback > 50% of order value
  - [ ] Alert if daily cashback exceeds budget
  - [ ] Alert if membership expiry rate is high

- [ ] **Log Analysis**
  - [ ] Check for errors in order creation
  - [ ] Monitor cashback calculation failures
  - [ ] Track wallet balance inconsistencies

### ✅ Documentation

- [ ] **Team Training**
  - [ ] Share CASHBACK_QUICKSTART.md
  - [ ] Review CASHBACK_SYSTEM.md
  - [ ] Demo WalletCheckout component

- [ ] **Customer Communication**
  - [ ] Create FAQ about cashback system
  - [ ] Update terms & conditions
  - [ ] Prepare customer emails about feature

### ✅ Performance Testing

- [ ] **Load Test Order Creation**
  ```bash
  # Use Apache Bench or similar
  ab -n 100 -c 10 http://localhost:3000/api/orders
  ```

- [ ] **Test Database Query Performance**
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM v_wallet_balances 
  WHERE customer_id = 'test-id';
  ```

- [ ] **Check Index Usage**
  ```sql
  SELECT schemaname, tablename, indexname 
  FROM pg_indexes 
  WHERE tablename IN ('memberships', 'cashback_transactions', 'wallet_ledger');
  ```

### ✅ Backup & Recovery

- [ ] **Backup Current Database**
  ```bash
  # Before running migration
  pg_dump your_database > backup_pre_cashback.sql
  ```

- [ ] **Test Rollback Script**
  ```sql
  -- Test the rollback section in migration file
  -- (in development environment only)
  ```

- [ ] **Document Recovery Procedure**
  - [ ] How to restore from backup
  - [ ] How to manually credit missing cashback
  - [ ] How to fix wallet balance discrepancies

## 🎉 Go-Live Checklist

### Final Checks Before Launch

- [ ] All tests passing ✅
- [ ] Database migration successful ✅
- [ ] Product cost prices set ✅
- [ ] Frontend component working ✅
- [ ] API endpoints tested ✅
- [ ] Security verified ✅
- [ ] Monitoring in place ✅
- [ ] Team trained ✅
- [ ] Documentation complete ✅

### Launch Sequence

1. [ ] **Announce Maintenance Window** (if needed)
2. [ ] **Backup Production Database**
3. [ ] **Run Migration in Production**
4. [ ] **Verify Tables & Data**
5. [ ] **Deploy Frontend Changes**
6. [ ] **Test with Real Customer**
7. [ ] **Monitor for 24 Hours**
8. [ ] **Announce Feature to Customers**

---

## 📞 Support Contacts

- **Database Issues:** [Your DBA]
- **API Issues:** [Your Backend Team]
- **Frontend Issues:** [Your Frontend Team]
- **Business Questions:** [Your Product Team]

## 📚 Quick Reference Links

- [Complete Documentation](./docs/CASHBACK_SYSTEM.md)
- [Quick Start Guide](./docs/CASHBACK_QUICKSTART.md)
- [Flow Diagrams](./docs/CASHBACK_FLOW_DIAGRAMS.md)
- [Test Files](./tests/)
- [Migration Script](./migrations/create_cashback_system.sql)

---

**Last Updated:** [Current Date]
**Version:** 1.0.0
**Status:** Ready for Production ✅
