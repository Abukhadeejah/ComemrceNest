'use client'

import { useState } from 'react'
import { 
  Square3Stack3DIcon, 
  PlusIcon, 
  XMarkIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { ProductFormData } from '@/types/product'

interface SizeGuideSectionProps {
  formData: ProductFormData
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export default function SizeGuideSection({ formData, onInputChange }: SizeGuideSectionProps) {
  const [showSizeGuideModal, setShowSizeGuideModal] = useState(false)
  const [newSizeGuide, setNewSizeGuide] = useState({
    name: '',
    category: 'clothing',
    gender: 'unisex',
    measurements: {}
  })

  const sizeCategories = [
    { value: 'clothing', label: 'Clothing' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' }
  ]

  const genderOptions = [
    { value: 'men', label: 'Men' },
    { value: 'women', label: 'Women' },
    { value: 'unisex', label: 'Unisex' }
  ]

  const commonSizes = {
    clothing: {
      men: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      women: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      unisex: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    shoes: {
      men: ['7', '8', '9', '10', '11', '12'],
      women: ['5', '6', '7', '8', '9', '10'],
      unisex: ['7', '8', '9', '10', '11', '12']
    },
    accessories: {
      men: ['S', 'M', 'L'],
      women: ['S', 'M', 'L'],
      unisex: ['S', 'M', 'L']
    }
  }

  const measurementFields = {
    clothing: ['chest', 'waist', 'hips', 'length', 'shoulder', 'sleeve'],
    shoes: ['length', 'width'],
    accessories: ['length', 'width', 'height']
  }

  const addSizeGuide = () => {
    if (!newSizeGuide.name.trim()) return

    const guide = {
      id: Date.now().toString(),
      ...newSizeGuide,
      measurements: generateMeasurementTable(newSizeGuide.category, newSizeGuide.gender)
    }

    const currentGuides = Array.isArray(formData.sizeGuides) ? formData.sizeGuides : []
    onInputChange('sizeGuides', [...currentGuides, guide])
    setNewSizeGuide({ name: '', category: 'clothing', gender: 'unisex', measurements: {} })
    setShowSizeGuideModal(false)
  }

    const removeSizeGuide = (guideId: string) => {
    const currentGuides = Array.isArray(formData.sizeGuides) ? formData.sizeGuides : []
    onInputChange('sizeGuides',
      currentGuides.filter((guide: unknown) => {
        const guideObj = guide as Record<string, unknown>
        return guideObj.id !== guideId
      })
    )
  }

  const updateMeasurement = (guideId: string, size: string, field: string, value: string) => {
    const currentGuides = Array.isArray(formData.sizeGuides) ? formData.sizeGuides : []
    const updatedGuides = currentGuides.map((guide: unknown) => {
      const guideObj = guide as Record<string, unknown>
      if (guideObj.id === guideId) {
        const measurements = guideObj.measurements as Record<string, unknown> || {}
        const sizeMeasurements = measurements[size] as Record<string, unknown> || {}
        return {
          ...guideObj,
          measurements: {
            ...measurements,
            [size]: {
              ...sizeMeasurements,
              [field]: value
            }
          }
        }
      }
      return guideObj
    })
    onInputChange('sizeGuides', updatedGuides)
  }

  const generateMeasurementTable = (category: string, gender: string) => {
    const sizes = commonSizes[category as keyof typeof commonSizes]?.[gender as keyof typeof commonSizes.clothing] || []
    const fields = measurementFields[category as keyof typeof measurementFields] || []
    
    const measurements: Record<string, Record<string, string>> = {}
    sizes.forEach(size => {
      measurements[size] = {}
      fields.forEach(field => {
        measurements[size][field] = ''
      })
    })
    
    return measurements
  }

  const getMeasurementFields = (category: string) => {
    return measurementFields[category as keyof typeof measurementFields] || []
  }

  const getSizes = (category: string, gender: string) => {
    return commonSizes[category as keyof typeof commonSizes]?.[gender as keyof typeof commonSizes.clothing] || []
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Square3Stack3DIcon className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Size Guide</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowSizeGuideModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Size Guide
        </button>
      </div>

      {/* Size Guide Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Size Guide
        </label>
        <select
          value={formData.sizeGuideId || ''}
          onChange={(e) => onInputChange('sizeGuideId', e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">No size guide</option>
          {(formData.sizeGuides || []).map((guide: unknown) => {
            const guideObj = guide as Record<string, unknown>
            return (
              <option key={String(guideObj.id)} value={String(guideObj.id)}>
                {String(guideObj.name)}
              </option>
            )
          })}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Choose a size guide to help customers find their perfect fit
        </p>
      </div>

      {/* Size Guides List */}
      {(formData.sizeGuides || []).map((guide: unknown) => {
        const guideObj = guide as Record<string, unknown>
        return (
        <div key={String(guideObj.id)} className="border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{String(guideObj.name)}</h4>
              <p className="text-sm text-gray-500">
                {String(guideObj.category)} • {String(guideObj.gender)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeSizeGuide(String(guideObj.id))}
              className="text-red-600 hover:text-red-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Measurement Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  {getMeasurementFields(String(guideObj.category)).map((field) => (
                    <th key={field} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {field.charAt(0).toUpperCase() + field.slice(1)} (cm)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSizes(String(guideObj.category), String(guideObj.gender)).map((size) => (
                  <tr key={size}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {size}
                    </td>
                    {getMeasurementFields(String(guideObj.category)).map((field) => (
                      <td key={field} className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="text"
                          value={((guideObj.measurements as Record<string, Record<string, string>>)?.[size]?.[field]) ?? ''}
                          onChange={(e) => updateMeasurement(String(guideObj.id), size, field, e.target.value)}
                          placeholder="0"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      })}

      {/* Add Size Guide Modal */}
      {showSizeGuideModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Size Guide</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guide Name
                  </label>
                  <input
                    type="text"
                    value={newSizeGuide.name}
                    onChange={(e) => setNewSizeGuide({ ...newSizeGuide, name: e.target.value })}
                    placeholder="e.g., US Women's Clothing"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newSizeGuide.category}
                    onChange={(e) => setNewSizeGuide({ ...newSizeGuide, category: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {sizeCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={newSizeGuide.gender}
                    onChange={(e) => setNewSizeGuide({ ...newSizeGuide, gender: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    {genderOptions.map((gender) => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
                  <p className="text-sm text-gray-600">
                    {newSizeGuide.name || 'Guide Name'} • {newSizeGuide.category} • {newSizeGuide.gender}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getSizes(newSizeGuide.category, newSizeGuide.gender).length} sizes • {getMeasurementFields(newSizeGuide.category).length} measurements
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSizeGuideModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addSizeGuide}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Help */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <TableCellsIcon className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Size Guide Tips</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Use centimeters for all measurements</li>
              <li>• Include model measurements for reference</li>
              <li>• Test the guide with real customers</li>
              <li>• Update measurements based on feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
