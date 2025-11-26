'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ProductFormData } from '@/types/product'
import { UseFormSetValue, FieldErrors } from 'react-hook-form'

interface SizeGuide {
  id: string
  name: string
  category: string
  gender: string
  measurements: Record<string, Record<string, number>> // size -> measurement field -> value in cm
}

interface SizeGuideSectionProps {
  sizeGuides?: SizeGuide[] // made optional to add default
  newSizeGuide?: SizeGuide
  setNewSizeGuide?: (guide: SizeGuide) => void
  onSaveSizeGuide?: (guide: SizeGuide) => Promise<void>
  onDeleteSizeGuide?: (id: string) => Promise<void>
  // Optional RHF props to align with ProductForm usage
  formData?: ProductFormData
  errors?: FieldErrors<ProductFormData>
  setValue?: UseFormSetValue<ProductFormData>
}

export function SizeGuideSection({
  sizeGuides = [], // default to empty array
  newSizeGuide = {
    id: '',
    name: '',
    category: '',
    gender: '',
    measurements: {}
  },
  setNewSizeGuide = () => {},
  onSaveSizeGuide = async () => {},
  onDeleteSizeGuide = async () => {},
  formData,
  errors,
  setValue
}: SizeGuideSectionProps) {
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null)

  // Helper: gets measurement fields depending on category, e.g., waist, chest, length
  const getMeasurementFields = (category: string): string[] => {
    switch (category?.toLowerCase()) {
      case 'men':
        return ['waist', 'chest', 'length']
      case 'women':
        return ['waist', 'bust', 'hip', 'length']
      default:
        return ['waist', 'chest', 'length']
    }
  }

  // Helper: get sizes list from measurements defined
  const getSizes = (guide: SizeGuide): string[] => {
    if (!guide?.measurements) return []
    return Object.keys(guide.measurements)
  }

  // Update a measurement value for a size
  const updateMeasurement = (guideId: string, size: string, field: string, value: string) => {
    if (guideId !== newSizeGuide.id) return
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) return // Could add UI feedback for validation

    const updatedMeasurements = {
      ...newSizeGuide.measurements,
      [size]: {
        ...newSizeGuide.measurements?.[size],
        [field]: Number(parsed.toFixed(2))
      }
    }

    setNewSizeGuide({ ...newSizeGuide, measurements: updatedMeasurements })
  }

  // Add a new size
  const addSize = () => {
    if (newSizeGuide.measurements?.['new']) return // Prevent duplicate key
    setNewSizeGuide({
      ...newSizeGuide,
      measurements: {
        ...newSizeGuide.measurements,
        new: getMeasurementFields(newSizeGuide.category).reduce((acc, field) => {
          acc[field] = 0
          return acc
        }, {} as Record<string, number>)
      }
    })
  }

  // Remove a size
  const removeSize = (size: string) => {
    if (size === 'new') return
    const updatedMeasurements = { ...newSizeGuide.measurements }
    delete updatedMeasurements[size]
    setNewSizeGuide({ ...newSizeGuide, measurements: updatedMeasurements })
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Size Guide</h3>
      {sizeGuides.length === 0 && <p className="text-gray-500">No size guides available.</p>}
      {sizeGuides.map(guide => (
        <div key={guide.id} className="p-4 border rounded mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{guide.name}</h4>
              <p className="text-sm text-gray-600">
                {guide.category} • {guide.gender}
              </p>
            </div>
            <button
              className="text-red-600 hover:text-red-800"
              onClick={() => onDeleteSizeGuide(guide.id)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-auto mt-2">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">Size</th>
                  {getMeasurementFields(guide.category).map(field => (
                    <th key={field} className="border border-gray-300 p-2 capitalize">
                      {field} (cm)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getSizes(guide).map(size => (
                  <tr key={size}>
                    <td className="border border-gray-300 p-2">{size}</td>
                    {getMeasurementFields(guide.category).map(field => (
                      <td key={field} className="border border-gray-300 p-2 text-center">
                        {(guide.measurements?.[size]?.[field] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 border rounded">
        <h4 className="text-md font-semibold mb-2">Add / Edit Size Guide</h4>
        <input
          type="text"
          placeholder="Guide Name"
          value={newSizeGuide.name}
          onChange={e => setNewSizeGuide({ ...newSizeGuide, name: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="text"
          placeholder="Category (men/women)"
          value={newSizeGuide.category}
          onChange={e => setNewSizeGuide({ ...newSizeGuide, category: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="text"
          placeholder="Gender"
          value={newSizeGuide.gender}
          onChange={e => setNewSizeGuide({ ...newSizeGuide, gender: e.target.value })}
          className="w-full mb-2 px-3 py-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
        />

        <button onClick={addSize} className="mb-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Add Size
        </button>

        <div className="overflow-auto max-h-64 border border-gray-300">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Size</th>
                {getMeasurementFields(newSizeGuide.category).map(field => (
                  <th key={field} className="border border-gray-300 p-2 capitalize">
                    {field} (cm)
                  </th>
                ))}
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSizes(newSizeGuide).map(size => (
                <tr key={size}>
                  <td className="border border-gray-300 p-2">{size}</td>
                  {getMeasurementFields(newSizeGuide.category).map(field => (
                    <td key={field} className="border border-gray-300 p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newSizeGuide.measurements?.[size]?.[field] ?? ''}
                        onChange={e => updateMeasurement(newSizeGuide.id, size, field, e.target.value)}
                        className="w-20 rounded border border-gray-300 text-center focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 p-2 text-center">
                    <button onClick={() => removeSize(size)} className="text-red-600 hover:text-red-900">
                      <XMarkIcon className="inline h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={() => onSaveSizeGuide(newSizeGuide)}
          disabled={!newSizeGuide.name || !newSizeGuide.category || !newSizeGuide.gender}
          className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Size Guide
        </button>
      </div>
    </div>
  )
}
