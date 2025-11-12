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

<<<<<<< HEAD
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
=======
  // Helper: determine if a category is a descendant of a given root category id
  const isDescendantOf = (categoryId: string, rootId?: string) => {
    if (!rootId) return true
    const idToCategory = new Map(categories.map(c => [c.id, c]))
    let currentId: string | null = categoryId
    while (currentId) {
      const cat = idToCategory.get(currentId)
      if (!cat) break
      if (cat.id === rootId) return true
      currentId = cat.parent_id
    }
    return false
  }

  // Helper: whether category path contains a gender keyword (e.g., 'men', 'women')
  const pathContainsGender = (categoryId: string, genderKey: 'men' | 'women' | 'accessories') => {
    const genderWord = genderKey === 'men' ? 'men' : genderKey === 'women' ? 'women' : 'accessor'
    const path = getCategoryPath(categoryId, categories)
    return path.some(name => name.toLowerCase().includes(genderWord))
  }

  // Helper: find category by name for a gender, preferring under the gender root or path match, with safe fallback
  const findCategoryForGender = (name: string, genderKey: 'men' | 'women' | 'accessories', rootId?: string) => {
    const target = name.trim().toLowerCase()
    // 1) Prefer strict descendant of provided root
    let match = categories.find(c => c.name.trim().toLowerCase() === target && isDescendantOf(c.id, rootId))
    if (match) return match
    // 2) Next, prefer items whose breadcrumb path contains the gender keyword
    match = categories.find(c => c.name.trim().toLowerCase() === target && pathContainsGender(c.id, genderKey))
    if (match) return match
    // 3) Fallback: any exact name match to ensure UI still shows something
    return categories.find(c => c.name.trim().toLowerCase() === target)
  }

  // Handle gender checkbox toggle
  const handleGenderToggle = (gender: string) => {
    const newGenders = selectedGenders.includes(gender)
      ? selectedGenders.filter(g => g !== gender)
      : [...selectedGenders, gender]
    
    setSelectedGenders(newGenders)
    
    // If unchecking, collapse all parents and clear selections
    if (!newGenders.includes(gender)) {
      setExpandedParents(expandedParents.filter(p => !p.startsWith(gender)))
      
      // Clear subcategory selections for this gender (constrained under the gender root)
      const hierarchy = categoryHierarchy[gender as 'men' | 'women' | 'accessories']
      const subcatsToRemove: string[] = []
      Object.values(hierarchy.children).flat().forEach(subName => {
        const cat = findCategoryForGender(subName, gender as 'men' | 'women' | 'accessories', hierarchy.id)
        if (cat) subcatsToRemove.push(cat.id)
      })
      
      const updatedSelections = selectedCategoryIds.filter(id => !subcatsToRemove.includes(id))
      onInputChange('category_ids', updatedSelections)
      onInputChange('category_id', updatedSelections[0] || '')
    }
  }

  // Toggle parent category expansion
  const toggleParentExpansion = (gender: string, parentName: string) => {
    const key = `${gender}-${parentName}`
    setExpandedParents(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  // Check if parent has any selected subcategories
  const isParentSelected = (gender: string, parentName: string) => {
    const hierarchy = categoryHierarchy[gender as 'men' | 'women' | 'accessories']
    const subNames = hierarchy.children[parentName] || []
    
    return subNames.some(subName => {
      const cat = findCategoryForGender(subName, gender as 'men' | 'women' | 'accessories', hierarchy.id)
      return cat && selectedCategoryIds.includes(cat.id)
    })
>>>>>>> d1f8492ef1b167ef7cffe65f2e534737986fb02d
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

<<<<<<< HEAD
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
=======
                    {/* Level 2 & 3: Parent Categories and Subcategories (NESTED) */}
                    {isGenderChecked && (
                      <div className="bg-gray-50">
                        {Object.entries(hierarchy.children).map(([parentName, subNames]) => {
                          const expandKey = `${gender}-${parentName}`
                          const isExpanded = expandedParents.includes(expandKey)
                          const hasSelected = isParentSelected(gender, parentName)
                          
                          return (
                            <div key={parentName} className="border-t border-gray-200">
                              {/* Level 2: Parent Category with Expand/Collapse */}
                              <button
                                type="button"
                                onClick={() => toggleParentExpansion(gender, parentName)}
                                className={`w-full flex items-center px-4 py-2.5 pl-10 hover:bg-gray-100 transition-colors text-left ${
                                  hasSelected ? 'bg-indigo-50' : ''
                                }`}
                              >
                                {/* Expand/Collapse Arrow */}
                                <svg 
                                  className={`w-4 h-4 mr-2 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                
                                <span className={`text-sm font-medium ${hasSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                  {parentName}
                                </span>
                                
                                {hasSelected && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {subNames.filter(subName => {
                                      const cat = findCategoryForGender(subName, gender as 'men' | 'women' | 'accessories', hierarchy.id)
                                      return cat && selectedCategoryIds.includes(cat.id)
                                    }).length}
                                  </span>
                                )}
                              </button>

                              {/* Level 3: Subcategories (INDENTED) */}
                              {isExpanded && (
                                <div className="bg-white">
                                  {subNames.map((subName) => {
                                    const subCat = findCategoryForGender(subName, gender as 'men' | 'women' | 'accessories', hierarchy.id)
                                    if (!subCat) return null
                                    
                                    const isChecked = selectedCategoryIds.includes(subCat.id)
                                    
                                    return (
                                      <label
                                        key={subCat.id}
                                        className={`flex items-center px-4 py-2 pl-20 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100 ${
                                          isChecked ? 'bg-indigo-50' : ''
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleCategoryToggle(subCat.id)}
                                          className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span className={`ml-3 text-xs ${isChecked ? 'font-medium text-indigo-900' : 'text-gray-600'}`}>
                                          {subCat.name}
                                        </span>
                                        {isChecked && (
                                          <svg className="ml-auto h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            💡 Select root category → Click parent to expand → Check subcategories
          </p>
          {errors.category_id && (
            <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
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
>>>>>>> d1f8492ef1b167ef7cffe65f2e534737986fb02d
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
