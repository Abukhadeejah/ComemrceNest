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

// Define the hierarchy structure type
type CategoryChildren = {
  [key: string]: string[]
}

type GenderHierarchy = {
  id: string | undefined
  name: string
  children: CategoryChildren
}

export function OrganizationSection({ formData, errors, categories, onInputChange }: OrganizationSectionProps) {
  // Manual hierarchy based on your screenshot since parent_id is NULL in database
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

  // State for 3-level selection
  const [selectedGender, setSelectedGender] = useState<'men' | 'women' | 'accessories' | ''>('')
  const [selectedParentName, setSelectedParentName] = useState<string>('')

  // Get parent categories based on selected gender
  const parentCategories = useMemo(() => {
    if (!selectedGender) return []
    const hierarchy = categoryHierarchy[selectedGender as 'men' | 'women' | 'accessories']
    return Object.keys(hierarchy.children).map(name => {
      const cat = categories.find(c => c.name === name)
      return { id: cat?.id || name, name }
    }).filter(p => p.id)
  }, [selectedGender, categoryHierarchy, categories])

  // Get subcategories based on selected parent
  const subCategories = useMemo(() => {
    if (!selectedGender || !selectedParentName) return []
    const hierarchy = categoryHierarchy[selectedGender as 'men' | 'women' | 'accessories']
    const subNames = hierarchy.children[selectedParentName] || []
    
    return subNames.map(name => {
      const cat = categories.find(c => c.name.trim() === name.trim())
      return cat
    }).filter((cat): cat is Category => cat !== undefined)
  }, [selectedGender, selectedParentName, categoryHierarchy, categories])

  // Get selected category IDs
  const selectedCategoryIds = Array.isArray(formData.category_ids) 
    ? formData.category_ids 
    : formData.category_id 
    ? [formData.category_id] 
    : []

  // Handle checkbox toggle
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

  // Handle gender change
  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender as 'men' | 'women' | 'accessories' | '')
    setSelectedParentName('')
    onInputChange('category_id', '')
    onInputChange('category_ids', [])
  }

  // Handle parent category change
  const handleParentChange = (parentName: string) => {
    setSelectedParentName(parentName)
    onInputChange('category_id', '')
    onInputChange('category_ids', [])
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Level 1: Main Category (Men/Women/Accessories) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedGender}
            onChange={(e) => handleGenderChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select Category</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="accessories">Fashion Accessories</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">Step 1: Choose main category</p>
        </div>

        {/* Level 2: Parent Category (Bottom Wear, Top Wear, etc.) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parent Category <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedParentName}
            onChange={(e) => handleParentChange(e.target.value)}
            disabled={!selectedGender}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {!selectedGender 
                ? 'Select category first'
                : parentCategories.length === 0 
                ? 'No parent categories available'
                : 'Select Parent Category'}
            </option>
            {parentCategories.map((parent) => (
              <option key={parent.id} value={parent.name}>
                {parent.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Step 2: {parentCategories.length > 0 ? `${parentCategories.length} options available` : 'Choose type'}
          </p>
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

      {/* Level 3: Subcategories with Checkboxes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub Categories <span className="text-red-500">*</span>
          {selectedCategoryIds.length > 0 && (
            <span className="text-xs font-normal text-indigo-600 ml-2">
              ({selectedCategoryIds.length} selected)
            </span>
          )}
        </label>
        
        {!selectedGender ? (
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            Please select a category first
          </div>
        ) : !selectedParentName ? (
          <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            Please select a parent category first
          </div>
        ) : subCategories.length === 0 ? (
          <div className="rounded-md border border-gray-300 bg-yellow-50 p-4 text-center text-sm text-yellow-800">
            ⚠️ No subcategories available for this parent category.
          </div>
        ) : (
          <div className="rounded-md border border-gray-300 bg-white max-h-[300px] overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {subCategories.map((subCat) => {
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
          {subCategories.length > 0 
            ? `Step 3: Select subcategories. You can select multiple.`
            : 'Step 3: Subcategories will appear after selecting parent category'}
        </p>
      </div>

      {/* Display Selected Path */}
      {selectedGender && selectedParentName && selectedCategoryIds.length > 0 && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800 mb-1">Selected Categories:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategoryIds.map((catId) => {
              const category = categories.find(c => c.id === catId)
              const categoryName = selectedGender === 'men' ? 'Men' : selectedGender === 'women' ? 'Women' : 'Fashion Accessories'
              return (
                <span key={catId} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  {categoryName} → {selectedParentName} → {category?.name}
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
