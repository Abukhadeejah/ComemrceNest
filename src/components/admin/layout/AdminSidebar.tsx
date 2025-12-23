'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  TagIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PhotoIcon,
  AcademicCapIcon,
  CalculatorIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminBranding, useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
import { BriefcaseIcon } from '@heroicons/react/24/outline'

function buildNavigation(tenant?: string, enabledModules?: Set<string>) {
  const base = [
    { key: 'dashboard', name: 'Dashboard', href: ADMIN_URLS.dashboard(tenant), icon: HomeIcon },
    { key: 'products', name: 'Products', href: ADMIN_URLS.products(tenant), icon: CubeIcon },
    { key: 'attributes', name: 'Attributes', href: ADMIN_URLS.attributes(tenant), icon: AdjustmentsHorizontalIcon },
    { key: 'categories', name: 'Categories', href: ADMIN_URLS.categories(tenant), icon: TagIcon },
    { key: 'tax-classes', name: 'Tax Classes', href: ADMIN_URLS.taxClasses(tenant), icon: CalculatorIcon },
    { key: 'orders', name: 'Orders', href: ADMIN_URLS.orders(tenant), icon: ShoppingCartIcon },
    { key: 'customers', name: 'Customers', href: ADMIN_URLS.customers(tenant), icon: UsersIcon },
    { key: 'portfolio', name: 'Portfolio', href: ADMIN_URLS.portfolio(tenant), icon: BriefcaseIcon },
    { key: 'hero', name: 'Hero Carousel', href: ADMIN_URLS.hero(tenant), icon: PhotoIcon },
    { key: 'tutorial', name: 'Tutorial', href: ADMIN_URLS.tutorial(tenant), icon: AcademicCapIcon },
    { key: 'analytics', name: 'Analytics', href: ADMIN_URLS.analytics(tenant), icon: ChartBarIcon },
    { key: 'settings', name: 'Settings', href: ADMIN_URLS.settings(tenant), icon: Cog6ToothIcon },
  ] as const

  if (!enabledModules) return base

  const always = new Set(['dashboard', 'settings', 'tax-classes'])
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

  const handleClose = () => {
    console.log('Closing sidebar')
    setOpen?.(false)
  }

  const getLogoPath = () => {
    if (brandingConfig?.brandLogo) return brandingConfig.brandLogo
    if (tenantKey === 'bluebell') return '/images/bluebell/logo.png'
    return '/images/senlysh/logo.png'
  }
  
  const logoPath = getLogoPath()
  const brandName = brandingConfig?.brandName || (tenantKey === 'bluebell' ? 'Bluebell' : 'Senlysh')

  return (
    <>
      {/* Mobile sidebar backdrop - FIXED: Changed to solid dark overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar - FIXED: Removed backdrop-blur, ensured solid white */}
      <div 
        className={`fixed inset-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`h-full flex flex-col bg-white shadow-2xl`}>
          {/* Mobile header - HUGE LOGO */}
          <div className="flex h-24 items-center justify-between px-6 border-b border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPath}
              alt={brandName}
              className="h-20 w-auto"
              style={{ maxWidth: '240px', minHeight: '80px' }}
              onError={(e) => {
                console.error('Logo failed to load:', logoPath)
                e.currentTarget.style.display = 'none'
              }}
            />
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              onClick={handleClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={handleClose}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
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
        <div className={`flex flex-col flex-grow border-r border-gray-200 ${brandingConfig?.sidebarBg || 'bg-white'} overflow-y-auto`}>
          {/* Desktop header - HUGE LOGO */}
          <div className="flex h-28 items-center px-6 border-b border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPath}
              alt={brandName}
              className="h-24 w-auto"
              style={{ maxWidth: '240px', minHeight: '96px' }}
              onError={(e) => {
                console.error('Logo failed to load:', logoPath)
                e.currentTarget.outerHTML = `<span class="text-xl font-bold text-gray-900">${brandName}</span>`
              }}
            />
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
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
