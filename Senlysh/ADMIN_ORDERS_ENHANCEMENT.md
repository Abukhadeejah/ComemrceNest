# Admin Orders Management Enhancement

## Overview
Enhanced the admin orders page with comprehensive order management capabilities and cashback tracking.

## New Features

### 1. **Enhanced Order Status Management**
- **Status Flow**: `pending` → `paid` → `confirmed` → `fulfilled`
- **Alternative Actions**: Orders can be `cancelled` at any stage before fulfillment
- **Failed Orders**: Payment failures are tracked separately

### 2. **Status Update Actions**
- **Mark Paid**: Convert pending orders to paid status
- **Confirm Order**: Move paid orders to confirmed status (ready for processing)
- **Mark Fulfilled**: Complete the order lifecycle
- **Cancel Order**: Cancel orders at any stage

### 3. **Cashback Information Display**
- **Cashback Amount**: Shows earned cashback in currency format
- **Cashback Percentage**: Displays the cashback rate applied
- **Visual Indicators**: Green text for positive cashback, gray for none

### 4. **Improved UI/UX**
- **Better Layout**: Organized action buttons in vertical layout
- **Loading States**: Visual feedback during status updates
- **Confirmation Dialogs**: Prevent accidental status changes
- **Error Handling**: Proper error messages and recovery

## API Endpoints

### New Endpoint: `/api/admin/orders/[id]/status`
- **Method**: PATCH
- **Purpose**: Update order status
- **Allowed Statuses**: `pending`, `paid`, `confirmed`, `fulfilled`, `cancelled`, `failed`
- **Security**: Tenant admin authentication required
- **Cache**: Automatically invalidates order cache

### Enhanced Existing Endpoints
- **Orders List**: Now includes cashback information
- **Mark Paid**: Existing functionality preserved

## Cashback System Explanation

### **When is Cashback Given?**
Cashback is **automatically processed when payment is successful**, not based on order status changes.

### **Cashback Triggers:**
1. **Payment Webhooks**: 
   - Razorpay: `payment.captured` event
   - PhonePe: `COMPLETED` state
2. **Automatic Processing**: Happens in webhook handlers
3. **Immediate Credit**: Added to customer wallet instantly

### **Cashback Calculation:**
```javascript
// Profit-based cashback calculation
const profitPct = (salePrice - costPrice) / salePrice * 100
const cashbackPct = calculateCashbackRate(profitPct) // Based on profit tiers
const cashbackAmount = cashPaidAmount * (cashbackPct / 100)
```

### **Cashback Conditions:**
- ✅ **Payment Status**: Must be successfully paid
- ✅ **Cash Payments**: Only applies to cash portion (not wallet usage)
- ✅ **Profit Margin**: Based on product cost vs sale price
- ✅ **Automatic**: No manual intervention required

### **Order Status vs Payment Status:**
- **Order Status**: Admin-managed workflow (`pending` → `confirmed` → `fulfilled`)
- **Payment Status**: Payment provider confirmation (triggers cashback)
- **Independence**: Cashback is tied to payment, not order status

## Order Workflow

### **Customer Journey:**
1. **Place Order** → Status: `pending`
2. **Make Payment** → Status: `paid` + Cashback Credited
3. **Admin Confirms** → Status: `confirmed`
4. **Order Shipped** → Status: `fulfilled`

### **Admin Actions:**
- **Pending Orders**: Can mark as paid manually (for offline payments)
- **Paid Orders**: Can confirm for processing
- **Confirmed Orders**: Can mark as fulfilled
- **Any Stage**: Can cancel if needed

## Database Schema

### **Orders Table Fields:**
- `status`: Order workflow status
- `cashback_amount_cents`: Earned cashback amount
- `cashback_pct`: Applied cashback percentage
- `total_profit_pct`: Profit margin percentage
- `payment_provider`: Razorpay/PhonePe
- `razorpay_payment_id` / `phonepe_transaction_id`: Payment references

## Security & Performance

### **Security:**
- Tenant isolation enforced
- Admin authentication required
- Input validation on status updates
- SQL injection protection

### **Performance:**
- Cached order queries (30-second TTL)
- Automatic cache invalidation on updates
- Paginated results (20 orders per page)
- Optimized database queries

## Usage Instructions

### **For Admins:**
1. **View Orders**: Navigate to `/admin/orders`
2. **Filter Orders**: Use status dropdown and search
3. **Update Status**: Click action buttons next to orders
4. **Track Cashback**: View cashback column for payment insights
5. **View Details**: Click "View Details" for complete order information

### **Status Meanings:**
- **Pending**: Awaiting payment
- **Paid**: Payment confirmed, cashback credited
- **Confirmed**: Order confirmed by admin, ready for processing
- **Fulfilled**: Order completed and shipped
- **Cancelled**: Order cancelled
- **Failed**: Payment failed

## Integration Points

### **Webhook Integration:**
- Razorpay webhook processes payments for Bluebell
- PhonePe webhook processes payments for Senlysh
- Both trigger cashback calculation automatically

### **Customer Experience:**
- Customers see order status in their account
- Cashback appears in wallet immediately after payment
- Order tracking reflects admin status updates

## Monitoring & Analytics

### **Admin Dashboard:**
- Total orders count displayed
- Status-based filtering for workflow management
- Cashback tracking for financial insights
- Customer email for support purposes

### **Key Metrics:**
- Orders by status distribution
- Cashback amounts and percentages
- Payment method usage
- Customer order patterns

This enhancement provides comprehensive order management while maintaining the automatic cashback system's integrity.