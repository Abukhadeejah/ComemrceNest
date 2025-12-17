'use client'

import { useState } from 'react'
import { CategoryTree as CategoryTreeType } from '@/lib/categories'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CategoryTreeProps {
  categories: CategoryTreeType[]
  selectedSlugs: string[]
  onToggle: (slug: string, checked: boolean) => void
  level?: number
}

export function CategoryTree({ 
  categories, 
  selectedSlugs, 
  onToggle, 
  level = 0 
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedIds(newExpanded)
  }

  const isSelected = (slug: string) => selectedSlugs.includes(slug)
  const hasChildren = (category: CategoryTreeType) => 
    category.children && category.children.length > 0

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const expanded = expandedIds.has(category.id)
        const selected = isSelected(category.slug)
        const children = hasChildren(category)

        return (
          <div key={category.id} className="space-y-1">
            {/* Category Item */}
            <div 
              className={`flex items-center py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors ${
                level > 0 ? 'ml-4' : ''
              }`}
            >
              {/* Expand/Collapse Button */}
              {children ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(category.id)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {expanded ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 mr-2" /> // Spacer for alignment
              )}

              {/* Checkbox and Label */}
              <label className="flex items-center flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onToggle(category.slug, e.target.checked)}
                  className="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <div className="flex items-center justify-between flex-1">
                  <span className={`text-sm ${
                    selected 
                      ? 'font-medium text-indigo-600' 
                      : level === 0 
                        ? 'font-medium text-gray-900'
                        : 'text-gray-700'
                  }`}>
                    {category.name}
                  </span>
                  {category.count !== undefined && category.count > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {category.count}
                    </span>
                  )}
                </div>
              </label>
            </div>

            {/* Children */}
            {children && expanded && (
              <div className="ml-2">
                <CategoryTree
                  categories={category.children!}
                  selectedSlugs={selectedSlugs}
                  onToggle={onToggle}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}