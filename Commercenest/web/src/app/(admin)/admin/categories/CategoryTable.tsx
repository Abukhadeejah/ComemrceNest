'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  created_at: string
}

interface CategoryTableProps {
  categories: Category[]
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [parentFilterId, setParentFilterId] = useState<string>('all')
  const router = useRouter()
  const tenantKey = useAdminTenantKey()

  // Build hierarchy structures
  const idToCategory = new Map(categories.map(cat => [cat.id, cat]))
  const parentToChildren = new Map<string | null, Category[]>()
  for (const cat of categories) {
    const parentKey = (cat.parent_id ?? null) as string | null
    if (!parentToChildren.has(parentKey)) parentToChildren.set(parentKey, [])
    parentToChildren.get(parentKey)!.push(cat)
  }
  const sortByName = (a: Category, b: Category) => a.name.localeCompare(b.name)
  for (const children of parentToChildren.values()) {
    children.sort(sortByName)
  }

  const flattenHierarchy = () => {
    const rows: Array<{ category: Category; depth: number }> = []
    const roots = parentToChildren.get(null) || []
    const dfs = (node: Category, depth: number) => {
      rows.push({ category: node, depth })
      const kids = parentToChildren.get(node.id) || []
      for (const child of kids) dfs(child, depth + 1)
    }
    for (const root of roots) dfs(root, 0)
    // Include any orphaned nodes whose parent is missing (defensive)
    const seen = new Set(rows.map(r => r.category.id))
    for (const cat of categories) {
      if (!seen.has(cat.id)) rows.push({ category: cat, depth: 0 })
    }
    return rows
  }

  const allRows = flattenHierarchy()

  // Parent filter options: only categories that have at least one child
  const parentCandidates = Array.from(parentToChildren.entries())
    .filter(([key, children]) => key !== null && children.length > 0)
    .map(([key]) => idToCategory.get(key as string)!)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  // When filtering, include the selected parent and its entire subtree
  const subtreeIds = new Set<string>()
  if (parentFilterId !== 'all') {
    const collect = (id: string) => {
      subtreeIds.add(id)
      const children = parentToChildren.get(id) || []
      for (const child of children) collect(child.id)
    }
    collect(parentFilterId)
  }

  const visibleRows = parentFilterId === 'all'
    ? allRows
    : allRows.filter(r => subtreeIds.has(r.category.id))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(visibleRows.map(r => r.category.id))
    } else {
      setSelectedCategories([])
    }
  }

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, categoryId])
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <input
            id="select-all"
            name="select-all"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={visibleRows.length > 0 && selectedCategories.length === visibleRows.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <label htmlFor="select-all" className="ml-2 text-sm text-gray-900">
            {selectedCategories.length} of {visibleRows.length} selected
          </label>

          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="parent-filter" className="text-sm text-gray-700">Parent:</label>
            <select
              id="parent-filter"
              className="block pl-3 pr-8 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={parentFilterId}
              onChange={(e) => setParentFilterId(e.target.value)}
            >
              <option value="all">All</option>
              {parentCandidates.map(parent => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Parent
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {visibleRows.map(({ category, depth }) => (
            <tr key={category.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    id={`category-${category.id}`}
                    name={`category-${category.id}`}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => handleSelectCategory(category.id, e.target.checked)}
                  />
                  <div className="text-sm font-medium text-gray-900" style={{ marginLeft: depth * 16 }}>
                    {category.name}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {category.slug}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {category.parent_id ? idToCategory.get(category.parent_id)?.name || '—' : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(category.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Link
                    href={ADMIN_URLS.categoryDetail(category.id, tenantKey)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                  <Link
                    href={ADMIN_URLS.categoryEdit(category.id, tenantKey)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </Link>
                  <button
                    className="text-red-600 hover:text-red-900"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this category?')) return
                      const res = await fetch(`/api/admin/categories?id=${category.id}`, { method: 'DELETE' })
                      if (!res.ok) {
                        alert('Failed to delete category')
                        return
                      }
                      router.refresh()
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



































