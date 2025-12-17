import type { RegistryEntry, TenantKey } from './types'
import type { ComponentType } from 'react'

// Canonical default entry used for unknown tenants and import fallbacks
export const DEFAULT_ENTRY: RegistryEntry = {
	header: () => import('@/components/tenant/DefaultHeader') as Promise<{ default: ComponentType<Record<string, unknown>> }>,
	footer: () => import('@/components/tenant/DefaultFooter') as Promise<{ default: ComponentType<Record<string, unknown>> }>,
	layout: () => import('@/components/tenant/DefaultLayout') as Promise<{ default: ComponentType<Record<string, unknown>> }>,
	home: () => import('@/components/tenant/DefaultHome') as Promise<{ default: ComponentType<Record<string, unknown>> }>,
	metadata: async () => {
		const mod = await import('@/components/tenant/DefaultMetadata')
		return {
			defaultMetadata: mod.defaultMetadata,
			getPageMetadata: mod.getPageMetadata
		}
	},
	adminBranding: async () => {
		const mod = await import('@/components/tenant/DefaultAdminBranding')
		return {
			default: mod.default,
			adminBrandingConfig: mod.adminBrandingConfig
		}
	},
	welcomeBanner: () => import('@/components/tenant/DefaultWelcomeBanner') as Promise<{ default: ComponentType<Record<string, unknown>> }>,
}

export const TENANT_REGISTRY: Readonly<Record<TenantKey, RegistryEntry>> = {
	bluebell: {
		header: () => import('@/tenants/bluebell/components/Header').catch(() => DEFAULT_ENTRY.header()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		footer: () => import('@/tenants/bluebell/components/Footer').catch(() => DEFAULT_ENTRY.footer()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		layout: () => import('@/tenants/bluebell/components/Layout').catch(() => DEFAULT_ENTRY.layout()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		home: () => import('@/tenants/bluebell/components/HomeServer').catch(() => DEFAULT_ENTRY.home()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		metadata: async () => {
			try {
				const mod = await import('@/tenants/bluebell/components/Metadata')
				return {
					defaultMetadata: mod.defaultMetadata,
					getPageMetadata: mod.getPageMetadata
				}
			} catch {
				return DEFAULT_ENTRY.metadata()
			}
		},
		adminBranding: async () => {
			try {
				const mod = await import('@/tenants/bluebell/components/AdminBranding')
				return {
					default: mod.default,
					adminBrandingConfig: mod.adminBrandingConfig
				}
			} catch {
				return DEFAULT_ENTRY.adminBranding()
			}
		},
		welcomeBanner: () => import('@/tenants/bluebell/components/WelcomeBanner').catch(() => DEFAULT_ENTRY.welcomeBanner()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
	},
	senlysh: {
		header: () => import('@/tenants/senlysh/components/Header').catch(() => DEFAULT_ENTRY.header()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		footer: () => import('@/tenants/senlysh/components/Footer').catch(() => DEFAULT_ENTRY.footer()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		layout: () => import('@/tenants/senlysh/components/Layout').catch(() => DEFAULT_ENTRY.layout()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		home: () => import('@/tenants/senlysh/components/HomeServer').catch(() => DEFAULT_ENTRY.home()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
		metadata: async () => {
			try {
				const mod = await import('@/tenants/senlysh/components/Metadata')
				return {
					defaultMetadata: mod.defaultMetadata,
					getPageMetadata: mod.getPageMetadata
				}
			} catch {
				return DEFAULT_ENTRY.metadata()
			}
		},
		adminBranding: async () => {
			try {
				const mod = await import('@/tenants/senlysh/components/AdminBranding')
				return {
					default: mod.default,
					adminBrandingConfig: mod.adminBrandingConfig
				}
			} catch {
				return DEFAULT_ENTRY.adminBranding()
			}
		},
		welcomeBanner: () => import('@/tenants/senlysh/components/WelcomeBanner').catch(() => DEFAULT_ENTRY.welcomeBanner()) as Promise<{ default: ComponentType<Record<string, unknown>> }>,
	},
	default: DEFAULT_ENTRY,
}

export function getRegistryEntry(tenantKey: TenantKey): RegistryEntry {
    return TENANT_REGISTRY[tenantKey] || DEFAULT_ENTRY
}

// Dev-only validation (logs once per slot)
const _seen = new Set<string>()
function validateRegistryForDev() {
    if (process.env.NODE_ENV !== 'development') return
    
    const slots: Array<keyof RegistryEntry> = ['header', 'footer', 'layout', 'welcomeBanner']
    
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
