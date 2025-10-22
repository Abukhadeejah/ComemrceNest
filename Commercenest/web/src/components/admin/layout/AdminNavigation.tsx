'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Squares2X2Icon,
  CubeIcon,
  TagIcon,
  ShoppingCartIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Squares2X2Icon },
  { name: 'Products', href: '/admin/products', icon: CubeIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Tax Classes', href: '/admin/tax-classes', icon: CalculatorIcon },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCartIcon },
  { name: 'Content', href: '/admin/content', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Team', href: '/admin/team', icon: UserGroupIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
]

export function AdminNavigation() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                      ${isActive 
                        ? 'bg-gray-50 text-indigo-600' 
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon 
                      className={`h-6 w-6 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'
                      }`} 
                      aria-hidden="true" 
                    />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </li>
        
        {/* Quick Stats */}
        <li className="mt-auto">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Stats</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total Products</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Orders</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Items</span>
                <span className="font-medium text-red-600">0</span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  )
}

