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
  Cog6ToothIcon,
  PhotoIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminBranding, useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
import { BriefcaseIcon } from '@heroicons/react/24/outline'

function buildNavigation(tenant?: string, enabledModules?: Set<string>) {
  const base = [
    { key: 'dashboard', name: 'Dashboard', href: ADMIN_URLS.dashboard(tenant), icon: HomeIcon },
    { key: 'products', name: 'Products', href: ADMIN_URLS.products(tenant), icon: CubeIcon },
    { key: 'categories', name: 'Categories', href: ADMIN_URLS.categories(tenant), icon: TagIcon },
    { key: 'orders', name: 'Orders', href: ADMIN_URLS.orders(tenant), icon: ShoppingCartIcon },
    { key: 'customers', name: 'Customers', href: ADMIN_URLS.customers(tenant), icon: UsersIcon },
    { key: 'portfolio', name: 'Portfolio', href: ADMIN_URLS.portfolio(tenant), icon: BriefcaseIcon },
    { key: 'hero', name: 'Hero Carousel', href: ADMIN_URLS.hero(tenant), icon: PhotoIcon },
    { key: 'tutorial', name: 'Tutorial', href: ADMIN_URLS.tutorial(tenant), icon: AcademicCapIcon },
    { key: 'analytics', name: 'Analytics', href: ADMIN_URLS.analytics(tenant), icon: ChartBarIcon },
    { key: 'settings', name: 'Settings', href: ADMIN_URLS.settings(tenant), icon: Cog6ToothIcon },
  ] as const

  if (!enabledModules) return base

  // Always show dashboard, settings; gate others by enabled modules
  const always = new Set(['dashboard', 'settings'])
  return base.filter(item => always.has(item.key) || enabledModules.has(item.key))
}

interface AdminSidebarProps {
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function AdminSidebar({ open = false, setOpen }: AdminSidebarProps) {
  const pathname = usePathname()
  const brandingConfig = useAdminBranding()
  const tenantKey = useAdminTenantKey()
  // Enabled modules are injected by parent layout via data-* attribute on body for simplicity (SSR safe)
  // Fallback to show all if not provided.
  let enabledModules: Set<string> | undefined
  if (typeof document !== 'undefined') {
    const data = document.body?.getAttribute('data-enabled-modules')
    if (data) {
      try {
        enabledModules = new Set(JSON.parse(data))
      } catch {}
    }
  }
  const navigation = buildNavigation(tenantKey, enabledModules)

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setOpen?.(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col ${brandingConfig?.sidebarBg || 'bg-white'}`}>
          <div className="flex h-16 items-center justify-between px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-8 w-auto"
              src={brandingConfig?.brandLogo || "/images/senlysh/logo.png"}
              alt={brandingConfig?.brandName || "Logo"}
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-40">
        <div className={`flex flex-col flex-grow border-r border-gray-200 ${brandingConfig?.sidebarBg || 'bg-white'}`}>
          <div className="flex h-16 items-center px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-8 w-auto"
              src={brandingConfig?.brandLogo || "/images/senlysh/logo.png"}
              alt={brandingConfig?.brandName || "Logo"}
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

