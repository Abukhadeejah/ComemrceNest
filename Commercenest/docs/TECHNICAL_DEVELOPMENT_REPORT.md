# 🔧 Technical Development Report: CommerceNest Platform

**Date:** December 2024  
**Project:** CommerceNest Multi-Tenant E-commerce Platform  
**Prepared for:** Development Team Implementation

---

## 🏷️ **CHECKPOINT: v1.0-variants-robust** (December 19, 2024)

**Status:** ✅ **MOST STABLE STATE - PRODUCTION READY**  
**Tag:** `v1.0-variants-robust`  
**Commit:** `4ad972d`  
**Branch:** `chore/variants-stability`

### **Variant System Implementation - Complete**

This checkpoint represents the most robust and stable implementation of the variant system. All core functionality is working and ready for production.

#### **Key Achievements:**
- ✅ Complete variant data flow from database to storefront
- ✅ Dynamic pricing with correct priority logic
- ✅ Full type safety with proper null handling
- ✅ All TypeScript and lint errors resolved
- ✅ Comprehensive validation and error handling
- ✅ Production-ready code quality

#### **Technical Implementation:**
- **Data Flow:** HomeServer → Home → LatestProducts → ProductCardWithVariants
- **Pricing Logic:** Direct variant prices > Base + adjustments > Base only
- **Type Safety:** Standardized database and interface types
- **Error Handling:** Comprehensive server-side validation
- **UI/UX:** Fixed hydration errors and improved authentication flow

#### **Files Modified:** 18 files with 422 insertions, 87 deletions
- Core variant components and data flow
- Type definitions and adapters
- Server actions and validation
- UI components and error handling

**Reference:** See [ROLLBACK_CHECKPOINTS.md](./ROLLBACK_CHECKPOINTS.md) for detailed rollback instructions.

---

## 🛍️ **Variant System Implementation Details**

### **Architecture Overview**
The variant system implements a complete product variant management solution with dynamic pricing, variant selection enforcement, and comprehensive data flow from database to storefront.

### **Database Schema**
```sql
-- Core variant tables
products (has_variants boolean)
├── product_variants (variant combinations)
├── variant_options (Size, Color, etc.)
├── variant_option_values (Small, Medium, Red, Blue, etc.)
└── variant_combinations (specific combinations with prices)
```

### **Data Flow Architecture**
```
1. HomeServer.tsx
   ├── Fetches products with variant_options
   ├── Fetches variant_combinations
   └── Passes to Home component

2. Home.tsx
   ├── Receives variant data
   └── Passes to LatestProducts

3. LatestProducts.tsx
   ├── Transforms variant data
   ├── Implements dynamic pricing logic
   └── Renders ProductCardWithVariants

4. ProductCardWithVariants
   ├── Handles variant selection
   ├── Updates prices dynamically
   └── Enforces variant selection for cart
```

### **Dynamic Pricing Logic**
```typescript
// Priority 1: Direct variant combination prices
if (matchingCombination && matchingCombination.price_cents > 0) {
  return matchingCombination.price_cents / 100;
}

// Priority 2: Base price + adjustments
let adjustmentCents = 0;
product.variantOptions.forEach(option => {
  const selectedValue = selectedVariants[option.name];
  if (selectedValue) {
    const valueObj = option.values.find(v => v.value === selectedValue);
    if (valueObj && valueObj.price_adjustment_cents) {
      adjustmentCents += valueObj.price_adjustment_cents;
    }
  }
});

// Priority 3: Base price only
return product.price;
```

### **Key Components**
- **HomeServer.tsx**: Server-side data fetching with variant data
- **LatestProducts.tsx**: Client-side variant rendering and pricing
- **ProductDetail.tsx**: PDP variant display and selection
- **ProductGrid.tsx**: PLP variant handling
- **QuickViewModal.tsx**: Modal variant selection
- **actions.ts**: Server actions for variant persistence

### **Type Safety Implementation**
- Standardized type definitions between database and interfaces
- Proper null/undefined handling throughout
- Type casting for complex nested structures
- Comprehensive interface definitions

### **Error Handling & Validation**
- Server-side validation for variant data
- Database constraint hardening
- SKU made optional to prevent constraint violations
- Comprehensive error logging and debugging

---

## 🎯 Technical Overview

This document outlines the complete technical implementation plan for the membership, shipping, and rewards system. All implementations follow the **DB-first, tenant-safe architecture** with proper RLS policies and modular design.

---

## 📊 Database Schema Design

### **1. Core Membership Tables**

```sql
-- Migration: 0019_membership_core.sql (Already Created)

-- Customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  phone text,
  first_name text,
  last_name text,
  dob date,
  gender text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Customer addresses
CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'home', -- 'home', 'work', 'other'
  is_default boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  phone text,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wallet system
CREATE TABLE public.wallet_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Immutable wallet ledger
CREATE TABLE public.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- 'credit', 'debit'
  amount DECIMAL(12,2) NOT NULL,
  reference_type text, -- 'order_cashback', 'refund', 'manual_adjustment'
  reference_id uuid,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coupons system
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL, -- 'percentage', 'fixed_amount'
  value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coupon redemptions
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### **2. Shipping & Fulfillment Tables**

```sql
-- Migration: 0020_shipping_fulfillment.sql (To Be Created)

-- Shiprocket configuration per tenant
CREATE TABLE public.shipping_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shiprocket_api_key text NOT NULL,
  shiprocket_api_secret text NOT NULL,
  default_pickup_pincode text NOT NULL,
  default_pickup_address text NOT NULL,
  packaging_cost_per_order DECIMAL(10,2) DEFAULT 0,
  handling_cost_per_order DECIMAL(10,2) DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Packaging templates
CREATE TABLE public.packaging_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  dimensions_cm jsonb NOT NULL, -- {"length": 30, "width": 25, "height": 15}
  weight_kg DECIMAL(5,3) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  max_product_weight_kg DECIMAL(5,2),
  max_product_dimension_cm DECIMAL(5,2),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shipping quotes (cached for performance)
CREATE TABLE public.shipping_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pickup_pincode text NOT NULL,
  delivery_pincode text NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  courier_name text NOT NULL,
  courier_id integer NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  cod_fee DECIMAL(10,2) DEFAULT 0,
  estimated_days integer,
  is_cod_available boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Order fulfillment tracking
CREATE TABLE public.order_fulfillment_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shipping_quote_id uuid REFERENCES public.shipping_quotes(id),
  packaging_template_id uuid REFERENCES public.packaging_templates(id),
  shipping_cost DECIMAL(10,2) NOT NULL,
  packaging_cost DECIMAL(10,2) NOT NULL,
  handling_cost DECIMAL(10,2) NOT NULL,
  cod_fee DECIMAL(10,2) DEFAULT 0,
  total_fulfillment_cost DECIMAL(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### **3. Rewards Engine Tables**

```sql
-- Migration: 0021_rewards_engine.sql (To Be Created)

-- Tenant reward configurations
CREATE TABLE public.reward_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  engine_type text NOT NULL DEFAULT 'default', -- 'default', 'senlysh_profit_based'
  is_active boolean NOT NULL DEFAULT true,
  config_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reward transactions
CREATE TABLE public.reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reward_type text NOT NULL, -- 'cashback', 'points', 'coupon'
  amount DECIMAL(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'credited', 'expired'
  calculation_data jsonb, -- Store calculation details
  credited_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 🔧 API Endpoints Design

### **1. Membership APIs**

```typescript
// Customer registration
POST /api/customers/register
{
  email: string;
  password: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  marketing_opt_in: boolean;
}

// Customer profile management
GET /api/customers/profile
PUT /api/customers/profile
{
  first_name?: string;
  last_name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  marketing_opt_in?: boolean;
}

// Address management
GET /api/customers/addresses
POST /api/customers/addresses
PUT /api/customers/addresses/:id
DELETE /api/customers/addresses/:id

// Wallet operations
GET /api/customers/wallet
GET /api/customers/wallet/transactions
```

### **2. Shipping APIs**

```typescript
// Get shipping quotes
POST /api/shipping/quote
{
  delivery_pincode: string;
  items: Array<{
    weight_kg: number;
    dimensions_cm: {length: number; width: number; height: number};
  }>;
  is_cod: boolean;
}

// Response
{
  quotes: Array<{
    courier_name: string;
    shipping_cost: number;
    cod_fee: number;
    estimated_days: number;
    total_cost: number;
  }>;
  packaging_cost: number;
  handling_cost: number;
  total_fulfillment_cost: number;
}

// Create shipping label
POST /api/shipping/label
{
  order_id: string;
  courier_id: number;
  pickup_address: Address;
  delivery_address: Address;
}
```

### **3. Rewards APIs**

```typescript
// Calculate rewards for order
POST /api/rewards/calculate
{
  order_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
  }>;
  fulfillment_cost: number;
}

// Response
{
  reward_type: 'cashback' | 'points' | 'coupon';
  amount: number;
  calculation_details: {
    gross_profit: number;
    profit_percentage: number;
    reward_rate: number;
    engine_used: string;
  };
}

// Apply coupon
POST /api/coupons/apply
{
  code: string;
  order_id: string;
}

// Response
{
  valid: boolean;
  discount_amount: number;
  final_amount: number;
  error?: string;
}
```

---

## 🏗️ Service Architecture

### **1. Shiprocket Service**

```typescript
// services/shiprocket.ts
export class ShiprocketService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://apiv2.shiprocket.in/v1';

  async getShippingRates(request: ShippingRateRequest): Promise<ShippingQuote[]> {
    // Implementation for rate calculation
  }

  async createOrder(orderData: ShiprocketOrder): Promise<ShiprocketOrderResponse> {
    // Implementation for order creation
  }

  async generateLabel(shipmentId: string): Promise<LabelResponse> {
    // Implementation for label generation
  }

  async trackShipment(awb: string): Promise<TrackingResponse> {
    // Implementation for tracking
  }
}
```

### **2. Rewards Engine Service**

```typescript
// services/rewards-engine.ts
export class RewardsEngine {
  async calculateReward(
    tenantId: string,
    orderData: OrderCalculationData
  ): Promise<RewardCalculation> {
    const config = await this.getRewardConfig(tenantId);
    
    switch (config.engine_type) {
      case 'senlysh_profit_based':
        return this.calculateSenlyshReward(orderData, config.config_data);
      default:
        return this.calculateDefaultReward(orderData, config.config_data);
    }
  }

  private calculateSenlyshReward(
    orderData: OrderCalculationData,
    config: SenlyshConfig
  ): RewardCalculation {
    const { items, fulfillment_cost } = orderData;
    
    let totalProfit = 0;
    let totalRevenue = 0;
    
    for (const item of items) {
      const itemProfit = (item.unit_price - item.cost_price) * item.quantity;
      const itemRevenue = item.unit_price * item.quantity;
      totalProfit += itemProfit;
      totalRevenue += itemRevenue;
    }
    
    const netProfit = totalProfit - fulfillment_cost;
    const profitPercentage = (netProfit / totalRevenue) * 100;
    
    const cashbackRate = this.getCashbackRate(profitPercentage, config.brackets);
    const cashbackAmount = cashbackRate * netProfit;
    
    return {
      reward_type: 'cashback',
      amount: cashbackAmount,
      calculation_details: {
        gross_profit: totalProfit,
        net_profit: netProfit,
        profit_percentage: profitPercentage,
        cashback_rate: cashbackRate,
        engine_used: 'senlysh_profit_based'
      }
    };
  }

  private getCashbackRate(profitPercentage: number, brackets: ProfitBracket[]): number {
    for (const bracket of brackets) {
      if (profitPercentage >= bracket.min && profitPercentage <= bracket.max) {
        return bracket.cashback_rate;
      }
    }
    return 0; // No cashback if profit is too low
  }
}
```

### **3. Packaging Service**

```typescript
// services/packaging.ts
export class PackagingService {
  async selectOptimalPackaging(
    tenantId: string,
    items: ProductItem[]
  ): Promise<PackagingTemplate> {
    const totalWeight = items.reduce((sum, item) => sum + item.weight_kg, 0);
    const maxDimension = Math.max(...items.map(item => item.max_dimension_cm));
    
    const templates = await this.getPackagingTemplates(tenantId);
    
    const suitable = templates
      .filter(t => t.max_product_weight_kg >= totalWeight)
      .filter(t => t.max_product_dimension_cm >= maxDimension)
      .sort((a, b) => a.cost - b.cost);
    
    return suitable[0] || this.getDefaultPackaging(tenantId);
  }
}
```

---

## 📱 Frontend Components

### **1. Customer Registration/Login**

```typescript
// components/customer/RegisterForm.tsx
export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    marketing_opt_in: false
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### **2. Shipping Calculator**

```typescript
// components/shipping/ShippingCalculator.tsx
export function ShippingCalculator({ items, deliveryPincode }: Props) {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateShipping = async () => {
    setLoading(true);
    const response = await fetch('/api/shipping/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        delivery_pincode: deliveryPincode,
        items: items.map(item => ({
          weight_kg: item.weight_kg,
          dimensions_cm: item.dimensions_cm
        })),
        is_cod: false
      })
    });
    
    const data = await response.json();
    setQuotes(data.quotes);
    setLoading(false);
  };

  return (
    <div>
      {loading ? (
        <div>Calculating shipping costs...</div>
      ) : (
        <div>
          {quotes.map(quote => (
            <div key={quote.courier_name}>
              <h3>{quote.courier_name}</h3>
              <p>Cost: ₹{quote.total_cost}</p>
              <p>Delivery: {quote.estimated_days} days</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### **3. Wallet Dashboard**

```typescript
// components/wallet/WalletDashboard.tsx
export function WalletDashboard() {
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    const [walletRes, transactionsRes] = await Promise.all([
      fetch('/api/customers/wallet'),
      fetch('/api/customers/wallet/transactions')
    ]);
    
    setWallet(await walletRes.json());
    setTransactions(await transactionsRes.json());
  };

  return (
    <div>
      <div className="wallet-balance">
        <h2>Wallet Balance</h2>
        <p>₹{wallet?.balance || 0}</p>
      </div>
      
      <div className="transactions">
        <h3>Recent Transactions</h3>
        {transactions.map(transaction => (
          <div key={transaction.id} className="transaction">
            <span>{transaction.description}</span>
            <span className={transaction.transaction_type}>
              {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### **1. Unit Tests**

```typescript
// tests/services/rewards-engine.test.ts
describe('RewardsEngine', () => {
  it('should calculate Senlysh cashback correctly', async () => {
    const engine = new RewardsEngine();
    const orderData = {
      items: [{
        product_id: '1',
        quantity: 1,
        unit_price: 900,
        cost_price: 500
      }],
      fulfillment_cost: 125
    };
    
    const result = await engine.calculateReward('senlysh-tenant-id', orderData);
    
    expect(result.reward_type).toBe('cashback');
    expect(result.amount).toBe(55); // 20% of 275 profit
    expect(result.calculation_details.profit_percentage).toBe(55);
  });
});
```

### **2. Integration Tests**

```typescript
// tests/api/shipping.test.ts
describe('Shipping API', () => {
  it('should return shipping quotes for valid pincode', async () => {
    const response = await request(app)
      .post('/api/shipping/quote')
      .send({
        delivery_pincode: '400001',
        items: [{
          weight_kg: 0.5,
          dimensions_cm: { length: 30, width: 25, height: 15 }
        }],
        is_cod: false
      });
    
    expect(response.status).toBe(200);
    expect(response.body.quotes).toBeDefined();
    expect(response.body.quotes.length).toBeGreaterThan(0);
  });
});
```

### **3. E2E Tests**

```typescript
// tests/e2e/customer-journey.test.ts
describe('Customer Journey', () => {
  it('should complete full customer registration and order flow', async () => {
    // Register customer
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify email
    await page.goto('/verify-email');
    
    // Complete profile
    await page.goto('/profile');
    await page.fill('[name="first_name"]', 'John');
    await page.fill('[name="last_name"]', 'Doe');
    await page.click('button[type="submit"]');
    
    // Add address
    await page.goto('/addresses');
    await page.click('button:has-text("Add Address")');
    await page.fill('[name="address_line_1"]', '123 Main St');
    await page.fill('[name="city"]', 'Mumbai');
    await page.fill('[name="pincode"]', '400001');
    await page.click('button[type="submit"]');
    
    // Place order with shipping calculation
    await page.goto('/cart');
    await page.click('button:has-text("Checkout")');
    
    // Verify shipping costs are calculated
    await expect(page.locator('.shipping-cost')).toBeVisible();
    
    // Complete order
    await page.click('button:has-text("Place Order")');
    
    // Verify wallet cashback
    await page.goto('/wallet');
    await expect(page.locator('.wallet-balance')).toContainText('₹');
  });
});
```

---

## 📋 Development TODO List

### **Phase 1: Core Membership (4-6 weeks)**

#### **Week 1-2: Database & Backend**
- [ ] Apply migration `0019_membership_core.sql`
- [ ] Create customer registration API endpoints
- [ ] Implement customer profile management APIs
- [ ] Set up wallet system APIs
- [ ] Create address management APIs
- [ ] Write unit tests for all APIs

#### **Week 3-4: Frontend Components**
- [ ] Create customer registration form
- [ ] Build customer login/logout flow
- [ ] Implement profile management page
- [ ] Create address management interface
- [ ] Build wallet dashboard
- [ ] Add customer authentication middleware

#### **Week 5-6: Integration & Testing**
- [ ] Integrate with existing tenant system
- [ ] Test RLS policies thoroughly
- [ ] Write integration tests
- [ ] Perform E2E testing
- [ ] Fix bugs and optimize performance

### **Phase 2: Shipping Integration (3-4 weeks)**

#### **Week 1-2: Shiprocket Integration**
- [ ] Create migration `0020_shipping_fulfillment.sql`
- [ ] Implement ShiprocketService class
- [ ] Create shipping quote API endpoints
- [ ] Build packaging selection logic
- [ ] Implement fulfillment cost calculation
- [ ] Write unit tests for shipping services

#### **Week 3-4: Frontend & Integration**
- [ ] Create shipping calculator component
- [ ] Integrate with checkout flow
- [ ] Build admin shipping configuration
- [ ] Implement order tracking
- [ ] Test with real Shiprocket API
- [ ] Write E2E tests for shipping flow

### **Phase 3: Rewards Engine (3-4 weeks)**

#### **Week 1-2: Rewards Backend**
- [ ] Create migration `0021_rewards_engine.sql`
- [ ] Implement RewardsEngine service
- [ ] Create Senlysh profit-based calculator
- [ ] Build coupon management system
- [ ] Implement reward transaction APIs
- [ ] Write unit tests for rewards engine

#### **Week 3-4: Frontend & Integration**
- [ ] Create rewards dashboard
- [ ] Build coupon application flow
- [ ] Implement admin reward configuration
- [ ] Integrate with order completion
- [ ] Test reward calculations
- [ ] Write E2E tests for rewards flow

### **Phase 4: Advanced Features (2-3 weeks)**

#### **Week 1-2: Analytics & Reporting**
- [ ] Create analytics dashboard
- [ ] Implement profit margin tracking
- [ ] Build customer behavior analytics
- [ ] Create shipping cost reports
- [ ] Implement reward performance metrics

#### **Week 3: Optimization & Launch**
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing
- [ ] Documentation completion
- [ ] Production deployment

---

## 🔒 Security Considerations

### **1. RLS Policies**
- All customer data is tenant-isolated
- Customers can only access their own data
- Admins can only access their tenant's data
- Service role has full access for system operations

### **2. API Security**
- All APIs require authentication
- Tenant context validation on every request
- Input validation and sanitization
- Rate limiting on public endpoints

### **3. Data Protection**
- Sensitive data encryption at rest
- Secure API key storage
- Audit logging for all operations
- GDPR compliance for customer data

---

## 📊 Performance Considerations

### **1. Database Optimization**
- Proper indexing on tenant_id columns
- Query optimization for large datasets
- Connection pooling
- Read replicas for analytics queries

### **2. API Performance**
- Caching for shipping quotes
- Async processing for heavy operations
- Pagination for large result sets
- CDN for static assets

### **3. Monitoring**
- Application performance monitoring
- Database query monitoring
- API response time tracking
- Error rate monitoring

---

## 🚀 Deployment Strategy

### **1. Staging Environment**
- Deploy to staging for testing
- Run full test suite
- Performance testing
- Security scanning

### **2. Production Deployment**
- Blue-green deployment
- Database migration execution
- Feature flag activation
- Monitoring and rollback plan

### **3. Post-Deployment**
- Health checks
- Performance monitoring
- User feedback collection
- Bug fixes and optimizations

---

**This technical report provides the complete roadmap for implementing the membership, shipping, and rewards system. Each phase builds upon the previous one, ensuring a stable and scalable implementation.**

## Variant robustness test plan (2025-09-22)

- Preconditions
  - Tenant: senlysh. One product with has_variants=true and at least one Size option with values.
- Admin UI (tenant-admin edit)
  - With variants enabled: verify Variant Options and Variant Combinations sections show a required marker (*).
  - Leaving options or combinations empty disables “Update Variants” with a red inline hint.
  - Setting negative price or stock disables “Update Variants”.
  - Clicking bottom “Update” does not change variants and does not error.
- Server actions
  - updateProductVariants: rejects when options=[] or combinations=[], or negative price/stock.
  - updateProduct: rejects payloads that try to mutate variants; instructs to use Update Variants.
- Database
  - products.has_variants is NOT NULL DEFAULT false.
  - CHECK constraints:
    - products.low_stock_threshold >= 0
    - product_variants.stock >= 0
    - variant_option_values.price_adjustment_cents >= 0
    - variant_option_values.cost_adjustment_cents >= 0
- Regression
  - After saving variants, refresh page: combinations render from DB.
  - Create new product with has_variants=true, add option/values and combinations, save via Update Variants, then Update: no errors and persistence retained.




