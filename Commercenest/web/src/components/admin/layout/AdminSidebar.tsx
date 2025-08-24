'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bars3Icon,
  HomeIcon,
  CubeIcon,
  TagIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { ADMIN_URLS } from '@/utils/admin-urls'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: ADMIN_URLS.products(), icon: CubeIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Orders', href: ADMIN_URLS.orders(), icon: ShoppingCartIcon },
  { name: 'Customers', href: ADMIN_URLS.customers(), icon: UsersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: ADMIN_URLS.settings(), icon: Cog6ToothIcon },
]

interface AdminSidebarProps {
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function AdminSidebar({ open = false, setOpen }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen?.(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <img
              className="h-8 w-auto"
              src="/images/senlysh/logo.png"
              alt="Logo"
            />
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setOpen?.(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setOpen?.(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <img
              className="h-8 w-auto"
              src="/images/senlysh/logo.png"
              alt="Logo"
            />
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

