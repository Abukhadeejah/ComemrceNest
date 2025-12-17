'use client'

import { CubeIcon, ExclamationTriangleIcon, XCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface InventoryStatsProps {
  stats: {
    totalProducts: number
    trackingInventory: number
    lowStockProducts: number
    outOfStockProducts: number
  }
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: CubeIcon,
      color: 'bg-blue-500',
      change: `${stats.trackingInventory} tracking inventory`,
      changeType: 'neutral' as const
    },
    {
      name: 'Low Stock',
      value: stats.lowStockProducts,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      change: stats.lowStockProducts > 0 ? 'Needs attention' : 'All good',
      changeType: stats.lowStockProducts > 0 ? 'negative' as const : 'positive' as const
    },
    {
      name: 'Out of Stock',
      value: stats.outOfStockProducts,
      icon: XCircleIcon,
      color: 'bg-red-500',
      change: stats.outOfStockProducts > 0 ? 'Restock needed' : 'In stock',
      changeType: stats.outOfStockProducts > 0 ? 'negative' as const : 'positive' as const
    },
    {
      name: 'Inventory Tracking',
      value: stats.trackingInventory,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      change: `${Math.round((stats.trackingInventory / stats.totalProducts) * 100)}% of products`,
      changeType: 'positive' as const
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className={`font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 
                stat.changeType === 'negative' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


