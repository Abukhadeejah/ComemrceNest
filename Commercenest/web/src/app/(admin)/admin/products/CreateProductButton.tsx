'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'

export function CreateProductButton() {
  const tenantKey = useAdminTenantKey()
  
  return (
    <Link
      href={ADMIN_URLS.productsNew(tenantKey)}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
      Add Product
    </Link>
  )
}




