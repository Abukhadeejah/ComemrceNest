import { getRegistryEntry, DEFAULT_ENTRY } from '@/registry/tenantRegistry'
import { parseComponentConfig, parseThemeConfig } from '@/server/config/schema'
import type { ComponentConfig, ThemeConfig } from '@/server/config/schema'
import type { RegistryEntry } from '@/registry/types'
import { getTenantConfig } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

// Cache for tenant configurations to avoid repeated database calls
const tenantConfigCache = new Map<string, { 
	config: TenantContext; 
	timestamp: number;
	age: number;
}>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 50 // Prevent memory leaks

export interface TenantContext {
	tenantId: string
	tenantKey: string
	registry: RegistryEntry // Explicit type instead of ReturnType
	componentConfig: ComponentConfig
	themeConfig: ThemeConfig
	featureFlags: Record<string, unknown>
}

// Structured logging function
function log(level: 'info' | 'warn' | 'error', stage: string, tenantKey: string, message: string, data?: unknown) {
	const logData: Record<string, unknown> = {
		level,
		stage,
		tenantKey,
		message,
		timestamp: new Date().toISOString(),
	}
	
	if (data) {
		logData.data = data
	}
	
	if (level === 'error') {
		console.error(`[resolver:${stage}]`, logData)
	} else if (level === 'warn') {
		console.warn(`[resolver:${stage}]`, logData)
	} else if (process.env.NODE_ENV === 'development') {
		console.info(`[resolver:${stage}]`, logData)
	}
}

/**
 * Normalizes tenant key to prevent cache fragmentation
 */
function normalizeTenantKey(tenantKey: string): string {
	return tenantKey.trim().toLowerCase() || 'default'
}

/**
 * Resolves tenant ID from tenant key using database lookup
 */
async function resolveTenantIdFromKey(tenantKey: string): Promise<string | null> {
	// Try exact name match first
	const { data: tenantData } = await supabaseAdmin
		.from('tenants')
		.select('id')
		.eq('name', tenantKey)
		.maybeSingle()
	
	if (tenantData?.id) return tenantData.id
	
	// Try case-insensitive name match
	const { data: tenantDataCI } = await supabaseAdmin
		.from('tenants')
		.select('id')
		.ilike('name', `%${tenantKey}%`)
		.maybeSingle()
	
	if (tenantDataCI?.id) return tenantDataCI.id
	
	// Try common tenant key mappings
	const keyMappings: Record<string, string> = {
		'bluebell': 'Bluebell Interiors',
		'senlysh': 'Senlysh Fashion',
	}
	
	const mappedName = keyMappings[tenantKey.toLowerCase()]
	if (mappedName) {
		const { data: mappedTenant } = await supabaseAdmin
			.from('tenants')
			.select('id')
			.eq('name', mappedName)
			.maybeSingle()
		
		if (mappedTenant?.id) return mappedTenant.id
	}
	
	return null
}

/**
 * Resolves tenant context from tenant key with caching and fallbacks
 */
export async function resolveTenantContext(tenantKey: string): Promise<TenantContext> {
	const normKey = normalizeTenantKey(tenantKey)
	
	// Check cache first
	const cacheKey = `tenant_context_${normKey}`
	const cached = tenantConfigCache.get(cacheKey)
	
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		const age = Date.now() - cached.timestamp
		log('info', 'cache-hit', normKey, `Cache hit (age: ${age}ms)`)
		return cached.config
	}
	
	log('info', 'cache-miss', normKey, 'Cache miss, resolving from database')

	try {
		// Get tenant ID from database
		const tenantId = await resolveTenantIdFromKey(normKey)
		if (!tenantId) {
			log('warn', 'resolve', normKey, 'Tenant not found, using default')
			return createDefaultTenantContext(normKey)
		}

		// Get tenant configuration (includes company profile)
		const tenantConfig = await getTenantConfig(tenantId)
		
		// Guard against undefined companyProfile
		const companyProfile = tenantConfig.companyProfile ?? {}
		
		// Parse configurations with fallbacks
		const componentConfig = parseComponentConfig(companyProfile.component_config)
		const themeConfig = parseThemeConfig(companyProfile.theme_config)
		const featureFlags = (companyProfile.feature_flags as Record<string, unknown>) ?? {}

		// Get registry entry explicitly
		const registry = getRegistryEntry(normKey)

		const context: TenantContext = {
			tenantId,
			tenantKey: normKey,
			registry, // Explicit RegistryEntry type
			componentConfig,
			themeConfig,
			featureFlags,
		}

		// Cache the result with age tracking
		const timestamp = Date.now()
		tenantConfigCache.set(cacheKey, {
			config: context,
			timestamp,
			age: 0
		})
		
		// Simple LRU eviction if cache gets too large
		if (tenantConfigCache.size > MAX_CACHE_SIZE) {
			const oldestKey = tenantConfigCache.keys().next().value
			if (oldestKey) {
				tenantConfigCache.delete(oldestKey)
				log('info', 'cache-eviction', normKey, `Evicted oldest cache entry: ${oldestKey}`)
			}
		}

		log('info', 'resolve', normKey, 'Successfully resolved tenant context')
		return context

	} catch (error) {
		log('error', 'resolve', normKey, 'Failed to resolve tenant context', { error: error instanceof Error ? error.message : String(error) })
		return createDefaultTenantContext(normKey)
	}
}

/**
 * Creates a default tenant context for fallback scenarios
 */
function createDefaultTenantContext(tenantKey: string): TenantContext {
	log('info', 'fallback', tenantKey, 'Creating default tenant context')
	
	return {
		tenantId: 'default',
		tenantKey,
		registry: DEFAULT_ENTRY, // Explicit RegistryEntry
		componentConfig: parseComponentConfig({}),
		themeConfig: parseThemeConfig({}),
		featureFlags: {},
	}
}

/**
 * Clears the tenant configuration cache (useful for testing or manual invalidation)
 */
export function clearTenantConfigCache(): void {
	const size = tenantConfigCache.size
	tenantConfigCache.clear()
	log('info', 'cache-clear', 'all', `Cleared cache (${size} entries)`)
}

/**
 * Gets cache statistics for monitoring
 */
export function getCacheStats(): { size: number; entries: string[]; ages: Record<string, number> } {
	const ages: Record<string, number> = {}
	const now = Date.now()
	
	for (const [key, entry] of tenantConfigCache.entries()) {
		ages[key] = now - entry.timestamp
	}
	
	return {
		size: tenantConfigCache.size,
		entries: Array.from(tenantConfigCache.keys()),
		ages
	}
}
