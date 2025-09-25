'use client'

interface SalesData {
  date: string
  revenue: number
  orders: number
}

interface SalesChartProps {
  data: SalesData[]
}

export function SalesChart({ data }: SalesChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue))

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.date} className="flex items-center space-x-4">
            <div className="w-16 text-sm text-gray-500">
              {formatDate(item.date)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="bg-blue-500 rounded h-4"
                  style={{ 
                    width: `${(item.revenue / maxRevenue) * 100}%`,
                    minWidth: '20px'
                  }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {item.orders} orders
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
