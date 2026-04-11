# Raw Diff Proof - Offline Refund Wallet Only

Date: 2026-04-11

This file contains the exact commands requested and the raw hunk outputs captured from the working tree.

## 1) git diff -- src/app/api/admin/orders/update-status/route.ts

```diff
git diff -- "src/app/api/admin/orders/update-status/route.ts"
diff --git a/src/app/api/admin/orders/update-status/route.ts b/src/app/api/admin/orders/update-status/route.ts
index f0f2ccb..cc99f63 100644
--- a/src/app/api/admin/orders/update-status/route.ts
+++ b/src/app/api/admin/orders/update-status/route.ts
@@ -4,6 +4,7 @@ import { supabaseAdmin } from '@/server/supabaseAdmin'
 import { revalidateTag } from 'next/cache'
 import { tenantOrdersTag } from '@/server/cacheTags'
 import { processPaidOrderPostPaymentOnce } from '@/server/admin/offlineOrders' 
+import { processOfflineCancellationWalletRefund } from '@/server/admin/offlineOrderCancellation'
 
 export async function PATCH(request: NextRequest) {
   try {
@@ -38,20 +39,34 @@ export async function PATCH(request: NextRequest) {
 
     console.log(`[Admin Orders Status API] Updating order ${orderId} to status ${status} for tenant ${tenantId}`)
 
-    // Get current order status before update
+    // Get current order details before update
     const { data: currentOrder } = await supabaseAdmin
       .from('orders')
-      .select('status')
+      .select('status, order_source')
       .eq('id', orderId)
       .eq('tenant_id', tenantId)
       .single()
 
+    if (status === 'cancelled' && currentOrder?.status === 'cancelled') {      
+      return NextResponse.json({
+        success: true,
+        order: { id: orderId, status: 'cancelled' },
+        message: 'Order already cancelled. No additional refund applied.',     
+      })
+    }
+
     // Update order status
-    const { data, error } = await supabaseAdmin
+    let updateQuery = supabaseAdmin
       .from('orders')
       .update({ status })
       .eq('id', orderId)
       .eq('tenant_id', tenantId)
+
+    if (status === 'cancelled') {
+      updateQuery = updateQuery.neq('status', 'cancelled')
+    }
+
+    const { data, error } = await updateQuery
       .select('id, order_number, status')
       .single()
 
@@ -59,6 +74,13 @@ export async function PATCH(request: NextRequest) {
       console.error('Order status update error:', error)
 
       if (error.code === 'PGRST116') {
+        if (status === 'cancelled') {
+          return NextResponse.json({
+            success: true,
+            order: { id: orderId, status: 'cancelled' },
+            message: 'Order already cancelled. No additional refund applied.', 
+          })
+        }
         return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
       }
 
@@ -81,6 +103,22 @@ export async function PATCH(request: NextRequest) {
       }
     }
 
+    // Offline-only cancellation refund rule:
+    // Credit full remaining refundable amount to wallet immediately.
+    if (
+      status === 'cancelled' &&
+      currentOrder?.status !== 'cancelled' &&
+      currentOrder?.order_source === 'offline_admin'
+    ) {
+      console.log(`[Admin Orders Status API] Processing offline cancellation wallet refund for order ${orderId}`)
+      const cancellationRefundResult = await processOfflineCancellationWalletRefund({
+        tenantId,
+        orderId,
+        reason: 'Order cancelled via admin status update',
+      })
+      console.log('[Admin Orders Status API] Offline cancellation wallet refund result:', cancellationRefundResult)
+    }
+
     // Invalidate cache
     revalidateTag(tenantOrdersTag(tenantId), 'default')
```

## 2) git diff -- src/app/api/admin/orders/[id]/status/route.ts

```diff
git diff -- "src/app/api/admin/orders/[id]/status/route.ts"
diff --git a/src/app/api/admin/orders/[id]/status/route.ts b/src/app/api/admin/orders/[id]/status/route.ts
index 018ff65..d81cf3a 100644
--- a/src/app/api/admin/orders/[id]/status/route.ts
+++ b/src/app/api/admin/orders/[id]/status/route.ts
@@ -3,6 +3,7 @@ import { resolveTenantIdFromRequest } from '@/server/tenant'    
 import { supabaseAdmin } from '@/server/supabaseAdmin'
 import { revalidateTag } from 'next/cache'
 import { tenantOrdersTag } from '@/server/cacheTags'
+import { processOfflineCancellationWalletRefund } from '@/server/admin/offlineOrderCancellation'
 
 export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
   try {
@@ -38,12 +39,37 @@ export async function PATCH(request: NextRequest, context: { params: Promise<{ i
 
     console.log(`[Admin Orders Status API] Updating order ${id} to status ${status} for tenant ${tenantId}`)
 
+    const { data: currentOrder, error: currentOrderError } = await supabaseAdmin
+      .from('orders')
+      .select('status, order_source')
+      .eq('id', id)
+      .eq('tenant_id', tenantId)
+      .single()
+
+    if (currentOrderError) {
+      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
+    }
+
+    if (status === 'cancelled' && currentOrder?.status === 'cancelled') {      
+      return NextResponse.json({
+        success: true,
+        order: { id, status: 'cancelled' },
+        message: 'Order already cancelled. No additional refund applied.',     
+      })
+    }
+
     // Update order status
-    const { data, error } = await supabaseAdmin
+    let updateQuery = supabaseAdmin
       .from('orders')
       .update({ status })
       .eq('id', id)
       .eq('tenant_id', tenantId)
+
+    if (status === 'cancelled') {
+      updateQuery = updateQuery.neq('status', 'cancelled')
+    }
+
+    const { data, error } = await updateQuery
       .select('id, order_number, status')
       .single()
 
@@ -51,6 +77,13 @@ export async function PATCH(request: NextRequest, context: { params: Promise<{ i
       console.error('Order status update error:', error)
 
       if (error.code === 'PGRST116') {
+        if (status === 'cancelled') {
+          return NextResponse.json({
+            success: true,
+            order: { id, status: 'cancelled' },
+            message: 'Order already cancelled. No additional refund applied.', 
+          })
+        }
         return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
       }
 
@@ -60,6 +93,20 @@ export async function PATCH(request: NextRequest, context: { params: Promise<{ i
       }, { status: 500 })
     }
 
+    if (
+      status === 'cancelled' &&
+      currentOrder?.status !== 'cancelled' &&
+      currentOrder?.order_source === 'offline_admin'
+    ) {
+      console.log(`[Admin Orders Status API] Processing offline cancellation wallet refund for order ${id}`)
+      const cancellationRefundResult = await processOfflineCancellationWalletRefund({
+        tenantId,
+        orderId: id,
+        reason: 'Order cancelled via admin status update',
+      })
+      console.log('[Admin Orders Status API] Offline cancellation wallet refund result:', cancellationRefundResult)
+    }
+
     // Invalidate cache
     revalidateTag(tenantOrdersTag(tenantId), 'default')
```

## 3) git diff -- src/server/admin/offlineOrderReturns.ts

```diff
git diff -- "src/server/admin/offlineOrderReturns.ts"
warning: in the working copy of 'src/server/admin/offlineOrderReturns.ts', CRLF will be replaced by LF the next time Git touches it
diff --git a/src/server/admin/offlineOrderReturns.ts b/src/server/admin/offlineOrderReturns.ts
index 81fc9a0..842ac11 100644
--- a/src/server/admin/offlineOrderReturns.ts
+++ b/src/server/admin/offlineOrderReturns.ts
@@ -1,5 +1,12 @@
 import { supabaseAdmin } from '@/server/supabaseAdmin'
 import { getWalletAccountId } from '@/lib/cashback/cashbackService'
+import {
+  assertRequestedReturnQuantityWithinRemaining,
+  computeOfflineWalletRefundSplit,
+  computeRemainingOrderRefundableCents,
+  computeRemainingReturnableQuantity,
+  isWithinReturnEditWindow,
+} from './orderSafetyRules'
 
 const adminDb = supabaseAdmin as any
 
@@ -27,6 +34,7 @@ interface OrderSnapshot {
   tenant_id: string
   customer_id: string | null
   order_number: string
+  created_at: string
   order_source: string | null
   status: string
   total_cents: number
@@ -774,7 +782,7 @@ export async function createOfflineOrderReturn(
 
   const { data: order, error: orderError } = await supabaseAdmin
     .from('orders')
-    .select('id, tenant_id, customer_id, order_number, order_source, status, total_cents, wallet_used_cents, cash_paid_cents, cashback_amount_cents')
+    .select('id, tenant_id, customer_id, order_number, created_at, order_source, status, total_cents, wallet_used_cents, cash_paid_cents, cashback_amount_cents')
     .eq('tenant_id', tenantId)
     .eq('id', orderId)
     .single()
@@ -797,6 +805,15 @@ export async function createOfflineOrderReturn(
     throw new Error('Only paid, fulfilled, or partially returned offline orders can be returned')
   }
 
+  const createdAtMs = new Date(orderSnapshot.created_at).getTime()
+  if (!Number.isFinite(createdAtMs)) {
+    throw new Error('Order has an invalid creation timestamp and cannot be edited for return')
+  }
+
+  if (!isWithinReturnEditWindow(orderSnapshot.created_at, Date.now(), 5)) {    
+    throw new Error('Return edit window closed. Additional returns are allowed only within 5 days of order creation')
+  }
+
   const normalizedClientRequestId = input.clientRequestId?.trim() || null      
 
   // Replay-safe idempotency lookup before any financial validation.
@@ -834,23 +851,6 @@ export async function createOfflineOrderReturn(
     }
   }
 
-  const { data: existingProcessedReturn, error: existingProcessedReturnError } = await adminDb
-    .from('order_returns')
-    .select('id, return_number')
-    .eq('tenant_id', tenantId)
-    .eq('order_id', orderId)
-    .eq('status', 'processed')
-    .limit(1)
-    .maybeSingle()
-
-  if (existingProcessedReturnError) {
-    throw new Error(`Failed to verify existing processed returns: ${existingProcessedReturnError.message}`)
-  }
-
-  if (existingProcessedReturn?.id) {
-    throw new Error(`Return already exists for this order (${existingProcessedReturn.return_number})`)
-  }
-
   const normalizedItems = input.items.map((item, index) => ({
     orderItemId: item.orderItemId,
     returnedQuantity: ensurePositiveInt(Number(item.returnedQuantity), `items[${index}].returnedQuantity`),
@@ -891,14 +891,50 @@ export async function createOfflineOrderReturn(
     }
   }
 
+  const { data: processedReturnHeaders, error: processedReturnHeadersError } = await adminDb
+    .from('order_returns')
+    .select('id')
+    .eq('tenant_id', tenantId)
+    .eq('order_id', orderId)
+    .eq('status', 'processed')
+
+  if (processedReturnHeadersError) {
+    throw new Error(`Failed to load processed returns for quantity validation: ${processedReturnHeadersError.message}`)
+  }
+
+  const processedReturnIds = (processedReturnHeaders || []).map((row: { id: string }) => row.id)
+  const alreadyReturnedQtyByOrderItem = new Map<string, number>()
+
+  if (processedReturnIds.length > 0) {
+    const { data: processedReturnItems, error: processedReturnItemsError } = await adminDb
+      .from('order_return_items')
+      .select('order_item_id, returned_quantity')
+      .eq('tenant_id', tenantId)
+      .in('order_return_id', processedReturnIds)
+      .in('order_item_id', orderItemIds)
+
+    if (processedReturnItemsError) {
+      throw new Error(`Failed to load prior returned quantities: ${processedReturnItemsError.message}`)
+    }
+
+    for (const row of processedReturnItems || []) {
+      const prev = alreadyReturnedQtyByOrderItem.get(row.order_item_id) || 0   
+      alreadyReturnedQtyByOrderItem.set(row.order_item_id, prev + Math.max(0, row.returned_quantity || 0))
+    }
+  }
+
   const pricedReturnItems = normalizedItems.map((item) => {
     const source = orderItemMap.get(item.orderItemId) as OrderItemSnapshot     
     const soldQty = source.quantity || 0
+    const alreadyReturnedQty = Math.min(soldQty, alreadyReturnedQtyByOrderItem.get(item.orderItemId) || 0)
+    const remainingQty = computeRemainingReturnableQuantity(soldQty, alreadyReturnedQty)
 
-    if (item.returnedQuantity > soldQty) {
-      throw new Error(`Return quantity exceeds sold quantity for order item ${item.orderItemId}`)
+    if (remainingQty <= 0) {
+      throw new Error(`Order item ${item.orderItemId} is already fully returned`)
     }
 
+    assertRequestedReturnQuantityWithinRemaining(item.returnedQuantity, soldQty, alreadyReturnedQty)
+
     const unitPrice = source.unit_price_cents || 0
     return {
       ...item,
@@ -920,57 +956,33 @@ export async function createOfflineOrderReturn(
 
   assertVariantRestockCanBeResolved(pricedReturnItems)
 
-  const maxWalletRefund = Math.min(orderSnapshot.wallet_used_cents || 0, totalReturnCents)
-  const fallbackWalletRefund = maxWalletRefund
-  const requestedWalletRefund = input.walletRefundCents
-  const requestedCashRefund = input.cashRefundCents
-
-  let walletRefundCents =
-    typeof requestedWalletRefund === 'number' ? Math.max(0, Math.floor(requestedWalletRefund)) : fallbackWalletRefund
-
-  let cashRefundCents =
-    typeof requestedCashRefund === 'number'
-      ? Math.max(0, Math.floor(requestedCashRefund))
-      : Math.max(0, totalReturnCents - walletRefundCents)
-
-  if (walletRefundCents + cashRefundCents !== totalReturnCents) {
-    throw new Error('walletRefundCents + cashRefundCents must equal total return amount')
-  }
-
-  if (walletRefundCents > maxWalletRefund) {
-    throw new Error('walletRefundCents cannot exceed wallet amount used in original order')
-  }
+  // Offline refund rule: full refundable return amount goes to wallet immediately.
+  const { walletRefundCents, cashRefundCents } = computeOfflineWalletRefundSplit(totalReturnCents)
 
   const { data: previousReturns, error: prevReturnError } = await adminDb      
     .from('order_returns')
-    .select('wallet_refund_cents, cash_refund_cents, cashback_reversal_cents') 
+    .select('wallet_refund_cents, cash_refund_cents, cashback_reversal_cents, total_return_cents')
     .eq('tenant_id', tenantId)
     .eq('order_id', orderId)
-    .neq('status', 'cancelled')
+    .eq('status', 'processed')
 
   if (prevReturnError) {
     throw new Error(`Failed to compute previous cashback reversals: ${prevReturnError.message}`)
   }
 
-  const alreadyRefundedWalletCents = (previousReturns || []).reduce(
-    (sum: number, row: { wallet_refund_cents?: number }) => sum + (row.wallet_refund_cents || 0),
+  const alreadyRefundedTotalCents = (previousReturns || []).reduce(
+    (sum: number, row: { total_return_cents?: number }) => sum + (row.total_return_cents || 0),
     0
   )
 
-  const alreadyRefundedCashCents = (previousReturns || []).reduce(
-    (sum: number, row: { cash_refund_cents?: number }) => sum + (row.cash_refund_cents || 0),
+  const remainingTotalRefundableCents = computeRemainingOrderRefundableCents(  
+    orderSnapshot.total_cents || 0,
+    alreadyRefundedTotalCents,
     0
   )
 
-  const remainingWalletRefundableCents = Math.max(0, (orderSnapshot.wallet_used_cents || 0) - alreadyRefundedWalletCents)
-  const remainingCashRefundableCents = Math.max(0, (orderSnapshot.cash_paid_cents || 0) - alreadyRefundedCashCents)
-
-  if (walletRefundCents > remainingWalletRefundableCents) {
-    throw new Error('walletRefundCents exceeds remaining refundable wallet amount for this order')
-  }
-
-  if (cashRefundCents > remainingCashRefundableCents) {
-    throw new Error('cashRefundCents exceeds remaining refundable cash amount for this order')
+  if (totalReturnCents > remainingTotalRefundableCents) {
+    throw new Error('Return total exceeds remaining refundable amount for this order')
   }
 
   const alreadyReversedCashbackCents = (previousReturns || []).reduce(
```

## 4) git diff --no-index -- /dev/null src/server/admin/offlineOrderCancellation.ts

```diff
git diff --no-index -- /dev/null "src/server/admin/offlineOrderCancellation.ts"
warning: in the working copy of 'src/server/admin/offlineOrderCancellation.ts', CRLF will be replaced by LF the next time Git touches it
diff --git a/src/server/admin/offlineOrderCancellation.ts b/src/server/admin/offlineOrderCancellation.ts
new file mode 100644
index 0000000..20ea750
--- /dev/null
+++ b/src/server/admin/offlineOrderCancellation.ts
@@ -0,0 +1,133 @@
+import { supabaseAdmin } from '@/server/supabaseAdmin'
+import { getWalletAccountId } from '@/lib/cashback/cashbackService'
+import { computeRemainingOrderRefundableCents } from './orderSafetyRules'      
+
+type OfflineOrderSnapshot = {
+  id: string
+  tenant_id: string
+  customer_id: string | null
+  order_number: string
+  order_source: string | null
+  total_cents: number
+}
+
+async function getExistingOfflineCancellationWalletCredits(tenantId: string, orderId: string): Promise<number> {
+  const { data, error } = await supabaseAdmin
+    .from('wallet_ledger')
+    .select('amount_cents')
+    .eq('tenant_id', tenantId)
+    .eq('entry_type', 'credit')
+    .eq('source_key', 'OFFLINE_ORDER_CANCELLATION_REFUND')
+    .eq('reference_id', orderId)
+
+  if (error) {
+    throw new Error(`Failed to load existing cancellation wallet credits: ${error.message}`)
+  }
+
+  return (data || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0)   
+}
+
+async function getAlreadyRefundedFromProcessedReturns(tenantId: string, orderId: string): Promise<number> {
+  const { data, error } = await supabaseAdmin
+    .from('order_returns')
+    .select('total_return_cents')
+    .eq('tenant_id', tenantId)
+    .eq('order_id', orderId)
+    .eq('status', 'processed')
+
+  if (error) {
+    throw new Error(`Failed to load processed return totals for cancellation refund: ${error.message}`)
+  }
+
+  return (data || []).reduce((sum, row) => sum + (row.total_return_cents || 0), 0)
+}
+
+export async function processOfflineCancellationWalletRefund(params: {
+  tenantId: string
+  orderId: string
+  reason?: string
+}) {
+  const { tenantId, orderId, reason } = params
+
+  const { data: order, error: orderError } = await supabaseAdmin
+    .from('orders')
+    .select('id, tenant_id, customer_id, order_number, order_source, total_cents')
+    .eq('tenant_id', tenantId)
+    .eq('id', orderId)
+    .single()
+
+  if (orderError || !order) {
+    throw new Error(`Failed to load order for offline cancellation refund: ${orderError?.message || 'Order not found'}`)
+  }
+
+  const snapshot = order as OfflineOrderSnapshot
+
+  if (snapshot.order_source !== 'offline_admin') {
+    return {
+      applied: false,
+      skipped: true,
+      reason: 'not_offline_order' as const,
+      creditedCents: 0,
+      remainingRefundableCents: 0,
+    }
+  }
+
+  if (!snapshot.customer_id) {
+    throw new Error('Offline cancellation refund requires a customer id on the order')
+  }
+
+  const [alreadyRefundedFromReturns, alreadyCreditedFromCancellation] = await Promise.all([
+    getAlreadyRefundedFromProcessedReturns(tenantId, orderId),
+    getExistingOfflineCancellationWalletCredits(tenantId, orderId),
+  ])
+
+  const remainingRefundableCents = computeRemainingOrderRefundableCents(       
+    snapshot.total_cents || 0,
+    alreadyRefundedFromReturns,
+    alreadyCreditedFromCancellation
+  )
+
+  if (remainingRefundableCents <= 0) {
+    return {
+      applied: false,
+      skipped: true,
+      reason: 'already_refunded' as const,
+      creditedCents: 0,
+      remainingRefundableCents: 0,
+    }
+  }
+
+  const accountId = await getWalletAccountId(snapshot.customer_id, tenantId)   
+
+  const { error: insertError } = await supabaseAdmin
+    .from('wallet_ledger')
+    .insert({
+      account_id: accountId,
+      tenant_id: tenantId,
+      entry_type: 'credit',
+      amount_cents: remainingRefundableCents,
+      currency: 'INR',
+      source_key: 'OFFLINE_ORDER_CANCELLATION_REFUND',
+      reference_id: orderId,
+      metadata: {
+        description: 'Offline order cancellation refund credited to wallet',   
+        order_id: orderId,
+        order_number: snapshot.order_number,
+        reason: reason || 'Order cancelled by admin',
+        already_refunded_from_returns_cents: alreadyRefundedFromReturns,       
+        already_credited_from_cancellation_cents: alreadyCreditedFromCancellation,
+      },
+    })
+
+  if (insertError) {
+    throw new Error(`Failed to insert offline cancellation wallet refund: ${insertError.message}`)
+  }
+
+  return {
+    applied: true,
+    skipped: false,
+    reason: 'wallet_credited' as const,
+    creditedCents: remainingRefundableCents,
+    remainingRefundableCents: 0,
+  }
+}
\ No newline at end of file
```

## 5) git diff --no-index -- /dev/null src/server/admin/orderSafetyRules.ts

```diff
git diff --no-index -- /dev/null "src/server/admin/orderSafetyRules.ts"
warning: in the working copy of 'src/server/admin/orderSafetyRules.ts', CRLF will be replaced by LF the next time Git touches it
diff --git a/src/server/admin/orderSafetyRules.ts b/src/server/admin/orderSafetyRules.ts
new file mode 100644
index 0000000..a1bed9d
--- /dev/null
+++ b/src/server/admin/orderSafetyRules.ts
@@ -0,0 +1,94 @@
+export function normalizePositiveInteger(value: number): number {
+  if (!Number.isFinite(value) || value <= 0) return 0
+  return Math.floor(value)
+}
+
+export function computeWalletUsageCap(totalCents: number, walletBalanceCents: number): number {
+  const safeTotal = Math.max(0, Math.floor(totalCents || 0))
+  const safeBalance = Math.max(0, Math.floor(walletBalanceCents || 0))
+  return Math.min(safeTotal, safeBalance)
+}
+
+export function assertWalletUsageWithinCap(
+  requestedWalletUsedCents: number,
+  totalCents: number,
+  walletBalanceCents: number
+) {
+  const requested = Math.max(0, Math.floor(requestedWalletUsedCents || 0))     
+  const cap = computeWalletUsageCap(totalCents, walletBalanceCents)
+
+  if (requested > cap) {
+    throw new Error(`Wallet used cannot exceed cap. Requested: ${requested}, Allowed: ${cap}`)
+  }
+}
+
+export function isWithinReturnEditWindow(
+  orderCreatedAt: string,
+  nowEpochMs = Date.now(),
+  allowedDays = 5
+): boolean {
+  const createdAtMs = new Date(orderCreatedAt).getTime()
+  if (!Number.isFinite(createdAtMs)) return false
+  const windowMs = Math.max(1, allowedDays) * 24 * 60 * 60 * 1000
+  return nowEpochMs - createdAtMs <= windowMs
+}
+
+export function computeRemainingReturnableQuantity(
+  soldQty: number,
+  alreadyReturnedQty: number
+): number {
+  const safeSold = Math.max(0, Math.floor(soldQty || 0))
+  const safeReturned = Math.max(0, Math.floor(alreadyReturnedQty || 0))        
+  return Math.max(0, safeSold - Math.min(safeSold, safeReturned))
+}
+
+export function assertRequestedReturnQuantityWithinRemaining(
+  requestedQty: number,
+  soldQty: number,
+  alreadyReturnedQty: number
+) {
+  const safeRequested = Math.max(0, Math.floor(requestedQty || 0))
+  const remainingQty = computeRemainingReturnableQuantity(soldQty, alreadyReturnedQty)
+
+  if (safeRequested <= 0) {
+    throw new Error('Requested return quantity must be positive')
+  }
+
+  if (safeRequested > remainingQty) {
+    throw new Error(`Requested return quantity exceeds remaining quantity. Requested: ${safeRequested}, Remaining: ${remainingQty}`)
+  }
+}
+
+export function assertValidBulkDeleteProductIds(productIds: string[]) {        
+  if (!Array.isArray(productIds) || productIds.length === 0) {
+    throw new Error('No product IDs provided for bulk delete')
+  }
+
+  for (const productId of productIds) {
+    if (!productId || typeof productId !== 'string' || productId.length !== 36) {
+      throw new Error('Invalid product ID format in bulk delete request')      
+    }
+  }
+}
+
+export function computeOfflineWalletRefundSplit(refundableAmountCents: number): {
+  walletRefundCents: number
+  cashRefundCents: number
+} {
+  const safe = Math.max(0, Math.floor(refundableAmountCents || 0))
+  return {
+    walletRefundCents: safe,
+    cashRefundCents: 0,
+  }
+}
+
+export function computeRemainingOrderRefundableCents(
+  orderTotalCents: number,
+  alreadyRefundedFromReturnsCents: number,
+  alreadyCreditedFromCancellationCents: number
+): number {
+  const total = Math.max(0, Math.floor(orderTotalCents || 0))
+  const fromReturns = Math.max(0, Math.floor(alreadyRefundedFromReturnsCents || 0))
+  const fromCancel = Math.max(0, Math.floor(alreadyCreditedFromCancellationCents || 0))
+  return Math.max(0, total - fromReturns - fromCancel)
+}
\ No newline at end of file
```

## 6) git diff --no-index -- /dev/null src/server/admin/offlineOrderCancellation.test.ts

```diff
git diff --no-index -- /dev/null "src/server/admin/offlineOrderCancellation.test.ts"
warning: in the working copy of 'src/server/admin/offlineOrderCancellation.test.ts', CRLF will be replaced by LF the next time Git touches it
diff --git a/src/server/admin/offlineOrderCancellation.test.ts b/src/server/admin/offlineOrderCancellation.test.ts
new file mode 100644
index 0000000..4b36902
--- /dev/null
+++ b/src/server/admin/offlineOrderCancellation.test.ts
@@ -0,0 +1,162 @@
+import { beforeEach, describe, expect, it, vi } from 'vitest'
+
+type MockState = {
+  orderSource: 'offline_admin' | 'online'
+  orderTotalCents: number
+  processedReturnRefundedCents: number
+  existingCancellationCreditedCents: number
+  insertedWalletCredits: any[]
+}
+
+const state: MockState = {
+  orderSource: 'offline_admin',
+  orderTotalCents: 2000,
+  processedReturnRefundedCents: 0,
+  existingCancellationCreditedCents: 0,
+  insertedWalletCredits: [],
+}
+
+function makeRowsForAmount(total: number) {
+  if (total <= 0) return []
+  return [{ amount_cents: total }]
+}
+
+function mockQueryResult(table: string, op: 'select' | 'insert', filters: Record<string, unknown>, insertPayload?: any) {
+  if (table === 'orders' && op === 'select') {
+    return {
+      data: {
+        id: String(filters.id || 'order-id'),
+        tenant_id: String(filters.tenant_id || 'tenant-id'),
+        customer_id: 'customer-1',
+        order_number: 'OFF-TEST-001',
+        order_source: state.orderSource,
+        total_cents: state.orderTotalCents,
+      },
+      error: null,
+    }
+  }
+
+  if (table === 'order_returns' && op === 'select') {
+    return {
+      data: makeRowsForAmount(state.processedReturnRefundedCents).map((r) => ({ total_return_cents: r.amount_cents })),
+      error: null,
+    }
+  }
+
+  if (table === 'wallet_ledger' && op === 'select') {
+    if (filters.source_key === 'OFFLINE_ORDER_CANCELLATION_REFUND') {
+      return {
+        data: makeRowsForAmount(state.existingCancellationCreditedCents),      
+        error: null,
+      }
+    }
+
+    return { data: [], error: null }
+  }
+
+  if (table === 'wallet_ledger' && op === 'insert') {
+    state.insertedWalletCredits.push(insertPayload)
+    return { error: null }
+  }
+
+  return { data: null, error: null }
+}
+
+function makeMockSupabaseAdmin() {
+  return {
+    from: vi.fn((table: string) => {
+      const filters: Record<string, unknown> = {}
+      let op: 'select' | 'insert' = 'select'
+      let insertPayload: any = null
+
+      const query: any = {
+        select: vi.fn(() => {
+          op = 'select'
+          return query
+        }),
+        eq: vi.fn((key: string, value: unknown) => {
+          filters[key] = value
+          return query
+        }),
+        single: vi.fn(async () => {
+          return mockQueryResult(table, op, filters, insertPayload)
+        }),
+        insert: vi.fn((payload: any) => {
+          op = 'insert'
+          insertPayload = payload
+          return query
+        }),
+        then: (resolve: any, reject: any) => {
+          return Promise.resolve(mockQueryResult(table, op, filters, insertPayload)).then(resolve, reject)
+        },
+      }
+
+      return query
+    }),
+  }
+}
+
+vi.mock('@/server/supabaseAdmin', () => ({
+  supabaseAdmin: makeMockSupabaseAdmin(),
+}))
+
+vi.mock('@/lib/cashback/cashbackService', () => ({
+  getWalletAccountId: vi.fn(async () => 'wallet-account-1'),
+}))
+
+import { processOfflineCancellationWalletRefund } from './offlineOrderCancellation'
+
+describe('processOfflineCancellationWalletRefund', () => {
+  beforeEach(() => {
+    state.orderSource = 'offline_admin'
+    state.orderTotalCents = 2000
+    state.processedReturnRefundedCents = 0
+    state.existingCancellationCreditedCents = 0
+    state.insertedWalletCredits = []
+  })
+
+  it('credits remaining refundable amount to wallet on offline cancellation', async () => {
+    state.processedReturnRefundedCents = 1000
+
+    const result = await processOfflineCancellationWalletRefund({
+      tenantId: 'tenant-1',
+      orderId: 'order-1',
+      reason: 'Admin cancellation approval',
+    })
+
+    expect(result.applied).toBe(true)
+    expect(result.creditedCents).toBe(1000)
+    expect(state.insertedWalletCredits).toHaveLength(1)
+    expect(state.insertedWalletCredits[0].source_key).toBe('OFFLINE_ORDER_CANCELLATION_REFUND')
+    expect(state.insertedWalletCredits[0].amount_cents).toBe(1000)
+    expect(state.insertedWalletCredits[0].reference_id).toBe('order-1')        
+  })
+
+  it('skips duplicate cancellation refund when already fully credited', async () => {
+    state.existingCancellationCreditedCents = 2000
+
+    const result = await processOfflineCancellationWalletRefund({
+      tenantId: 'tenant-1',
+      orderId: 'order-1',
+    })
+
+    expect(result.applied).toBe(false)
+    expect(result.skipped).toBe(true)
+    expect(result.reason).toBe('already_refunded')
+    expect(state.insertedWalletCredits).toHaveLength(0)
+  })
+
+  it('does not apply this rule for online orders', async () => {
+    state.orderSource = 'online'
+
+    const result = await processOfflineCancellationWalletRefund({
+      tenantId: 'tenant-1',
+      orderId: 'order-1',
+    })
+
+    expect(result.applied).toBe(false)
+    expect(result.skipped).toBe(true)
+    expect(result.reason).toBe('not_offline_order')
+    expect(state.insertedWalletCredits).toHaveLength(0)
+  })
+})
```

## 7) git diff --no-index -- /dev/null src/server/admin/orderSafetyRules.test.ts

```diff
git diff --no-index -- /dev/null "src/server/admin/orderSafetyRules.test.ts"
warning: in the working copy of 'src/server/admin/orderSafetyRules.test.ts', CRLF will be replaced by LF the next time Git touches it
diff --git a/src/server/admin/orderSafetyRules.test.ts b/src/server/admin/orderSafetyRules.test.ts
new file mode 100644
index 0000000..82638f2
--- /dev/null
+++ b/src/server/admin/orderSafetyRules.test.ts
@@ -0,0 +1,104 @@
+import { describe, expect, it } from 'vitest'
+import {
+  assertRequestedReturnQuantityWithinRemaining,
+  assertValidBulkDeleteProductIds,
+  assertWalletUsageWithinCap,
+  computeOfflineWalletRefundSplit,
+  computeRemainingOrderRefundableCents,
+  computeRemainingReturnableQuantity,
+  computeWalletUsageCap,
+  isWithinReturnEditWindow,
+} from './orderSafetyRules'
+
+describe('Bulk Delete Safety Rules', () => {
+  it('accepts valid UUID-like product ids', () => {
+    const ids = [
+      '11111111-1111-1111-1111-111111111111',
+      '22222222-2222-2222-2222-222222222222',
+    ]
+
+    expect(() => assertValidBulkDeleteProductIds(ids)).not.toThrow()
+  })
+
+  it('rejects empty list', () => {
+    expect(() => assertValidBulkDeleteProductIds([])).toThrow('No product IDs provided for bulk delete')
+  })
+
+  it('rejects malformed id', () => {
+    expect(() => assertValidBulkDeleteProductIds(['bad-id'])).toThrow('Invalid product ID format in bulk delete request')
+  })
+})
+
+describe('Wallet Cap Rules', () => {
+  it('computes wallet cap as min(total, balance)', () => {
+    expect(computeWalletUsageCap(10000, 5000)).toBe(5000)
+    expect(computeWalletUsageCap(10000, 25000)).toBe(10000)
+  })
+
+  it('passes when requested wallet is within cap', () => {
+    expect(() => assertWalletUsageWithinCap(4000, 10000, 5000)).not.toThrow()  
+  })
+
+  it('fails when requested wallet exceeds cap', () => {
+    expect(() => assertWalletUsageWithinCap(6000, 10000, 5000)).toThrow('Wallet used cannot exceed cap')
+  })
+})
+
+describe('Partial Return Rules', () => {
+  it('treats orders within 5 days as editable', () => {
+    const now = Date.parse('2026-04-11T00:00:00.000Z')
+    const createdAt = '2026-04-08T00:00:00.000Z'
+
+    expect(isWithinReturnEditWindow(createdAt, now, 5)).toBe(true)
+  })
+
+  it('treats orders older than 5 days as non-editable', () => {
+    const now = Date.parse('2026-04-11T00:00:00.000Z')
+    const createdAt = '2026-04-01T00:00:00.000Z'
+
+    expect(isWithinReturnEditWindow(createdAt, now, 5)).toBe(false)
+  })
+
+  it('computes remaining returnable quantity correctly', () => {
+    expect(computeRemainingReturnableQuantity(5, 2)).toBe(3)
+    expect(computeRemainingReturnableQuantity(5, 8)).toBe(0)
+  })
+
+  it('rejects return request beyond remaining quantity', () => {
+    expect(() => assertRequestedReturnQuantityWithinRemaining(4, 5, 2)).toThrow(
+      'Requested return quantity exceeds remaining quantity'
+    )
+  })
+
+  it('allows return request within remaining quantity', () => {
+    expect(() => assertRequestedReturnQuantityWithinRemaining(3, 5, 2)).not.toThrow()
+  })
+
+  it('offline partial return credits full returned amount to wallet (mixed payment example)', () => {
+    const split = computeOfflineWalletRefundSplit(1000)
+    expect(split.walletRefundCents).toBe(1000)
+    expect(split.cashRefundCents).toBe(0)
+  })
+
+  it('offline full return credits full amount to wallet on mixed payment', () => {
+    const split = computeOfflineWalletRefundSplit(2000)
+    expect(split.walletRefundCents).toBe(2000)
+    expect(split.cashRefundCents).toBe(0)
+  })
+
+  it('offline full return credits full amount to wallet with zero prior wallet use', () => {
+    const split = computeOfflineWalletRefundSplit(2000)
+    expect(split.walletRefundCents).toBe(2000)
+    expect(split.cashRefundCents).toBe(0)
+  })
+
+  it('computes remaining refundable amount for cancellation after partial return', () => {
+    // Total order 2000, partial return already refunded 1000, cancellation should refund 1000.
+    expect(computeRemainingOrderRefundableCents(2000, 1000, 0)).toBe(1000)     
+  })
+
+  it('duplicate cancellation trigger should have zero remaining refundable amount after prior cancellation credit', () => {
+    // Total 2000, no returns, already cancellation credited 2000.
+    expect(computeRemainingOrderRefundableCents(2000, 0, 2000)).toBe(0)        
+  })
+})
```
