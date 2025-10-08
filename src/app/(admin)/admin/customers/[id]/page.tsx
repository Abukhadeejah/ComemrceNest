import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

interface PageProps {
	params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
	const { id } = await params
	const customerId = decodeURIComponent(id)
	const tenantId = await resolveTenantIdFromRequest()
	if (!tenantId) return null
	await assertTenantAdmin(tenantId)

	// Aggregate customer data from orders by email
	const { data: orders, error } = await supabaseAdmin
		.from('orders')
		.select('id, order_number, status, total_cents, currency, created_at')
		.eq('tenant_id', tenantId)
		.eq('email', customerId)
		.order('created_at', { ascending: false })

	if (error) {
		return (
			<div className="p-6">
				<h1 className="text-lg font-semibold">Customer</h1>
				<p className="text-sm text-red-600">Failed to load customer details</p>
			</div>
		)
	}

	const totalOrders = orders?.length || 0
	const totalSpent = (orders || [])
		.filter(o => o.status === 'paid')
		.reduce((sum, o) => sum + (o.total_cents || 0), 0)

	const formatCurrency = (cents: number) =>
		new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((cents || 0) / 100)

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">{customerId}</h1>
					<p className="text-sm text-gray-600">Customer details and order history</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="rounded border bg-white p-4">
					<div className="text-sm text-gray-500">Total orders</div>
					<div className="text-xl font-semibold">{totalOrders}</div>
				</div>
				<div className="rounded border bg-white p-4">
					<div className="text-sm text-gray-500">Total spent</div>
					<div className="text-xl font-semibold">{formatCurrency(totalSpent)}</div>
				</div>
				<div className="rounded border bg-white p-4">
					<div className="text-sm text-gray-500">Paid orders</div>
					<div className="text-xl font-semibold">{(orders || []).filter(o => o.status === 'paid').length}</div>
				</div>
			</div>

			<div className="rounded border bg-white">
				<div className="px-4 py-3 border-b text-sm font-medium">Order history</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
								<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{(orders || []).map(o => (
								<tr key={o.id}>
									<td className="px-4 py-2 text-sm text-blue-700">{o.order_number}</td>
									<td className="px-4 py-2 text-sm">{o.status}</td>
									<td className="px-4 py-2 text-sm">{formatCurrency(o.total_cents)}</td>
									<td className="px-4 py-2 text-sm text-gray-600">{new Date(o.created_at).toLocaleString('en-IN')}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)
}
