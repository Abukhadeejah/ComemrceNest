"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ProductFormData } from '@/types/product'
import { getCategoryPath, type Category } from '@/utils/categoryUtils'

interface OrganizationSectionProps {
  formData: ProductFormData
  errors: Record<string, string>
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
  categories: Category[]
}

type CategoryChildren = {
  [key: string]: string[]
}

type GenderHierarchy = {
  id: string | undefined
  name: string
  children: CategoryChildren
}

export function OrganizationSection({ formData, errors, categories, onInputChange }: OrganizationSectionProps) {
  const categoryHierarchy = useMemo(() => {
    const menId = categories.find(c => c.name.trim().toLowerCase() === 'men')?.id
    const womenId = categories.find(c => c.name.trim().toLowerCase() === 'women')?.id
    const accessoriesId = categories.find(c => c.name.trim().toLowerCase() === 'fashion accessories')?.id
    
    const hierarchy: { men: GenderHierarchy; women: GenderHierarchy; accessories: GenderHierarchy } = {
      men: {
        id: menId,
        name: 'Men',
        children: {
          'Bottom Wear': ['Boxers', 'Briefs', 'Cargos', 'Formal Trousers', 'Jeans', 'Shorts', 'Track Pants'],
          'Top Wear': ['Hoodies', 'Kurta', 'Sando (Tanktops)', 'Shirts', 'T-Shirts']
        }
      },
      women: {
        id: womenId,
        name: 'Women',
        children: {
          'Women\'s Wear': ['Cargos', 'Cord Sets', 'Dresses', 'Jeans', 'Shrugs & Jackets', 'Tops', 'Track Pants', 'Trousers']
        }
      },
      accessories: {
        id: accessoriesId,
        name: 'Fashion Accessories',
        children: {
          'Accessories': ['Belts', 'Caps', 'Deodorants', 'Handkerchiefs', 'Perfumes', 'Socks']
        }
      }
    }
    
    return hierarchy
  }, [categories])

  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedParents, setSelectedParents] = useState<string[]>([])

  // Get parent categories based on selected genders
  const availableParents = useMemo(() => {
    if (selectedGenders.length === 0) return []
    
    const parents: { name: string; gender: string }[] = []
    selectedGenders.forEach(gender => {
      const hierarchy = categoryHierarchy[gender as 'men' | 'women' | 'accessories']
      Object.keys(hierarchy.children).forEach(parentName => {
        parents.push({ name: parentName, gender })
      })
    })
    return parents
  }, [selectedGenders, categoryHierarchy])

  // Get subcategories based on selected parents
  const availableSubCategories = useMemo(() => {
    if (selectedParents.length === 0) return []
    
    const subs: Category[] = []
    selectedParents.forEach(parentName => {
      selectedGenders.forEach(gender => {
        const hierarchy = categoryHierarchy[gender as 'men' | 'women' | 'accessories']
        const subNames = hierarchy.children[parentName] || []
        
        subNames.forEach(name => {
          const cat = categories.find(c => c.name.trim() === name.trim())
          if (cat && !subs.find(s => s.id === cat.id)) {
            subs.push(cat)
          }
        })
      })
    })
    return subs
  }, [selectedGenders, selectedParents, categoryHierarchy, categories])

  const selectedCategoryIds = Array.isArray(formData.category_ids) 
    ? formData.category_ids 
    : formData.category_id 
    ? [formData.category_id] 
    : []

  // Handle gender checkbox toggle
  const handleGenderToggle = (gender: string) => {
    const newGenders = selectedGenders.includes(gender)
      ? selectedGenders.filter(g => g !== gender)
      : [...selectedGenders, gender]
    
    setSelectedGenders(newGenders)
    
    // Clear parent and subcategory selections
    setSelectedParents([])
    onInputChange('category_id', '')
    onInputChange('category_ids', [])
  }

  // Handle parent checkbox toggle
  const handleParentToggle = (parentName: string) => {
    const newParents = selectedParents.includes(parentName)
      ? selectedParents.filter(p => p !== parentName)
      : [...selectedParents, parentName]
    
    setSelectedParents(newParents)
    
    // Clear subcategory selections
    onInputChange('category_id', '')
    onInputChange('category_ids', [])
  }

  // Handle subcategory checkbox toggle
  const handleCategoryToggle = (categoryId: string) => {
    const currentSelections = [...selectedCategoryIds]
    const index = currentSelections.indexOf(categoryId)
    
    if (index > -1) {
      currentSelections.splice(index, 1)
    } else {
      currentSelections.push(categoryId)
    }
    
    onInputChange('category_ids', currentSelections)
    onInputChange('category_id', currentSelections[0] || '')
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Level 1: Main Category with CHECKBOXES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
            {selectedGenders.length > 0 && (
              <span className="text-xs font-normal text-indigo-600 ml-2">
                ({selectedGenders.length} selected)
              </span>
            )}
          </label>
          <div className="rounded-md border border-gray-300 bg-white">
            <div className="divide-y divide-gray-200">
              {['men', 'women', 'accessories'].map((gender) => {
                const isChecked = selectedGenders.includes(gender)
                const displayName = gender === 'men' ? 'Men' : gender === 'women' ? 'Women' : 'Fashion Accessories'
                return (
                  <label
                    key={gender}
                    className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isChecked ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleGenderToggle(gender)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`ml-3 text-sm ${isChecked ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                      {displayName}
                    </span>
                    {isChecked && (
                      <svg className="ml-auto h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">Step 1: Select category/categories</p>
        </div>

        {/* Status */}
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

      {/* Level 2: Parent Category with CHECKBOXES */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parent Category <span className="text-red-500">*</span>
          {selectedParents.length > 0 && (
            <span className="text-xs font-normal text-indigo-600 ml-2">
              ({selectedParents.length} selected)
            </span>
          )}
        </label>
        
        {selectedGenders.length === 0 ? (
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            Please select a category first
          </div>
        ) : availableParents.length === 0 ? (
          <div className="rounded-md border border-gray-300 bg-yellow-50 p-4 text-center text-sm text-yellow-800">
            ⚠️ No parent categories available
          </div>
        ) : (
          <div className="rounded-md border border-gray-300 bg-white max-h-[200px] overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {availableParents.map((parent) => {
                const isChecked = selectedParents.includes(parent.name)
                return (
                  <label
                    key={`${parent.gender}-${parent.name}`}
                    className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isChecked ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleParentToggle(parent.name)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`ml-3 text-sm ${isChecked ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                      {parent.name}
                    </span>
                    {isChecked && (
                      <svg className="ml-auto h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Step 2: {availableParents.length > 0 ? `${availableParents.length} options available` : 'Select parent categories'}
        </p>
      </div>

      {/* Level 3: Subcategories with Checkboxes (EXISTING) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub Categories <span className="text-red-500">*</span>
          {selectedCategoryIds.length > 0 && (
            <span className="text-xs font-normal text-indigo-600 ml-2">
              ({selectedCategoryIds.length} selected)
            </span>
          )}
        </label>
        
        {selectedGenders.length === 0 ? (
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            Please select a category first
          </div>
        ) : selectedParents.length === 0 ? (
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            Please select a parent category first
          </div>
        ) : availableSubCategories.length === 0 ? (
          <div className="rounded-md border border-gray-300 bg-yellow-50 p-4 text-center text-sm text-yellow-800">
            ⚠️ No subcategories available
          </div>
        ) : (
          <div className="rounded-md border border-gray-300 bg-white max-h-[300px] overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {availableSubCategories.map((subCat) => {
                const isChecked = selectedCategoryIds.includes(subCat.id)
                return (
                  <label
                    key={subCat.id}
                    className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isChecked ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(subCat.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`ml-3 text-sm ${isChecked ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                      {subCat.name}
                    </span>
                    {isChecked && (
                      <svg className="ml-auto h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        )}
        
        {errors.category_id && (
          <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Step 3: Select subcategories. You can select multiple.
        </p>
      </div>

      {/* Display Selected Path */}
      {selectedGenders.length > 0 && selectedCategoryIds.length > 0 && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800 mb-1">Selected Categories:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategoryIds.map((catId) => {
              const category = categories.find(c => c.id === catId)
              return (
                <span key={catId} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  {category?.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

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
              Tags help customers find products through filters and collections.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <p className="text-xs text-blue-800">
                <strong>💡 Pro Tip:</strong> Tags can be used in Hero Carousel CTAs! 
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
