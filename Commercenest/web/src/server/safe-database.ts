/**
 * GUARDRAIL-ENHANCED DATABASE UTILITIES
 *
 * Safe database operations with built-in tenant isolation and validation
 */

import { supabaseAdmin } from '@/server/supabaseAdmin'
import { validateTenantContext, logSecurityEvent } from './guardrails'

// ============================================================================
// SAFE DATABASE QUERY BUILDER
// ============================================================================

export class SafeDatabaseQuery {
  private tableName: string
  private tenantId: string
  private query: {
    where?: Record<string, unknown>
    columns?: string
    limit?: number
    orderBy?: { column: string; ascending: boolean }
  } = {}
  private hasTenantFilter = false

  constructor(tableName: string, tenantId: string) {
    this.tableName = tableName
    this.tenantId = tenantId
  }

  /**
   * GUARDRAIL: Enforces tenant filtering on all queries
   */
  where(field: string, value: unknown): SafeDatabaseQuery {
    if (field === 'tenant_id') {
      if (value !== this.tenantId) {
        throw new Error(`TENANT ISOLATION VIOLATION: Attempted to query ${this.tableName} with tenant_id ${value}, but context requires ${this.tenantId}`)
      }
      this.hasTenantFilter = true
    }
    this.query.where = this.query.where || {}
    this.query.where[field] = value
    return this
  }

  /**
   * GUARDRAIL: Safe select with automatic tenant filtering
   */
  select(_columns: string = '*'): SafeSelectQuery {
    // Automatically add tenant_id filter if not explicitly provided
    if (!this.hasTenantFilter && this.tableName !== 'tenants') {
      this.query.where = this.query.where || {}
      this.query.where.tenant_id = this.tenantId
      this.hasTenantFilter = true
    }

    return new SafeSelectQuery(this.tableName, this.query, this.tenantId)
  }

  /**
   * GUARDRAIL: Safe insert with automatic tenant assignment
   */
  insert(data: Record<string, unknown>): SafeInsertQuery {
    // Automatically add tenant_id if not provided and table requires it
    if (!data.tenant_id && this.tableName !== 'tenants') {
      data.tenant_id = this.tenantId
    }

    // Validate tenant_id matches context
    if (data.tenant_id && data.tenant_id !== this.tenantId) {
      throw new Error(`TENANT ISOLATION VIOLATION: Attempted to insert into ${this.tableName} with tenant_id ${data.tenant_id}, but context requires ${this.tenantId}`)
    }

    return new SafeInsertQuery(this.tableName, data, this.tenantId)
  }

  /**
   * GUARDRAIL: Safe update with tenant validation
   */
  update(data: Record<string, unknown>): SafeUpdateQuery {
    if (!this.hasTenantFilter) {
      throw new Error(`TENANT ISOLATION VIOLATION: Update operations on ${this.tableName} require explicit tenant_id filter`)
    }

    return new SafeUpdateQuery(this.tableName, data, this.query, this.tenantId)
  }

  /**
   * GUARDRAIL: Safe delete with tenant validation
   */
  delete(): SafeDeleteQuery {
    if (!this.hasTenantFilter) {
      throw new Error(`TENANT ISOLATION VIOLATION: Delete operations on ${this.tableName} require explicit tenant_id filter`)
    }

    return new SafeDeleteQuery(this.tableName, this.query, this.tenantId)
  }
}

// ============================================================================
// SAFE QUERY CLASSES
// ============================================================================

export class SafeSelectQuery {
  constructor(
    private tableName: string,
    private query: {
      where?: Record<string, unknown>
      columns?: string
      limit?: number
      orderBy?: { column: string; ascending: boolean }
    },
    private tenantId: string
  ) {}

  async execute(): Promise<unknown> {
    try {
      let dbQuery = supabaseAdmin.from(this.tableName).select(this.query.columns || '*')

      // Apply where conditions
      if (this.query.where) {
        Object.entries(this.query.where).forEach(([field, value]) => {
          dbQuery = dbQuery.eq(field, value)
        })
      }

      // Apply other conditions
      if (this.query.limit) dbQuery = dbQuery.limit(this.query.limit)
      if (this.query.orderBy) dbQuery = dbQuery.order(this.query.orderBy.column, { ascending: this.query.orderBy.ascending })

      const { data, error } = await dbQuery

      if (error) {
        await logSecurityEvent('database_query_failed', {
          table: this.tableName,
          tenantId: this.tenantId,
          error: error.message,
          query: this.query
        })
        throw error
      }

      return data
    } catch (error) {
      await logSecurityEvent('database_operation_error', {
        operation: 'select',
        table: this.tableName,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  limit(count: number): SafeSelectQuery {
    this.query.limit = count
    return this
  }

  orderBy(column: string, ascending: boolean = true): SafeSelectQuery {
    this.query.orderBy = { column, ascending }
    return this
  }
}

export class SafeInsertQuery {
  constructor(
    private tableName: string,
    private data: Record<string, unknown>,
    private tenantId: string
  ) {}

  async execute(): Promise<unknown> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert(this.data)
        .select()

      if (error) {
        await logSecurityEvent('database_insert_failed', {
          table: this.tableName,
          tenantId: this.tenantId,
          error: error.message,
          data: this.data
        })
        throw error
      }

      await logSecurityEvent('database_insert_success', {
        table: this.tableName,
        tenantId: this.tenantId,
        recordCount: data?.length || 0
      })

      return data
    } catch (error) {
      await logSecurityEvent('database_operation_error', {
        operation: 'insert',
        table: this.tableName,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

export class SafeUpdateQuery {
  constructor(
    private tableName: string,
    private data: Record<string, unknown>,
    private conditions: Record<string, unknown>,
    private tenantId: string
  ) {}

  async execute(): Promise<unknown> {
    try {
      let dbQuery = supabaseAdmin.from(this.tableName).update(this.data)

      // Apply where conditions
      if (this.conditions.where) {
        Object.entries(this.conditions.where).forEach(([field, value]) => {
          dbQuery = dbQuery.eq(field, value)
        })
      }

      const { data, error } = await dbQuery.select()

      if (error) {
        await logSecurityEvent('database_update_failed', {
          table: this.tableName,
          tenantId: this.tenantId,
          error: error.message,
          conditions: this.conditions,
          data: this.data
        })
        throw error
      }

      await logSecurityEvent('database_update_success', {
        table: this.tableName,
        tenantId: this.tenantId,
        recordCount: data?.length || 0
      })

      return data
    } catch (error) {
      await logSecurityEvent('database_operation_error', {
        operation: 'update',
        table: this.tableName,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

export class SafeDeleteQuery {
  constructor(
    private tableName: string,
    private conditions: Record<string, unknown>,
    private tenantId: string
  ) {}

  async execute(): Promise<unknown> {
    try {
      let dbQuery = supabaseAdmin.from(this.tableName).delete()

      // Apply where conditions
      if (this.conditions.where) {
        Object.entries(this.conditions.where).forEach(([field, value]) => {
          dbQuery = dbQuery.eq(field, value)
        })
      }

      const { data, error } = await dbQuery.select()

      if (error) {
        await logSecurityEvent('database_delete_failed', {
          table: this.tableName,
          tenantId: this.tenantId,
          error: error.message,
          conditions: this.conditions
        })
        throw error
      }

      await logSecurityEvent('database_delete_success', {
        table: this.tableName,
        tenantId: this.tenantId,
        recordCount: data?.length || 0
      })

      return data
    } catch (error) {
      await logSecurityEvent('database_operation_error', {
        operation: 'delete',
        table: this.tableName,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}

// ============================================================================
// SAFE DATABASE FACTORY
// ============================================================================

/**
 * GUARDRAIL: Factory function for safe database operations
 */
export async function createSafeDatabase(operation: string): Promise<SafeDatabaseFactory> {
  const tenantId = await validateTenantContext(operation)

  return new SafeDatabaseFactory(tenantId)
}

export class SafeDatabaseFactory {
  constructor(private tenantId: string) {}

  /**
   * GUARDRAIL: Creates safe query builder for a table
   */
  table(tableName: string): SafeDatabaseQuery {
    return new SafeDatabaseQuery(tableName, this.tenantId)
  }

  /**
   * GUARDRAIL: Validates table access permissions
   */
  async validateTableAccess(tableName: string, operation: 'read' | 'write' | 'delete'): Promise<void> {
    // Check if user has permission for this table/operation
    const allowedTables = {
      read: ['products', 'categories', 'orders', 'customers', 'settings_company_profile'],
      write: ['products', 'categories', 'orders', 'settings_company_profile'],
      delete: ['products', 'categories'] // Restrict delete operations
    }

    if (!allowedTables[operation].includes(tableName)) {
      throw new Error(`ACCESS VIOLATION: ${operation} operation not allowed on table ${tableName}`)
    }

    await logSecurityEvent('table_access_validated', {
      table: tableName,
      operation,
      tenantId: this.tenantId
    })
  }

  /**
   * GUARDRAIL: Safe raw SQL execution (with restrictions)
   */
  async executeSafeSQL(sql: string, _params: unknown[] = []): Promise<unknown> {
    // Validate SQL doesn't contain dangerous operations
    const dangerousPatterns = [
      /drop/i,
      /delete/i,
      /truncate/i,
      /alter/i,
      /create/i,
      /\buser\b/i,
      /password/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        await logSecurityEvent('dangerous_sql_attempted', {
          sql: sql.substring(0, 100),
          tenantId: this.tenantId
        })
        throw new Error('SECURITY VIOLATION: Dangerous SQL operation blocked')
      }
    }

    // For now, block all raw SQL in safe mode
    throw new Error('SECURITY VIOLATION: Raw SQL execution blocked in safe mode')
  }
}

// ============================================================================
// GUARDRAIL-ENHANCED EXISTING FUNCTIONS
// ============================================================================

/**
 * GUARDRAIL: Safe version of existing database operations
 */
export const safeDatabaseOperations = {
  /**
   * Safe product creation with full validation
   */
  async createProduct(productData: Record<string, unknown>) {
    const db = await createSafeDatabase('createProduct')

    // Validate required fields
    if (!productData.name || !productData.price_cents) {
      throw new Error('VALIDATION ERROR: Product name and price are required')
    }

    // Validate price is reasonable
    const priceCents = typeof productData.price_cents === 'number' ? productData.price_cents : 0
    if (priceCents < 0 || priceCents > 10000000) { // Max 100k INR
      throw new Error('VALIDATION ERROR: Invalid product price')
    }

    const result = await db.table('products').insert(productData).execute()

    await logSecurityEvent('product_created_safely', {
      productId: Array.isArray(result) && result.length > 0 ? (result[0] as { id?: string })?.id : undefined
    })

    return result
  },

  /**
   * Safe product query with automatic filtering
   */
  async getProducts(filters: Record<string, unknown> = {}) {
    const db = await createSafeDatabase('getProducts')

    // Start with a tenant-scoped query builder
    let qb = db.table('products')

    // Apply filters safely
    if (filters.category_id) {
      qb = qb.where('category_id', filters.category_id)
    }

    if (filters.status) {
      qb = qb.where('status', filters.status)
    }

    // Now select and execute
    return await qb.select().limit(100).execute()
  },

  /**
   * Safe settings update
   */
  async updateCompanySettings(settingsData: Record<string, unknown>) {
    const db = await createSafeDatabase('updateCompanySettings')

    // Only allow specific fields to be updated
    const allowedFields = ['name', 'logo_url', 'address', 'phone', 'email', 'gstin', 'social', 'brand_accent_hex']
    const filteredData = Object.keys(settingsData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = settingsData[key]
        return obj
      }, {} as Record<string, unknown>)

    return await db.table('settings_company_profile').update(filteredData).execute()
  }
}

// Classes are exported above; avoid duplicate re-exports that confuse TS



