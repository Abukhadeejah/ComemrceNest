'use client'

import { useMemo, useState, useCallback, JSX } from 'react'
import { ProductFormData } from '@/types/product'
import { UseFormSetValue, FieldErrors } from 'react-hook-form'

interface Category {
  id: string
  name: string
  parent_id: string | null
}

interface OrganizationSectionProps {
  formData: ProductFormData
  errors?: FieldErrors<ProductFormData>
  categories: Category[]
  setValue: UseFormSetValue<ProductFormData>
}

export function OrganizationSection({
  formData,
  categories,
  setValue,
}: OrganizationSectionProps) {
  // Build category tree
  const categoryTree = useMemo(() => {
    const tree: Record<string, Category[]> = {}
    categories.forEach(cat => {
      const pid = cat.parent_id || 'root'
      if (!tree[pid]) tree[pid] = []
      tree[pid].push(cat)
    })
    return tree
  }, [categories])

  // Track expanded categories
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  // Get selected category IDs
  const selectedCategoryIds = useMemo(() => {
    if (Array.isArray(formData.category_ids)) {
      return formData.category_ids
    }
    if (formData.category_id) {
      return [formData.category_id]
    }
    return []
  }, [formData.category_ids, formData.category_id])

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Toggle category selection
  const toggleCategory = useCallback(
    (categoryId: string) => {
      const currentIds = selectedCategoryIds
      const newIds = currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId]

      // Update category_ids array using setValue
      setValue('category_ids', newIds, { shouldDirty: true, shouldValidate: true })

      // Update single category_id (first selected)
      if (newIds.length > 0) {
        setValue('category_id', newIds[0] ?? null, { shouldDirty: true, shouldValidate: true })
      } else {
        setValue('category_id', null, { shouldDirty: true, shouldValidate: true })
      }
    },
    [selectedCategoryIds, setValue]
  )

  // Recursive tree renderer
  const renderTree = (parentId: string | null, level: number = 0): JSX.Element[] => {
    const key = parentId || 'root'
    const children = categoryTree[key] || []
    
    return children.map(cat => {
      const hasChildren = categoryTree[cat.id]?.length > 0
      const isExpanded = expandedIds.includes(cat.id)
      const isSelected = selectedCategoryIds.includes(cat.id)

      return (
        <div key={cat.id} style={{ marginLeft: `${level * 20}px` }}>
          <div className="flex items-center py-2 hover:bg-gray-50 rounded">
            {/* Expand/collapse button */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(cat.id)}
                className="mr-2 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="mr-2 w-5 h-5" /> // Spacer for alignment
            )}
            
            {/* Checkbox and label */}
            <label className="flex items-center flex-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCategory(cat.id)}
                className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={isSelected ? 'font-medium text-indigo-600' : 'text-gray-700'}>
                {cat.name}
              </span>
            </label>
          </div>
          
          {/* Render children if expanded */}
          {hasChildren && isExpanded && renderTree(cat.id, level + 1)}
        </div>
      )
    })
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto bg-white">
            {categories.length > 0 ? (
              renderTree(null)
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No categories available. Create categories first.
              </p>
            )}
          </div>
          
          {/* Selected Categories Display */}
          {selectedCategoryIds.length > 0 && (
            <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-indigo-900">Selected Categories</h4>
                <button
                  type="button"
                  onClick={() => {
                    setValue('category_ids', [], { shouldDirty: true, shouldValidate: true })
                    setValue('category_id', null, { shouldDirty: true, shouldValidate: true })
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCategoryIds.map(categoryId => {
                  const category = categories.find(c => c.id === categoryId)
                  return category ? (
                    <span
                      key={categoryId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {category.name}
                      <button
                        type="button"
                        onClick={() => toggleCategory(categoryId)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ) : null
                })}
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                Primary category: <strong>{categories.find(c => c.id === selectedCategoryIds[0])?.name || 'None'}</strong>
              </p>
            </div>
          )}
          
          {/* Help text */}
          <p className="mt-2 text-sm text-gray-500">
            Select one or more categories for this product. The first selected category will be the primary category.
          </p>
        </div>
      </div>
    </div>
  )
}
