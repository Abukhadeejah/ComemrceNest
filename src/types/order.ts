/**
 * ORDER TYPES
 * 
 * Type definitions for orders, order items, and payment processing
 */

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'failed' | 'refunded';
export type PaymentProvider = 'phonepe' | 'razorpay';
export type PaymentEnv = 'test' | 'live' | 'sandbox' | 'production';

/**
 * Order record from database
 * 
 * CRITICAL FIELD: post_payment_processed
 * - Used for idempotency protection
 * - Prevents duplicate cashback credits, emails, and order updates
 * - Set to true after successful post-payment processing
 * - Checked at start of all webhook handlers
 */
export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  
  // Pricing
  total_cents: number;
  wallet_used_cents: number | null;
  cash_paid_cents: number | null;
  discount_amount_cents: number | null;
  currency: string;
  
  // Payment details
  payment_provider: PaymentProvider | null;
  payment_env: PaymentEnv | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  phonepe_transaction_id: string | null;
  
  // Customer info
  email: string;
  
  // Coupon
  coupon_id: string | null;
  coupon_code: string | null;
  
  // Cashback tracking
  total_purchase_price_cents: number | null;
  total_profit_pct: number | null;
  cashback_pct: number | null;
  cashback_amount_cents: number | null;
  membership_id: string | null;
  
  // 🔥 IDEMPOTENCY PROTECTION
  // This flag prevents duplicate processing when webhooks are retried
  post_payment_processed: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Order item record from database
 */
export interface OrderItem {
  id: string;
  tenant_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
  tax_cents: number | null;
  created_at: string;
  
  // Joined product data (when using .select())
  products?: {
    name: string;
    cost_per_item_cents: number | null;
  };
}

/**
 * Order with items (for cashback calculation)
 */
export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

/**
 * Webhook payload types
 */
export interface PhonePeWebhookPayload {
  orderId?: string;
  merchantTransactionId?: string;
  transactionId?: string;
  amount?: number;
  state?: 'COMPLETED' | 'FAILED' | 'PENDING';
  code?: string;
  data?: {
    merchantTransactionId?: string;
    transactionId?: string;
    amount?: number;
    state?: string;
  };
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
      };
    };
  };
}
