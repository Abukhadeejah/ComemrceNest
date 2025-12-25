'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export interface AttributeFilterValue {
  id: string
  value: string
}

export interface AttributeFilterDefinition {
  id: string
  name: string
  values: AttributeFilterValue[]
}

interface AttributeFiltersSidebarProps {
  attributes: AttributeFilterDefinition[]
  selected: Record<string, string[]> // attributeId -> valueIds[]
  onChange: (next: Record<string, string[]>) => void
}

export function AttributeFiltersSidebar({
  attributes,
  selected,
  onChange,
}: AttributeFiltersSidebarProps) {
  // Track expanded attribute groups; initialize as expanded for incoming attributes
  const [expandedAttributes, setExpandedAttributes] = useState<Record<string, boolean>>({})

  // Sync expanded state whenever attributes prop changes (ensures proper expansion when server data arrives)
  useEffect(() => {
    const initial: Record<string, boolean> = {}
    if (!Array.isArray(attributes)) {
      // Ensure we don't attempt to iterate non-array values
      setExpandedAttributes(initial)
      return
    }

    for (const attr of attributes) {
      try {
        if (attr && typeof attr.id !== 'undefined') {
          initial[String(attr.id)] = true
        }
      } catch {}
    }

    setExpandedAttributes(initial)
  }, [attributes])

  const toggleExpandAttribute = useCallback((attributeId: string) => {
    setExpandedAttributes((prev) => ({
      ...prev,
      [attributeId]: !prev[attributeId],
    }))
  }, [])

  const handleValueChange = useCallback((attributeId: string, valueId: string, checked: boolean) => {
    const currentValues = selected[attributeId] || []
    const newValues = checked
      ? [...currentValues, valueId]
      : currentValues.filter((v) => v !== valueId)

    const newSelected = { ...selected }
    if (newValues.length === 0) {
      delete newSelected[attributeId]
    } else {
      newSelected[attributeId] = newValues
    }

    onChange(newSelected)
  }, [selected, onChange])
  // Debug: ensure attributes prop is arriving
  if (process.env.NODE_ENV !== 'production') {
    try {
      // eslint-disable-next-line no-console
      console.log('[AttributeFiltersSidebar] attributes.length=', Array.isArray(attributes) ? attributes.length : String(attributes))
    } catch {}
  }

  if (!attributes || attributes.length === 0) {
    return (
      <div className="w-64 shrink-0 bg-white rounded-lg shadow-sm p-6 h-fit sticky top-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Filters</h2>
        <p className="text-sm text-gray-500">No filters available</p>
      </div>
    )
  }

  return (
    <div className="w-64 shrink-0 bg-white rounded-lg shadow-sm p-6 h-fit sticky top-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Filters</h2>

      <div className="space-y-6">
        {attributes.map((attribute) => (
          <div key={attribute.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
            {/* Attribute Header */}
            <button
              onClick={() => toggleExpandAttribute(attribute.id)}
              className="flex items-center justify-between w-full mb-4 hover:text-indigo-600 transition-colors"
            >
              <h3 className="font-medium text-gray-900 text-sm">{attribute.name}</h3>
              <span className={`transform transition-transform ${expandedAttributes[attribute.id] ? 'rotate-180' : 'rotate-0'}`}>
                {expandedAttributes[attribute.id] ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                )}
              </span>
            </button>

            {/* Attribute Values */}
            {expandedAttributes[attribute.id] && (
              <div className="space-y-3">
                {attribute.values.map((value) => {
                  const isChecked = (selected[attribute.id] || []).includes(value.id)
                  return (
                    <label
                      key={value.id}
                      className="flex items-center cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleValueChange(attribute.id, value.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 cursor-pointer"
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                        {value.value}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
