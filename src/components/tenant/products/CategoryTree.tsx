'use client'

import { useState } from 'react'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import type { CategoryTree as CategoryTreeType } from '@/lib/categories'

interface CategoryTreeProps {
  categories: CategoryTreeType[]
  selectedSlugs: string[]
  onToggle: (slug: string, checked: boolean) => void
  level?: number
}

export function CategoryTree({ categories, selectedSlugs, onToggle, level = 0 }: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCheckboxChange = (slug: string, checked: boolean) => {
    onToggle(slug, checked)
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const hasChildren = category.children && category.children.length > 0
        const isExpanded = expandedCategories.has(category.id)
        const isSelected = selectedSlugs.includes(category.slug)
        const indentClass = level > 0 ? `ml-${level * 4}` : ''

        return (
          <div key={category.id} className="space-y-1">
            {/* Category Item */}
            <div className={`flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-gray-50 transition-colors ${indentClass}`}>
              {/* Expand/Collapse Button */}
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <div className="w-5 h-5 flex-shrink-0" /> // Spacer for alignment
              )}

              {/* Checkbox */}
              <input
                type="checkbox"
                id={`category-${category.id}`}
                checked={isSelected}
                onChange={(e) => handleCheckboxChange(category.slug, e.target.checked)}
                className="flex-shrink-0 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />

              {/* Category Label */}
              <label
                htmlFor={`category-${category.id}`}
                className="flex-1 flex items-center justify-between text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
              >
                <span className={isSelected ? 'font-medium text-indigo-700' : ''}>{category.name}</span>
                {category.count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                )}
              </label>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
              <CategoryTree
                categories={category.children!}
                selectedSlugs={selectedSlugs}
                onToggle={onToggle}
                level={level + 1}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}