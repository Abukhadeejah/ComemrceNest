'use client'

import { AttributeFiltersSidebar } from './AttributeFiltersSidebar'
import type { AvailableAttributeFilter } from '@/server/attributes'

interface AttributeFiltersSidebarWrapperProps {
  attributes: AvailableAttributeFilter[]
  selected: Record<string, string[]>
}

/**
 * Client-side wrapper for the attribute sidebar that handles URL updates.
 * This must be a Client Component to handle onChange events.
 */
export function AttributeFiltersSidebarWrapper({
  attributes,
  selected,
}: AttributeFiltersSidebarWrapperProps) {
  // Temporary client-side debug: confirm attributes length arrives at client
  // (remove or minimise logs after verification)
  try {
    // eslint-disable-next-line no-console
    console.log('[AttributeFiltersSidebarWrapper] attributes.length=', Array.isArray(attributes) ? attributes.length : String(attributes))
  } catch {}
  return (
    <AttributeFiltersSidebar
      attributes={attributes}
      selected={selected}
      onChange={(newFilters) => {
        // Update URL with new filters
        const params = new URLSearchParams()
        const encodedFilters = encodeAttributeFiltersForUrl(newFilters)
        if (encodedFilters) {
          params.set('attr_value_ids', encodedFilters)
        }
        
        // Preserve other search params
        const currentParams = new URLSearchParams(window.location.search)
        currentParams.forEach((value, key) => {
          if (key !== 'attr_value_ids' && key !== 'page') {
            params.set(key, value)
          }
        })
        
        // Reset page to 1 when filters change
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        window.location.href = newUrl
      }}
    />
  )
}

/**
 * Encode attribute filters for URL: "attrId1:valId1,valId2|attrId2:valId3"
 */
function encodeAttributeFiltersForUrl(filters: Record<string, string[]>): string {
  return Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([attrId, valueIds]) => `${attrId}:${valueIds.join(',')}`)
    .join('|')
}
