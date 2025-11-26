'use client'

import { useState } from 'react'
import { PlusIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface VariantOption {
  id: string
  name: string
  displayName: string
  type: 'text' | 'color' | 'image' | 'select' | 'size' | 'material' | 'style' | string
  required: boolean
  values: VariantOptionValue[]
}

interface VariantOptionValue {
  id: string
  value: string
  displayValue: string
  colorHex?: string
  imageUrl?: string
  priceAdjustmentCents?: number
  costAdjustmentCents?: number
}

interface VariantCombination {
  id: string
  options: Record<string, string> // option_id -> option_value_id
  priceCents: number
  stock: number
  sku: string
  imageUrl?: string
}

interface VariantsSectionProps {
  hasVariants: boolean
  onHasVariantsChange: (hasVariants: boolean) => void
  variantOptions?: VariantOption[]
  onVariantOptionsChange: (options: VariantOption[]) => void
  variantCombinations?: VariantCombination[]
  onVariantCombinationsChange: (combinations: VariantCombination[]) => void
  onUpdateVariants?: (variantData: { hasVariants: boolean; variantOptions: VariantOption[]; variantCombinations: VariantCombination[] }) => Promise<void>
  productId?: string
}

export function VariantsSection({
  hasVariants,
  onHasVariantsChange,
  variantOptions = [],
  onVariantOptionsChange,
  variantCombinations = [],
  onVariantCombinationsChange,
  onUpdateVariants,
  productId
}: VariantsSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['options']))
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionType, setNewOptionType] = useState<'text' | 'color' | 'image' | 'select'>('select')
  const [isUpdatingVariants, setIsUpdatingVariants] = useState(false)
  const [bulkStock, setBulkStock] = useState('')

  const optionHasValues = (opt: VariantOption) => Array.isArray(opt.values) && opt.values.length > 0
  const allOptionsValid = variantOptions.every(opt => opt.name?.trim() && optionHasValues(opt))
  const combinationsValid =
    variantCombinations.length > 0 &&
    variantCombinations.every(c => (c.priceCents ?? 0) >= 0 && (c.stock ?? 0) >= 0 && Object.keys(c.options || {}).length > 0)
  const canUpdateVariants = hasVariants ? variantOptions.length > 0 && allOptionsValid && combinationsValid : true

  // Toggle expansion state for options or combinations
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Add a new variant option
  const addVariantOption = () => {
    if (!newOptionName.trim()) return

    const newOption: VariantOption = {
      id: `option_${Date.now()}`,
      name: newOptionName.toLowerCase().replace(/\s+/g, '_'),
      displayName: newOptionName,
      type: newOptionType,
      required: false,
      values: []
    }

    onVariantOptionsChange([...variantOptions, newOption])
    setNewOptionName('')
    setNewOptionType('select')
  }

  // Remove variant option and clean up option values in combinations
  const removeVariantOption = (optionId: string) => {
    onVariantOptionsChange(variantOptions.filter(opt => opt.id !== optionId))
    const updatedCombinations = variantCombinations.map(combo => {
      const newOptions = { ...combo.options }
      delete newOptions[optionId]
      return { ...combo, options: newOptions }
    })
    onVariantCombinationsChange(updatedCombinations)
  }

  // Add a new option value
  const addOptionValue = (optionId: string, value: string, displayValue: string) => {
    const updatedOptions = variantOptions.map(option => {
      if (option.id === optionId) {
        const newValue: VariantOptionValue = {
          id: `value_${Date.now()}`,
          value: value.toLowerCase().replace(/\s+/g, '_'),
          displayValue
        }
        return { ...option, values: [...(option.values || []), newValue] }
      }
      return option
    })
    onVariantOptionsChange(updatedOptions)
  }

  // Update an option value field
  const updateOptionValue = (
    optionId: string,
    valueId: string,
    field: keyof VariantOptionValue,
    value: string | number
  ) => {
    const updatedOptions = variantOptions.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          values: (option.values || []).map(v => {
            if (v.id === valueId) {
              return { ...v, [field]: value }
            }
            return v
          })
        }
      }
      return option
    })
    onVariantOptionsChange(updatedOptions)
  }

  // Remove an option value and clean combinations that reference it
  const removeOptionValue = (optionId: string, valueId: string) => {
    const updatedOptions = variantOptions.map(option => {
      if (option.id === optionId) {
        return { ...option, values: (option.values || []).filter(v => v.id !== valueId) }
      }
      return option
    })
    onVariantOptionsChange(updatedOptions)

    const updatedCombinations = variantCombinations.map(combo => {
      const newOptions = { ...combo.options }
      if (newOptions[optionId] === valueId) {
        delete newOptions[optionId]
      }
      return { ...combo, options: newOptions }
    })
    onVariantCombinationsChange(updatedCombinations)
  }

  // Generate variant combinations using cartesian product approach
  const generateCombinations = () => {
    if (variantOptions.length === 0) return

    const cartesianProduct = (arrays: VariantOptionValue[][]): VariantOptionValue[][] =>
      arrays.reduce(
        (a, b) => a.flatMap(d => b.map(e => [...d, e])),
        [[]] as VariantOptionValue[][]
      )

    const allValueArrays = variantOptions.map(opt => opt.values || [])
    const allCombinations = cartesianProduct(allValueArrays)

    const newCombinations = allCombinations.map(values => {
      const options: Record<string, string> = {}
      values.forEach((val, idx) => {
        options[variantOptions[idx].id] = val.id
      })
      const existing = variantCombinations.find(combo => JSON.stringify(combo.options) === JSON.stringify(options))
      return (
        existing || {
          id: crypto.randomUUID(),
          options,
          priceCents: 0,
          stock: 0,
          sku: '',
          imageUrl: ''
        }
      )
    })

    onVariantCombinationsChange(newCombinations)
  }

  // Check for duplicate SKU
  const isDuplicateSKU = (sku: string, id: string) =>
    variantCombinations.some(c => c.sku === sku && c.id !== id && sku !== '')

  // Update a variant combination field
  const updateCombination = (comboId: string, field: keyof VariantCombination, value: string | number) => {
    const updatedCombinations = variantCombinations.map(combo => {
      if (combo.id === comboId) {
        return { ...combo, [field]: value }
      }
      return combo
    })
    onVariantCombinationsChange(updatedCombinations)
  }

  // Remove a combination
  const removeCombination = (comboId: string) => {
    onVariantCombinationsChange(variantCombinations.filter(combo => combo.id !== comboId))
  }

  // Bulk stock update state and handler
 

  const applyBulkStock = () => {
    const qty = parseInt(bulkStock)
    if (isNaN(qty)) return
    const updated = variantCombinations.map(combo => ({ ...combo, stock: qty }))
    onVariantCombinationsChange(updated)
  }

  // Display combination option values as string
  const getCombinationDisplayName = (combo: VariantCombination) => {
    return Object.entries(combo.options)
      .map(([optionId, valueId]) => {
        const option = variantOptions.find(opt => opt.id === optionId)
        const value = option?.values.find(v => v.id === valueId)
        return value?.displayValue || value?.value || 'Unknown'
      })
      .join(' / ')
  }

  // Handle update variants button click
  const handleUpdateVariants = async () => {
    if (!onUpdateVariants || !productId) return

    setIsUpdatingVariants(true)
    try {
      await onUpdateVariants({
        hasVariants,
        variantOptions,
        variantCombinations
      })
    } catch (error) {
      console.error('Error updating variants:', error)
    } finally {
      setIsUpdatingVariants(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={e => onHasVariantsChange(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Enable product variants</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Create multiple variations of this product (size, color, material, etc.)
        </p>
        {hasVariants && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">📝 How it works:</p>
            <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
              <li><strong>Add Options:</strong> Create options like "Size" or "Color"</li>
              <li><strong>Add Values:</strong> Add values like "Small, Medium, Large" or "Red, Blue"</li>
              <li><strong>Generate Combinations:</strong> Click "Generate" to create all possible combinations</li>
              <li><strong>Set Prices:</strong> Set individual price and stock for each combination</li>
            </ol>
          </div>
        )}
      </div>

      {!hasVariants ? (
        <div className="text-center py-8 text-gray-500">
          <p>Product variants are disabled. Enable variants to create multiple product variations.</p>
        </div>
      ) : (
        <>
          {/* Variant Options */}
          <div className="border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg">
              <button
                type="button"
                onClick={() => toggleSection('options')}
                className="flex items-center space-x-2 flex-1"
              >
                <span className="font-medium text-gray-900">
                  Variant Options<span className="text-red-600"> *</span>
                </span>
                <span className="text-sm text-gray-500">({variantOptions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => toggleSection('options')}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {expandedSections.has('options') ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {expandedSections.has('options') && (
              <div className="p-4 space-y-4">
                {/* Add New Option */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Option name (e.g., Size, Color)"
                    value={newOptionName}
                    onChange={e => setNewOptionName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <select
                    value={newOptionType}
                    onChange={e => setNewOptionType(e.target.value as 'text' | 'color' | 'image' | 'select')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="select">Select</option>
                    <option value="color">Color</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                  <button
                    type="button"
                    onClick={addVariantOption}
                    disabled={!newOptionName.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Existing Options */}
                <div className="space-y-3">
                  {variantOptions.map(option => (
                    <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{option.displayName}</h4>
                          <p className="text-sm text-gray-500">Type: {option.type}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariantOption(option.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Option Values */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Values<span className="text-red-600"> *</span>
                          </span>
                          <AddValueButton
                            option={option}
                            onAdd={(value, displayValue) => addOptionValue(option.id, value, displayValue)}
                          />
                        </div>

                        <div className="space-y-2">
                          {(option.values || []).map(value => (
                            <div key={value.id} className="bg-gray-50 px-3 py-2 rounded-md">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">{value.displayValue}</span>
                                <button
                                  type="button"
                                  onClick={() => removeOptionValue(option.id, value.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Variant Combinations */}
          {variantOptions.length > 0 && (
            <div className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-t-lg">
                <button
                  type="button"
                  onClick={() => toggleSection('combinations')}
                  className="flex items-center space-x-2 flex-1"
                >
                  <span className="font-medium text-gray-900">
                    Variant Combinations<span className="text-red-600"> *</span>
                  </span>
                  <span className="text-sm text-gray-500">{(variantCombinations || []).length}</span>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={generateCombinations}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Generate
                  </button>
                  {onUpdateVariants && (
                    <button
                      type="button"
                      onClick={handleUpdateVariants}
                      disabled={isUpdatingVariants || (hasVariants && !canUpdateVariants)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingVariants ? 'Updating...' : 'Update Variants'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSection('combinations')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {expandedSections.has('combinations') ? (
                      <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedSections.has('combinations') && (
                <div className="p-4">
                  {hasVariants && !canUpdateVariants && (
                    <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      Complete requirements before saving: at least one option with values, at least one combination, non‑negative price and stock.
                    </div>
                  )}
                  {(variantCombinations || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No combinations generated yet.</p>
                      <p className="text-sm mt-1">Click &quot;Generate&quot; to create all possible combinations.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Variant
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price (₹)
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU <span className="text-gray-400">(Optional)</span>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(variantCombinations || []).map(combo => (
                              <tr key={combo.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {getCombinationDisplayName(combo)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={combo.priceCents / 100}
                                    onChange={e =>
                                      updateCombination(combo.id, 'priceCents', Math.round(parseFloat(e.target.value) * 100))
                                    }
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={combo.stock}
                                    onChange={e => updateCombination(combo.id, 'stock', parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    min="0"
                                  />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <input
                                    type="text"
                                    value={combo.sku}
                                    onChange={e => updateCombination(combo.id, 'sku', e.target.value)}
                                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Optional"
                                  />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => removeCombination(combo.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AddValueButton({ option, onAdd }: { option: VariantOption; onAdd: (value: string, displayValue: string) => void }) {
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [newDisplayValue, setNewDisplayValue] = useState('')

  const handleAdd = () => {
    if (newValue.trim() && newDisplayValue.trim()) {
      onAdd(newValue.trim(), newDisplayValue.trim())
      setNewValue('')
      setNewDisplayValue('')
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setNewValue('')
    setNewDisplayValue('')
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
          autoFocus
        />
        <input
          type="text"
          placeholder="Display"
          value={newDisplayValue}
          onChange={e => setNewDisplayValue(e.target.value)}
          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded"
        />
        <button type="button" onClick={handleAdd} className="text-green-600 hover:text-green-800 text-xs">
          Add
        </button>
        <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 text-xs">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button type="button" onClick={() => setIsAdding(true)} className="text-xs text-indigo-600 hover:text-indigo-800">
      + Add Value
    </button>
  )
}
