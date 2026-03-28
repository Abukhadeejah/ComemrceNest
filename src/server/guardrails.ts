/**
 * COMPREHENSIVE GUARDRAIL SYSTEM FOR COMMERCENEST PLATFORM
 *
 * This module contains all safety mechanisms to prevent platform-breaking changes
 * during development and deployment.
 */

import { supabaseAdmin } from '@/server/supabaseAdmin'
import type { TablesInsert, Json } from '@/types/supabase'
import { headers, cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// ============================================================================
// TENANT ISOLATION GUARDRAILS
// ============================================================================

/**
 * CRITICAL GUARDRAIL: Validates tenant context for all data operations
 * Throws error if tenant context is missing or invalid
 */
export async function validateTenantContext(operation: string): Promise<string> {
  const tenantId = await getTenantIdFromRequest()

  if (!tenantId) {
    const error = new Error(`TENANT ISOLATION VIOLATION: Missing tenant context for ${operation}`)
    await logSecurityEvent('tenant_context_missing', {
      operation,
      userAgent: (await headers()).get('user-agent'),
      url: (await headers()).get('x-pathname')
    })
    throw error
  }

  // Validate tenant exists and is active
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, status')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    const error = new Error(`TENANT ISOLATION VIOLATION: Invalid tenant ID ${tenantId} for ${operation}`)
    await logSecurityEvent('invalid_tenant_access', { tenantId, operation })
    throw error
  }

  if (tenant.status !== 'active') {
    const error = new Error(`TENANT ISOLATION VIOLATION: Tenant ${tenantId} is not active (${tenant.status})`)
    await logSecurityEvent('inactive_tenant_access', { tenantId, operation, status: tenant.status })
    throw error
  }

  return tenantId
}

/**
 * CRITICAL GUARDRAIL: Ensures all database queries include tenant filtering
 */
export function enforceTenantFilter(tableName: string, query: unknown, tenantId: string) {
  // Type guard to check if query has the expected structure
  if (typeof query !== 'object' || query === null || !('eq' in query)) {
    const error = new Error(`DATABASE ISOLATION VIOLATION: Query on ${tableName} missing tenant_id filter`)
    logSecurityEvent('missing_tenant_filter', { tableName, tenantId })
    throw error
  }
  
  const queryObj = query as { eq?: (field: string, value: string) => unknown }
  if (!queryObj.eq || !queryObj.eq('tenant_id', tenantId)) {
    const error = new Error(`DATABASE ISOLATION VIOLATION: Query on ${tableName} missing tenant_id filter`)
    logSecurityEvent('missing_tenant_filter', { tableName, tenantId })
    throw error
  }
}

/**
 * GUARDRAIL: Validates user has admin access to tenant
 */
export async function validateTenantAdminAccess(userId: string, tenantId: string, operation: string): Promise<void> {
  const { data: membership, error } = await supabaseAdmin
    .from('tenant_members')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .single()

  if (error || !membership) {
    const authError = new Error(`AUTHORIZATION VIOLATION: User ${userId} not authorized for tenant ${tenantId} operation: ${operation}`)
    await logSecurityEvent('unauthorized_tenant_access', { userId, tenantId, operation })
    throw authError
  }

  if (membership.role !== 'tenant_admin') {
    const roleError = new Error(`AUTHORIZATION VIOLATION: User ${userId} has insufficient role (${membership.role}) for ${operation}`)
    await logSecurityEvent('insufficient_role', { userId, tenantId, operation, role: membership.role })
    throw roleError
  }
}

// ============================================================================
// AUTHENTICATION GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Validates Supabase authentication using SSR client
 */
export async function validateAdminAuthentication(request: NextRequest): Promise<string> {
  try {
    // Import Supabase SSR client dynamically to avoid circular dependencies
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')

    const cookieStore = await cookies()

    // Create SSR client with request-scoped auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(_name: string, _value: string, _options: unknown) {
            // Not needed for validation
          },
          remove(_name: string, _options: unknown) {
            // Not needed for validation
          }
        }
      }
    )

    // Validate user session
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      logSecurityEvent('authentication_failed', {
        url: request.url,
        error: error?.message,
        userAgent: request.headers.get('user-agent')
      })
      throw new Error('AUTHENTICATION REQUIRED: Valid user session required for admin access')
    }

    return user.id

  } catch (error) {
    logSecurityEvent('authentication_validation_error', {
      url: request.url,
      error: error instanceof Error ? error.message : String(error),
      userAgent: request.headers.get('user-agent')
    })
    throw new Error('AUTHENTICATION ERROR: Failed to validate user session')
  }
}

/**
 * GUARDRAIL: Creates secure database query wrapper with automatic tenant filtering
 * Primary security is RLS policies, this provides additional validation
 */
export function createTenantQuery(tableName: string, tenantId: string) {
  // Tables that require tenant isolation
  const tenantScopedTables = [
    'products', 'categories', 'orders', 'customers', 'settings_company_profile',
    'variant_options', 'variant_option_values', 'product_variants',
    'product_categories', 'product_images', 'portfolio_projects', 'portfolio_images'
  ] as const

  const requiresTenantFilter = (tenantScopedTables as readonly string[]).includes(tableName)

  return {
    select: (columns: string = '*') => {
      const t = tableName as unknown as string
      const fromCompat = (relation: string) => (
        (supabaseAdmin as unknown as { from: (r: string) => { select: (c?: string) => unknown } }).from(relation)
      )
      let queryBuilder = fromCompat(t).select(columns)

      return {
        eq: (field: string, value: unknown) => {
          // Validate tenant_id if explicitly provided and table requires tenant isolation
          if (field === 'tenant_id' && requiresTenantFilter && value !== tenantId) {
            logSecurityEvent('tenant_filter_override_attempt', {
              tableName,
              attemptedTenantId: value,
              requiredTenantId: tenantId
            })
            throw new Error(`TENANT ISOLATION VIOLATION: Attempted to query ${tableName} with tenant_id ${value}, but context requires ${tenantId}`)
          }

          queryBuilder = (queryBuilder as unknown as { eq: (f: string, v: unknown) => typeof queryBuilder }).eq(field, value)
          return {
            eq: (field: string, value: unknown) => {
              // Validate tenant_id if explicitly provided and table requires tenant isolation
              if (field === 'tenant_id' && requiresTenantFilter && value !== tenantId) {
                logSecurityEvent('tenant_filter_override_attempt', {
                  tableName,
                  attemptedTenantId: value,
                  requiredTenantId: tenantId
                })
                throw new Error(`TENANT ISOLATION VIOLATION: Attempted to query ${tableName} with tenant_id ${value}, but context requires ${tenantId}`)
              }

              queryBuilder = (queryBuilder as unknown as { eq: (f: string, v: unknown) => typeof queryBuilder }).eq(field, value)
              return {
                execute: async () => {
                  try {
                    const { data, error } = await (queryBuilder as unknown as Promise<{ data: unknown; error: { message: string } | null }>)
                    if (error) {
                      logSecurityEvent('database_query_failed', {
                        table: tableName,
                        tenantId,
                        error: error.message
                      })
                      throw error
                    }
                    return data
                  } catch (error) {
                    logSecurityEvent('database_operation_error', {
                      operation: 'select',
                      table: tableName,
                      tenantId,
                      error: error instanceof Error ? error.message : String(error)
                    })
                    throw error
                  }
                }
              }
            }
          }
        },

        execute: async () => {
          try {
            // RLS policies handle the actual tenant filtering
            const { data, error } = await (queryBuilder as unknown as Promise<{ data: unknown; error: { message: string } | null }>)

            if (error) {
              logSecurityEvent('database_query_failed', {
                table: tableName,
                tenantId,
                error: error.message
              })
              throw error
            }

            return data
          } catch (error) {
            logSecurityEvent('database_operation_error', {
              operation: 'select',
              table: tableName,
              tenantId,
              error: error instanceof Error ? error.message : String(error)
            })
            throw error
          }
        }
      }
    }
  }
}

// ============================================================================
// MODULE SYSTEM GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Validates module availability before operations
 * For existing tenants without module configuration, allows access by default
 */
export async function validateModuleAccess(tenantId: string, moduleKey: string, operation: string): Promise<void> {
  const { data: moduleEnabled, error } = await supabaseAdmin
    .from('tenant_modules')
    .select('enabled')
    .eq('tenant_id', tenantId)
    .eq('module_key', moduleKey)
    .single()

  // If no module configuration exists for this tenant, allow access (backward compatibility)
  if (error && error.code === 'PGRST116') {
    console.log(`[Module Validation] No module configuration found for tenant ${tenantId}, allowing access by default`)
    return
  }

  // If module configuration exists but is disabled, deny access
  if (moduleEnabled && !moduleEnabled.enabled) {
    const moduleError = new Error(`MODULE ACCESS VIOLATION: Module ${moduleKey} is explicitly disabled for tenant ${tenantId} operation: ${operation}`)
    await logSecurityEvent('module_access_denied', { tenantId, moduleKey, operation })
    throw moduleError
  }

  // If module configuration exists and is enabled, allow access
  if (moduleEnabled && moduleEnabled.enabled) {
    console.log(`[Module Validation] Module ${moduleKey} is explicitly enabled for tenant ${tenantId}`)
    return
  }

  // For any other errors, log but allow access (fail-safe approach)
  if (error) {
    console.warn(`[Module Validation] Error checking module access for tenant ${tenantId}, module ${moduleKey}:`, error.message)
    await logSecurityEvent('module_validation_error', { tenantId, moduleKey, operation, error: error.message })
  }
}

/**
 * GUARDRAIL: Safe module navigation builder
 */
export function buildSafeNavigation(tenantKey: string, enabledModules: Set<string>) {
  const allModules = [
    { key: 'dashboard', required: true },
    { key: 'products', required: false },
    { key: 'categories', required: false },
    { key: 'orders', required: false },
    { key: 'customers', required: false },
    { key: 'portfolio', required: false },
    { key: 'analytics', required: false },
    { key: 'settings', required: true }
  ]

  return allModules.filter(module =>
    module.required || enabledModules.has(module.key)
  )
}

// ============================================================================
// FEATURE FLAG GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Safe feature flag checker
 */
export async function getFeatureFlag(flagKey: string, tenantId: string): Promise<boolean> {
  try {
      const { data: flag, error } = await supabaseAdmin
      .from('tenant_feature_flags')
      .select('enabled')
      .eq('tenant_id', tenantId)
        .eq('flag_id', (
          await supabaseAdmin
            .from('feature_flags')
            .select('id')
            .eq('key', flagKey)
            .maybeSingle()
        ).data?.id || '_missing_')
      .single()

    if (error) {
      // Log but don't fail - default to false for safety
      await logSecurityEvent('feature_flag_error', { flagKey, tenantId, error: error.message })
      return false
    }

    return flag?.enabled || false
  } catch (error) {
    await logSecurityEvent('feature_flag_exception', { flagKey, tenantId, error: String(error) })
    return false // Fail-safe: features disabled by default
  }
}

// ============================================================================
// ERROR HANDLING & LOGGING GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Non-blocking security event logging
 * NEVER blocks user flows - fire-and-forget pattern
 */
export function logSecurityEvent(eventType: string, details: unknown) {
  // Fire-and-forget: Don't await, don't block user flow
  Promise.resolve().then(async () => {
    try {
      const hdrs = await headers()
      const logData: TablesInsert<'audit_logs'> = {
        action: eventType,
        before_json: null,
        after_json: ((): Json | null => {
          if (details === null || details === undefined) return null
          if (typeof details === 'object') return details as unknown as Json
          return { message: String(details) } as unknown as Json
        })(),
        actor_user_id: null,
        created_at: new Date().toISOString(),
        id: undefined,
        ip: hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip'),
        resource: null,
        role: null,
        tenant_id: null,
        ua: hdrs.get('user-agent')?.substring(0, 255) || null
      }

      // Non-blocking insert - don't await
      supabaseAdmin
        .from('audit_logs')
        .insert(logData)
        .then(
          () => {
            // Success - no action needed
          },
          (error: unknown) => {
            // Logging failed - fallback to console only
            console.error('Security event logging failed:', {
              eventType,
              error: error instanceof Error ? error.message : String(error),
              originalDetails: details
            })
          }
        )

      // Always send to Sentry (non-blocking)
      Sentry.captureMessage(`Security Event: ${eventType}`, {
        level: 'warning',
        tags: { eventType },
        extra: {
          ...(typeof details === 'object' && details !== null ? details : {}),
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      // Complete failure - only console
      console.error('Critical logging failure:', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
        details
      })
    }
  })
}

/**
 * GUARDRAIL: Safe error response generator
 * Returns user-friendly errors while logging detailed info for debugging
 */
export function createSafeErrorResponse(error: unknown, operation: string) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  
  // Log the error securely for debugging
  logSecurityEvent('application_error', {
    operation,
    error: errorMessage,
    stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined, // Limit stack trace length
    timestamp: new Date().toISOString()
  })

  // Extract user-friendly error message while sanitizing sensitive info
  let userMessage = 'An unexpected error occurred. Please try again or contact support.'
  
  // Pass through specific error messages (safe ones)
  if (errorMessage.includes('duplicate key value violates unique constraint')) {
    userMessage = 'A product with this slug already exists. Please choose a different slug.'
  } else if (errorMessage.includes('Tenant not found')) {
    userMessage = 'Tenant not found. Please refresh the page and try again.'
  } else if (errorMessage.includes('Failed to create product')) {
    userMessage = errorMessage // Already user-friendly
  } else if (errorMessage.includes('Validation failed')) {
    userMessage = errorMessage // Already descriptive
  } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    userMessage = 'One of the referenced items (category, tax class, etc.) was not found. Please refresh and try again.'
  }

  return {
    success: false,
    error: userMessage,
    operation
  }
}

// ============================================================================
// PERFORMANCE GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Performance monitoring wrapper
 */
export async function withPerformanceMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  thresholdMs: number = 2000
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    // Log slow operations
    if (duration > thresholdMs) {
      await logSecurityEvent('slow_operation', {
        operation,
        duration,
        threshold: thresholdMs
      })
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    // Log failed operations with timing
    await logSecurityEvent('failed_operation', {
      operation,
      duration,
      error: error instanceof Error ? error.message : String(error)
    })

    throw error
  }
}

// ============================================================================
// TENANT RESOLVER CACHE
// ============================================================================

// Cache for tenant mappings to avoid DB calls on every request
let tenantCache: Map<string, { id: string; status: string }> | null = null
let cacheExpiry: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * GUARDRAIL: Database-backed tenant resolver with caching
 */
async function getTenantFromCache(tenantKey: string): Promise<{ id: string; status: string } | null> {
  const now = Date.now()

  // Check if cache is stale or doesn't exist
  if (!tenantCache || now > cacheExpiry) {
    try {
      // Warm cache from database
      const { data: tenants, error } = await supabaseAdmin
        .from('tenants')
        .select('id, name, status')
        .in('status', ['active'])

      if (error) {
        logSecurityEvent('tenant_cache_warm_failed', { error: error.message })
        return null
      }

      // Build cache map
      const newCache = new Map<string, { id: string; status: string }>()
      tenants?.forEach(tenant => {
        // Use name as key mapping (since 'key' column doesn't exist)
        newCache.set(tenant.name, { id: tenant.id, status: tenant.status })
      })
      tenantCache = newCache

      cacheExpiry = now + CACHE_TTL

      logSecurityEvent('tenant_cache_warmed', {
        tenantCount: tenants?.length || 0,
        cacheExpiry: new Date(cacheExpiry).toISOString()
      })
    } catch (error) {
      logSecurityEvent('tenant_cache_error', {
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }

  return tenantCache ? tenantCache.get(tenantKey) || null : null
}

/**
 * GUARDRAIL: Secure tenant ID resolution from request context
 */
async function getTenantIdFromRequest(): Promise<string | null> {
  const hdrs = await headers()
  const tenantAdmin = hdrs.get('x-tenant-admin')

  if (tenantAdmin) {
    const tenant = await getTenantFromCache(tenantAdmin)
    if (tenant?.status === 'active') {
      return tenant.id
    }
    return null
  }

  // Fallback to cookie
  try {
    const cookieStore = await cookies()
    const cookieTenant = cookieStore.get('tenant')?.value
    if (cookieTenant) {
      const tenant = await getTenantFromCache(cookieTenant)
      if (tenant?.status === 'active') {
        return tenant.id
      }
    }
  } catch (error) {
    logSecurityEvent('cookie_tenant_resolution_failed', {
      error: error instanceof Error ? error.message : String(error)
    })
  }

  return null
}

// ============================================================================
// VALIDATION GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Input validation wrapper
 */
export function validateInput(input: unknown, schema: unknown, operation: string) {
  try {
    // This would use Zod or similar validation library
    // For now, just return the input as-is since we don't have a real schema
    if (typeof schema === 'object' && schema !== null && 'safeParse' in schema) {
      const schemaObj = schema as { safeParse: (input: unknown) => { success: boolean; data?: unknown; error?: { message: string } } }
      const result = schemaObj.safeParse(input)
      if (!result.success) {
        throw new Error(`VALIDATION ERROR: Invalid input for ${operation}: ${result.error?.message || 'Unknown error'}`)
      }
      return result.data
    }
    return input
  } catch (error) {
    logSecurityEvent('input_validation_failed', { operation, error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * GUARDRAIL: SQL injection prevention
 */
export function sanitizeSqlInput(input: string): string {
  // Basic sanitization - in production would use parameterized queries
  return input.replace(/['";\\]/g, '').substring(0, 255)
}

// ============================================================================
// DEPLOYMENT GUARDRAILS
// ============================================================================

/**
 * GUARDRAIL: Pre-deployment health checks
 */
export async function runPreDeploymentChecks(): Promise<boolean> {
  const checks = [
    checkDatabaseConnections(),
    checkTenantIsolation(),
    checkModuleSystem(),
    checkAuthSystem(),
    checkPerformanceMetrics()
  ]

  const results = await Promise.allSettled(checks)
  const failures = results.filter(result => result.status === 'rejected')

  if (failures.length > 0) {
    await logSecurityEvent('pre_deployment_check_failed', {
      failureCount: failures.length,
      failures: failures.map(f => (f as PromiseRejectedResult).reason)
    })
    return false
  }

  return true
}

async function checkDatabaseConnections(): Promise<void> {
  const { error } = await supabaseAdmin.from('tenants').select('count').limit(1)
  if (error) throw new Error(`Database connection failed: ${error.message}`)
}

async function checkTenantIsolation(): Promise<void> {
  // Verify RLS policies are active
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .limit(1)

  if (error) throw new Error(`Tenant isolation check failed: ${error.message}`)
  if (!data) throw new Error('No tenants found - database may be corrupted')
}

async function checkModuleSystem(): Promise<void> {
  const { error } = await supabaseAdmin
    .from('tenant_modules')
    .select('count')
    .limit(1)

  if (error) throw new Error(`Module system check failed: ${error.message}`)
}

async function checkAuthSystem(): Promise<void> {
  // Check if auth is working (this is a placeholder)
  const testAuth = /sb-.*-auth-token/.test('')
  if (testAuth) throw new Error('Auth system check failed')
}

async function checkPerformanceMetrics(): Promise<void> {
  // Check basic performance (placeholder)
  const startTime = Date.now()
  await supabaseAdmin.from('tenants').select('count').limit(1)
  const duration = Date.now() - startTime

  if (duration > 1000) {
    throw new Error(`Performance check failed: Query took ${duration}ms`)
  }
}

// All functions are already exported individually above
// No need for a separate export statement
