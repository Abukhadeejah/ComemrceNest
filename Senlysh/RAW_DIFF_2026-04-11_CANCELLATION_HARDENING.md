# RAW DIFF — 2026-04-11 — CANCELLATION HARDENING

```diff
diff --git a/src/server/admin/offlineOrderCancellation.ts b/src/server/admin/offlineOrderCancellation.ts
new file mode 100644
index 0000000..079e7f1
--- /dev/null
+++ b/src/server/admin/offlineOrderCancellation.ts
@@ -0,0 +1,143 @@
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
+    if (insertError.code === '23505') {
+      return {
+        applied: false,
+        skipped: true,
+        reason: 'already_refunded' as const,
+        creditedCents: 0,
+        remainingRefundableCents: 0,
+      }
+    }
+
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

```diff
diff --git a/src/server/admin/offlineOrderCancellation.test.ts b/src/server/admin/offlineOrderCancellation.test.ts
new file mode 100644
index 0000000..46d1fe4
--- /dev/null
+++ b/src/server/admin/offlineOrderCancellation.test.ts
@@ -0,0 +1,183 @@
+import { beforeEach, describe, expect, it, vi } from 'vitest'
+
+type MockState = {
+  orderSource: 'offline_admin' | 'online'
+  orderTotalCents: number
+  processedReturnRefundedCents: number
+  existingCancellationCreditedCents: number
+  simulateInsertUniqueConflict: boolean
+  insertedWalletCredits: any[]
+}
+
+const state: MockState = {
+  orderSource: 'offline_admin',
+  orderTotalCents: 2000,
+  processedReturnRefundedCents: 0,
+  existingCancellationCreditedCents: 0,
+  simulateInsertUniqueConflict: false,
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
+    if (state.simulateInsertUniqueConflict) {
+      return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
+    }
+
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
+    state.simulateInsertUniqueConflict = false
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
+
+  it('treats wallet ledger unique-conflict as idempotent skip', async () => {  
+    state.simulateInsertUniqueConflict = true
+
+    const result = await processOfflineCancellationWalletRefund({
+      tenantId: 'tenant-1',
+      orderId: 'order-1',
+      reason: 'Concurrent duplicate cancellation',
+    })
+
+    expect(result.applied).toBe(false)
+    expect(result.skipped).toBe(true)
+    expect(result.reason).toBe('already_refunded')
+  })
+})
```

```diff
diff --git a/migrations/add_offline_cancellation_wallet_refund_uniqueness.sql b/migrations/add_offline_cancellation_wallet_refund_uniqueness.sql
new file mode 100644
index 0000000..a03dd68
--- /dev/null
+++ b/migrations/add_offline_cancellation_wallet_refund_uniqueness.sql
@@ -0,0 +1,7 @@
+-- Ensure offline cancellation wallet refund can be credited at most once per order.
+-- This is the hard idempotency guard against concurrent duplicate cancellation processing.
+create unique index if not exists wallet_ledger_offline_cancel_refund_once_idx
+  on public.wallet_ledger (tenant_id, reference_id, source_key)
+  where source_key = 'OFFLINE_ORDER_CANCELLATION_REFUND'
+    and entry_type = 'credit'
+    and reference_id is not null;
```
