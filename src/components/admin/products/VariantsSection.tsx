'use client'

import { useState } from 'react'
import { 
  Squares2X2Icon, 
  PlusIcon, 
  XMarkIcon,
  SwatchIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { ProductFormData } from '@/types/product'

interface VariantsSectionProps {
  formData: ProductFormData
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

export default function VariantsSection({ formData, onInputChange }: VariantsSectionProps) {
  const [showVariantOptions, setShowVariantOptions] = useState(false)
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionType, setNewOptionType] = useState('text')

  const variantOptionTypes = [
    { value: 'text', label: 'Text', icon: TagIcon },
    { value: 'color', label: 'Color Swatch', icon: SwatchIcon },
    { value: 'image', label: 'Image Swatch', icon: Squares2X2Icon },
    { value: 'select', label: 'Dropdown', icon: TagIcon }
  ]

  const addVariantOption = () => {
    if (!newOptionName.trim()) return

    const newOption = {
      id: Date.now().toString(),
      name: newOptionName,
      displayName: newOptionName,
      type: newOptionType,
      required: false,
      values: []
    }

    const currentOptions = Array.isArray(formData.variantOptions) ? formData.variantOptions : []
    onInputChange('variantOptions', [...currentOptions, newOption])
    setNewOptionName('')
    setNewOptionType('text')
    setShowVariantOptions(false)
  }

    const removeVariantOption = (optionId: string) => {
    const currentOptions = Array.isArray(formData.variantOptions) ? formData.variantOptions : []
    onInputChange('variantOptions',
      currentOptions.filter((opt: unknown) => {
        const optObj = opt as Record<string, unknown>
        return optObj.id !== optionId
      })
    )
  }

  const addOptionValue = (optionId: string) => {
    const currentOptions = Array.isArray(formData.variantOptions) ? formData.variantOptions : []
    const updatedOptions = currentOptions.map((opt: unknown) => {
      const optObj = opt as Record<string, unknown>
      if (optObj.id === optionId) {
        const currentValues = Array.isArray(optObj.values) ? optObj.values : []
        return {
          ...optObj,
          values: [...currentValues, { id: Date.now().toString(), value: '', displayValue: '' }]
        }
      }
      return optObj
    })
    onInputChange('variantOptions', updatedOptions)
  }

  const updateOptionValue = (optionId: string, valueId: string, field: string, value: string) => {
    const currentOptions = Array.isArray(formData.variantOptions) ? formData.variantOptions : []
    const updatedOptions = currentOptions.map((opt: unknown) => {
      const optObj = opt as Record<string, unknown>
      if (optObj.id === optionId) {
        const currentValues = Array.isArray(optObj.values) ? optObj.values : []
        return {
          ...optObj,
          values: currentValues.map((val: unknown) => {
            const valObj = val as Record<string, unknown>
            if (valObj.id === valueId) {
              return { ...valObj, [field]: value }
            }
            return valObj
          })
        }
      }
      return optObj
    })
    onInputChange('variantOptions', updatedOptions)
  }

  const removeOptionValue = (optionId: string, valueId: string) => {
    const currentOptions = Array.isArray(formData.variantOptions) ? formData.variantOptions : []
    const updatedOptions = currentOptions.map((opt: unknown) => {
      const optObj = opt as Record<string, unknown>
      if (optObj.id === optionId) {
        const currentValues = Array.isArray(optObj.values) ? optObj.values : []
        return {
          ...optObj,
          values: currentValues.filter((val: unknown) => {
            const valObj = val as Record<string, unknown>
            return valObj.id !== valueId
          })
        }
      }
      return optObj
    })
    onInputChange('variantOptions', updatedOptions)
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Squares2X2Icon className="h-6 w-6 text-gray-400 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowVariantOptions(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Variant Option
        </button>
      </div>

      {/* Enable Variants Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Enable Product Variants
            </label>
            <p className="text-sm text-gray-500">
              Allow customers to select different options like size, color, etc.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onInputChange('has_variants', !formData.has_variants)}
            className={`${
              formData.has_variants ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                formData.has_variants ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      {formData.has_variants && (
        <div className="space-y-6">
          {/* Existing Variant Options */}
          {(formData.variantOptions || []).map((option: unknown) => {
            const optionObj = option as Record<string, unknown>
            return (
                          <div key={String(optionObj.id)} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{String(optionObj.displayName)}</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {String(optionObj.type)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariantOption(String(optionObj.id))}
                  className="text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Option Values */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Values</label>
                  <button
                    type="button"
                    onClick={() => addOptionValue(String(optionObj.id))}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <PlusIcon className="h-4 w-4 inline mr-1" />
                    Add Value
                  </button>
                </div>

                {(optionObj.values as unknown[] || []).map((value: unknown) => {
                  const valueObj = value as Record<string, unknown>
                  return (
                  <div key={String(valueObj.id)} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={String(valueObj.value || '')}
                      onChange={(e) => updateOptionValue(String(optionObj.id), String(valueObj.id), 'value', e.target.value)}
                      placeholder="Value (e.g., Red, XL)"
                      className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <input
                      type="text"
                      value={String(valueObj.displayValue || '')}
                      onChange={(e) => updateOptionValue(String(optionObj.id), String(valueObj.id), 'displayValue', e.target.value)}
                      placeholder="Display Name (e.g., Red, Extra Large)"
                      className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {String(optionObj.type) === 'color' && (
                      <input
                        type="color"
                        value={String(valueObj.colorHex || '#000000')}
                        onChange={(e) => updateOptionValue(String(optionObj.id), String(valueObj.id), 'colorHex', e.target.value)}
                        className="h-8 w-8 rounded border border-gray-300"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeOptionValue(String(optionObj.id), String(valueObj.id))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
              </div>
            </div>
            )
          })}

          {/* Add New Option Modal */}
          {showVariantOptions && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Add Variant Option</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option Name
                      </label>
                      <input
                        type="text"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        placeholder="e.g., Size, Color, Material"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option Type
                      </label>
                      <select
                        value={newOptionType}
                        onChange={(e) => setNewOptionType(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        {variantOptionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowVariantOptions(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addVariantOption}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Variant Combinations Preview */}
          {(formData.variantOptions || []).length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Variant Combinations Preview</h4>
              <p className="text-sm text-gray-600">
                {generateVariantCombinations(formData.variantOptions).length} combinations will be created
              </p>
              <div className="mt-2 text-xs text-gray-500">
                {generateVariantCombinations(formData.variantOptions).slice(0, 5).map((combo, index) => (
                  <div key={index} className="mb-1">
                    {Object.entries(combo).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </div>
                ))}
                {generateVariantCombinations(formData.variantOptions).length > 5 && (
                  <div>... and {generateVariantCombinations(formData.variantOptions).length - 5} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to generate variant combinations
function generateVariantCombinations(options: unknown[]) {
  if (!options || !Array.isArray(options) || options.length === 0) return []
  
  const validOptions = options.filter(opt => {
    if (typeof opt !== 'object' || opt === null) return false
    const option = opt as Record<string, unknown>
    const values = option.values
    return values && Array.isArray(values) && values.length > 0
  }) as Record<string, unknown>[]
  
  if (validOptions.length === 0) return []

  const combinations: Record<string, unknown>[] = []
  
  function generateCombos(current: Record<string, unknown>, index: number) {
    if (index === validOptions.length) {
      combinations.push({ ...current })
      return
    }
    
    const option = validOptions[index]
    const values = option.values as Record<string, unknown>[]
    values.forEach((value: Record<string, unknown>) => {
      generateCombos({ ...current, [String(option.name)]: value.displayValue || value.value }, index + 1)
    })
  }
  
  generateCombos({}, 0)
  return combinations
}


