"use client"

import { useMemo, useState } from "react"
import { ProductFormData } from "@/types/product"
import { type Category } from "@/utils/categoryUtils"

interface OrganizationSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (
    field: keyof ProductFormData,
    value: string | number | boolean | null | unknown[]
  ) => void
  categories: Category[]
}

export function OrganizationSection({ formData, errors, categories, onInputChange }: OrganizationSectionProps) {
  const categoryTree = useMemo(() => {
    const tree: Record<string | null, Category[]> = {}
    categories.forEach(cat => {
      const pid = cat.parent_id || null
      if (!tree[pid]) tree[pid] = []
      tree[pid].push(cat)
    })
    return tree
  }, [categories])

  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const selectedCategoryIds = Array.isArray(formData.category_ids)
    ? formData.category_ids
    : formData.category_id
    ? [formData.category_id]
    : []

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleCategoryToggle = (id: string) => {
    let next = [...selectedCategoryIds]
    if (next.includes(id)) {
      next = next.filter(cid => cid !== id)
    } else {
      next.push(id)
    }
    onInputChange("category_ids", next)
    onInputChange("category_id", next[0] || "")
  }

  const renderTree = (parentId: string | null, level = 0) => {
    const children = categoryTree[parentId] || []
    if (!children.length) return null

    return (
      <div>
        {children.map(cat => {
          const isChecked = selectedCategoryIds.includes(cat.id)
          const hasChildren = !!categoryTree[cat.id]?.length
          const isExpanded = expandedIds.includes(cat.id)

          return (
            <div key={cat.id} style={{ marginLeft: level * 20, borderLeft: level ? '1px solid #ccc' : 'none', paddingLeft: 8 }}>
              <div className="flex items-center py-1 cursor-pointer select-none">
                {hasChildren && (
                  <button
                    type="button"
                    aria-label="Expand"
                    onClick={() => toggleExpand(cat.id)}
                    className="mr-2 text-gray-500 hover:text-gray-800"
                  >
                    <span style={{ display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "" }}>
                      ▶
                    </span>
                  </button>
                )}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCategoryToggle(cat.id)}
                  className="mr-2 h-4 w-4"
                />
                <span>{cat.name}</span>
              </div>
              {hasChildren && isExpanded && renderTree(cat.id, level + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>

      <div className="rounded-md border border-gray-300 bg-white max-h-[500px] overflow-y-auto p-2 mb-6">
        {renderTree(null)}
      </div>

      {errors.category_id && (
        <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
      )}

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={String(formData.status || "draft")}
          onChange={e => onInputChange("status", e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status}</p>
        )}
      </div>

      {/* Display Selected Categories */}
      {selectedCategoryIds.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md mt-4">
          <p className="text-sm font-semibold text-green-900 mb-2">
            ✓ Selected Subcategories ({selectedCategoryIds.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategoryIds.map(catId => {
              const category = categories.find(c => c.id === catId)
              return (
                <span
                  key={catId}
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 border border-green-300"
                >
                  {category?.name}
                  <button
                    type="button"
                    onClick={() => handleCategoryToggle(catId)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
