import { getRegistryEntry } from '@/registry/tenantRegistry'
import { headers } from 'next/headers'
import { Metadata } from 'next'
import type { TenantKey } from '@/registry/types'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/senlysh'
  const tenantKey = (pathname.split('/')[1] as TenantKey) || 'senlysh'
  
  const registryEntry = getRegistryEntry(tenantKey)
  const { defaultMetadata } = await registryEntry.metadata()
  
  return defaultMetadata
}

export default async function SenlyshPage() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || '/senlysh'
  const tenantKey = (pathname.split('/')[1] as TenantKey) || 'senlysh'
  
  const registryEntry = getRegistryEntry(tenantKey)
  const HomeComponent = (await registryEntry.home()).default
  
  return <HomeComponent />
}
