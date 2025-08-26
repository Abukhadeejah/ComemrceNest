import type { RegistryEntry, TenantKey } from './types'

// Canonical default entry used for unknown tenants and import fallbacks
export const DEFAULT_ENTRY: RegistryEntry = {
    header: () => import('@/components/tenant/DefaultHeader'),
    footer: () => import('@/components/tenant/DefaultFooter'),
    layout: () => import('@/components/tenant/DefaultLayout'),
}

export const TENANT_REGISTRY: Readonly<Record<TenantKey, RegistryEntry>> = {
    bluebell: {
        header: () => import('@/tenants/bluebell/components/Header').catch(() => DEFAULT_ENTRY.header()),
        footer: () => import('@/tenants/bluebell/components/Footer').catch(() => DEFAULT_ENTRY.footer()),
        layout: () => import('@/tenants/bluebell/components/Layout').catch(() => DEFAULT_ENTRY.layout()),
    },
    senlysh: {
        header: () => import('@/tenants/senlysh/components/Header').catch(() => DEFAULT_ENTRY.header()),
        footer: () => import('@/tenants/senlysh/components/Footer').catch(() => DEFAULT_ENTRY.footer()),
        layout: () => import('@/tenants/senlysh/components/Layout').catch(() => DEFAULT_ENTRY.layout()),
    },
    default: DEFAULT_ENTRY,
} as const

// Safe accessor: unknown tenant falls back to default
export function getRegistryEntry(tenantKey: string): RegistryEntry {
    return TENANT_REGISTRY[(tenantKey as TenantKey)] ?? DEFAULT_ENTRY
}

// Dev-only validation (logs once per slot)
const _seen = new Set<string>()
function validateRegistryForDev() {
    if (process.env.NODE_ENV !== 'development') return
    
    const slots: Array<keyof RegistryEntry> = ['header', 'footer', 'layout']
    
    for (const [key, entry] of Object.entries(TENANT_REGISTRY)) {
        for (const slot of slots) {
            if (typeof entry[slot] !== 'function') {
                const id = `${key}:${String(slot)}`
                if (!_seen.has(id)) {
                    _seen.add(id)
                    console.warn(`[registry] Missing loader for ${key}.${String(slot)}; default will be used`)
                }
            }
        }
    }
}

validateRegistryForDev()

// Compile-time satisfaction check (no runtime effect)
const _satisfies: Readonly<Record<TenantKey, RegistryEntry>> = TENANT_REGISTRY
void _satisfies
