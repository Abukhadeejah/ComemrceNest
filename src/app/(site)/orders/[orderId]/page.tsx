import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export default async function OrderStatus({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const tenantId = await resolveTenantIdFromRequest()

  if (!tenantId) {
    return <div className="p-6">Tenant not found</div>
  }

  // Look up by order_number (works for both Razorpay and PhonePe orders)
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      id, 
      status, 
      total_cents, 
      currency, 
      order_number,
      payment_provider,
      cashback_amount_cents,
      cashback_pct,
      wallet_used_cents,
      cash_paid_cents,
      created_at,
      email,
      customer_id
    `)
    .eq('tenant_id', tenantId)
    .or(`order_number.eq.${orderId},razorpay_order_id.eq.${orderId}`)
    .maybeSingle()

  if (!order) {
    return <div className="p-6">Order not found</div>
  }

  const totalAmount = (order.total_cents || 0) / 100
  const cashbackAmount = (order.cashback_amount_cents || 0) / 100
  const walletUsed = (order.wallet_used_cents || 0) / 100
  const cashPaid = (order.cash_paid_cents || 0) / 100

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Order Details</h1>
      
      <div className="rounded border p-4 bg-white space-y-3">
        <div className="flex justify-between">
          <span className="font-medium">Order Number:</span>
          <span>{order.order_number}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            order.status === 'paid' ? 'bg-green-100 text-green-800' :
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {order.status?.toUpperCase()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Total Amount:</span>
          <span>₹{totalAmount.toFixed(2)}</span>
        </div>

        {walletUsed > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Paid from Wallet:</span>
            <span>₹{walletUsed.toFixed(2)}</span>
          </div>
        )}

        {cashPaid > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Cash Payment:</span>
            <span>₹{cashPaid.toFixed(2)}</span>
          </div>
        )}

        {cashbackAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="font-medium">Cashback Earned:</span>
            <span>₹{cashbackAmount.toFixed(2)} ({order.cashback_pct}%)</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>Payment Method:</span>
          <span>{order.payment_provider?.toUpperCase()}</span>
        </div>
        
        <div className="flex justify-between text-sm text-gray-500">
          <span>Order Date:</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>

        {order.email && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Email:</span>
            <span>{order.email}</span>
          </div>
        )}
      </div>

      {order.status === 'pending' && (
        <div className="rounded border p-4 bg-yellow-50 border-yellow-200">
          <p className="text-yellow-800">
            <strong>Payment Pending:</strong> Your payment is being processed. 
            Cashback will be credited once payment is confirmed.
          </p>
        </div>
      )}

      {order.status === 'paid' && cashbackAmount === 0 && (
        <div className="rounded border p-4 bg-blue-50 border-blue-200">
          <p className="text-blue-800">
            <strong>Cashback Processing:</strong> Your cashback is being calculated and will be credited to your wallet shortly.
          </p>
        </div>
      )}
    </div>
  )
}


