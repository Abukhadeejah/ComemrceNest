# Customer Modules - SaaS Subscription Model

## Overview

The CommerceNest customer system is designed as a modular, subscription-based feature set that tenants can purchase individually or as bundles. This follows standard SaaS practices where features are offered as small, incremental upgrades.

## Module Structure

### Core Modules

#### 1. **Customer Registration** (`customer_registration`)
- **Tier**: Basic
- **Price**: ₹29/month, ₹290/year
- **Features**:
  - Email registration and authentication
  - Profile management
  - Basic customer data storage
- **Dependencies**: None

#### 2. **Customer Addresses** (`customer_addresses`)
- **Tier**: Basic
- **Price**: ₹19/month, ₹190/year
- **Features**:
  - Address CRUD operations
  - Default address management
  - Address validation (optional)
- **Dependencies**: `customer_registration`

#### 3. **Customer Wallet** (`customer_wallet`)
- **Tier**: Premium
- **Price**: ₹49/month, ₹490/year
- **Features**:
  - Digital wallet balance tracking
  - Transaction history
  - Cashback earnings
  - Wallet transfers (optional)
- **Dependencies**: `customer_registration`

#### 4. **Customer Coupons** (`customer_coupons`)
- **Tier**: Premium
- **Price**: ₹39/month, ₹390/year
- **Features**:
  - Coupon creation and management
  - Redemption tracking
  - Bulk coupon campaigns (optional)
- **Dependencies**: `customer_registration`

#### 5. **Customer Analytics** (`customer_analytics`)
- **Tier**: Premium
- **Price**: ₹59/month, ₹590/year
- **Features**:
  - Purchase history tracking
  - Engagement metrics
  - Customer lifetime value calculation
- **Dependencies**: `customer_registration`

### Bundle Modules

#### 1. **Customers Basic** (`customers`)
- **Tier**: Basic
- **Price**: ₹39/month, ₹390/year
- **Includes**: `customer_registration` + `customer_addresses`
- **Savings**: ₹9/month (23% discount)

#### 2. **Customers Premium** (`customers_premium`)
- **Tier**: Premium
- **Price**: ₹99/month, ₹990/year
- **Includes**: All individual modules
- **Savings**: ₹135/month (58% discount)

## Implementation Details

### Database Schema

```sql
-- Module registry with pricing and features
module_registry (
  module_key text PRIMARY KEY,
  version text,
  status text,
  description text,
  metadata jsonb -- Contains pricing, features, tier info
)

-- Tenant module subscriptions
tenant_modules (
  tenant_id uuid,
  module_key text,
  enabled boolean,
  config jsonb,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  active_until timestamptz,
  billing_plan text,
  billing_period text,
  last_payment_at timestamptz
)

-- Module dependencies
module_dependencies (
  module_key text,
  depends_on text,
  is_required boolean
)

-- Feature-level granular control
module_features (
  module_key text,
  feature_key text,
  feature_name text,
  description text,
  is_core boolean
)
```

### API Implementation

All customer APIs include module validation:

```typescript
// Example from registration API
const validation = await validateCustomerFeatureAccess(tenantId, 'registration', 'Customer Registration')

if (!validation.allowed) {
  return NextResponse.json(
    { 
      error: validation.error,
      message: validation.upgradeMessage
    },
    { status: 403 }
  )
}
```

### Module Validation Functions

```typescript
// Check if feature is enabled
await isCustomerFeatureEnabled(tenantId, 'registration')

// Get module configuration
const config = await getCustomerModuleConfig(tenantId)

// Validate with upgrade messages
const validation = await validateCustomerFeatureAccess(tenantId, 'wallet', 'Digital Wallet')

// Get upgrade recommendations
const recommendations = await getCustomerModuleRecommendations(tenantId)
```

## Superadmin Panel Integration

### Module Management Features

1. **Module Registry Management**
   - View all available modules
   - Set pricing and features
   - Enable/disable modules
   - Manage dependencies

2. **Tenant Subscription Management**
   - View tenant module subscriptions
   - Enable/disable modules for tenants
   - Set trial periods
   - Manage billing plans

3. **Usage Analytics**
   - Track module usage by tenants
   - Revenue analytics per module
   - Upgrade conversion rates

### Tenant Admin Panel Integration

1. **Module Status Display**
   - Show enabled/disabled modules
   - Display trial status
   - Show upgrade options

2. **Feature Access Control**
   - Disable UI elements for unavailable features
   - Show upgrade prompts
   - Display module recommendations

## Pricing Strategy

### Tier-Based Pricing
- **Basic Tier**: Essential customer management (₹29-₹39/month)
- **Premium Tier**: Advanced features (₹39-₹59/month)
- **Bundle Discounts**: 23-58% savings for bundles

### Trial System
- 14-day free trials for all modules
- Automatic feature disabling after trial
- Upgrade prompts during trial period

### Revenue Model
- Recurring monthly/yearly subscriptions
- Tiered pricing for different business sizes
- Bundle discounts to encourage larger purchases

## Migration Path

### Existing Tenants
- Current `customers` module remains as basic bundle
- Gradual migration to granular modules
- Grandfathered pricing for existing subscribers

### New Tenants
- Start with basic modules
- Upgrade based on business needs
- Clear upgrade paths and recommendations

## Benefits

1. **For CommerceNest**
   - Higher revenue per tenant
   - Better feature adoption tracking
   - Flexible pricing strategies

2. **For Tenants**
   - Pay only for needed features
   - Clear upgrade paths
   - Trial periods to test features

3. **For Customers**
   - Better feature availability
   - Improved user experience
   - Access to premium features when needed

## Future Enhancements

1. **Usage-Based Pricing**
   - Pay per customer registration
   - Pay per wallet transaction
   - Pay per coupon redemption

2. **Advanced Analytics**
   - Module performance metrics
   - Customer behavior insights
   - Revenue optimization suggestions

3. **Custom Modules**
   - Tenant-specific customizations
   - White-label modules
   - Enterprise features



