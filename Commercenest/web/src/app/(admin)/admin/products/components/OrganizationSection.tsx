"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ProductFormData } from '@/types/product'
import { buildCategoryTree, flattenCategoryTreeForSelect, getCategoryPath, type Category } from '@/utils/categoryUtils'

interface OrganizationSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  categories: Category[]
}

export function OrganizationSection({ formData, errors, categories, onInputChange }: OrganizationSectionProps) {
  // Build hierarchical category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  // Find Men/Women root categories (case-insensitive)
  const genderRoots = useMemo(() => {
    const roots = categoryTree.filter(c => !c.parent_id)
    const norm = (s: string) => s.trim().toLowerCase()
    return roots.filter(r => ['men','women'].includes(norm(r.name)))
  }, [categoryTree])

  const menRoot = genderRoots.find(r => r.name.trim().toLowerCase() === 'men')
  const womenRoot = genderRoots.find(r => r.name.trim().toLowerCase() === 'women')

  // Get current category path for display
  const selectedCategoryPath = formData.category_id 
    ? getCategoryPath(formData.category_id, categories) 
    : []

  function computeRootFromPath(): string | '' {
    if (selectedCategoryPath.length === 0) return ''
    const rootName = (selectedCategoryPath[0] || '').trim().toLowerCase()
    if (rootName === 'men' && menRoot) return menRoot.id
    if (rootName === 'women' && womenRoot) return womenRoot.id
    return ''
  }

  const [selectedRootId, setSelectedRootId] = useState<string>(() => computeRootFromPath() || (menRoot?.id || womenRoot?.id || ''))

  useEffect(() => {
    // Clear subcategory if not under selected root
    if (!formData.category_id || !selectedRootId) return
    const path = getCategoryPath(formData.category_id as string, categories)
    const rootName = (path[0] || '').trim().toLowerCase()
    const rootIdFromPath = rootName === 'men' ? menRoot?.id : rootName === 'women' ? womenRoot?.id : undefined
    if (rootIdFromPath && rootIdFromPath !== selectedRootId) {
      onInputChange('category_id', '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRootId])

  // Build subcategory options (exclude the root itself)
  const subcategoryOptions = useMemo(() => {
    const root = categoryTree.find(c => c.id === selectedRootId)
    if (root) {
      const flattened = flattenCategoryTreeForSelect([root])
      const children = flattened.filter(opt => opt.id !== root.id)
      if (children.length > 0) return children
    }
    // Fallback: if hierarchy is not linked in DB, show all categories excluding the root(s)
    const all = flattenCategoryTreeForSelect(categoryTree)
    const excludeIds = new Set([menRoot?.id, womenRoot?.id].filter(Boolean) as string[])
    return all.filter(opt => !excludeIds.has(opt.id))
  }, [categoryTree, selectedRootId, menRoot?.id, womenRoot?.id])

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Main Category</label>
          <select
            value={selectedRootId}
            onChange={(e) => { setSelectedRootId(e.target.value); onInputChange('category_id', '') }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select</option>
            {menRoot ? (<option value={menRoot.id}>Men</option>) : null}
            {womenRoot ? (<option value={womenRoot.id}>Women</option>) : null}
          </select>
          <p className="mt-1 text-xs text-gray-500">Only Men and Women are available as top-level categories.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategories (Multiple Selection)
            {selectedCategoryPath.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">({selectedCategoryPath.join(' → ')})</span>
            )}
          </label>
          <select
            multiple
            value={Array.isArray(formData.category_ids) ? formData.category_ids : formData.category_id ? [formData.category_id] : []}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              onInputChange('category_ids', selectedOptions);
              // Keep backward compatibility with single category_id
              onInputChange('category_id', selectedOptions[0] || '');
            }}
            disabled={!selectedRootId}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace', height: '150px' }}
          >
            <option value="">{selectedRootId ? 'Select a subcategory' : 'Select category first'}</option>
            {subcategoryOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Subcategories are filtered by the chosen category.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={String(formData.status || 'draft')}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter tags separated by commas (e.g., rain, waterproof, summer)"
            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
            onChange={(e) => {
              const tags = e.target.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
              onInputChange('tags', tags)
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Tags help customers find products through filters and collections. Use descriptive words like &quot;rain&quot;, &quot;summer&quot;, &quot;waterproof&quot;, etc.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Pro Tip:</strong> Tags can be used in Hero Carousel CTAs to create dynamic collections! 
                      <Link href="/senlysh/admin/tutorial" className="text-blue-600 hover:text-blue-800 underline ml-1">
                        Learn more
                      </Link>
                    </p>
                  </div>
                </div>
          {Array.isArray(formData.tags) && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = formData.tags?.filter((_, i) => i !== index) || []
                      onInputChange('tags', newTags)
                    }}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {errors.tags && (
          <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
        )}
      </div>
    </div>
  )
}
