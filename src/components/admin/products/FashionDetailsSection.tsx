'use client'

import { 
  SparklesIcon, 
  UserIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { ProductFormData } from '@/types/product'

interface FashionDetailsSectionProps {
  formData: ProductFormData
  onInputChange: (field: keyof ProductFormData, value: string | number | boolean | null | unknown[]) => void
}

const FIELD_MAX_LENGTHS = {
  material_composition: 255,
  care_instructions: 1000,
  model_wearing_size: 50,
}

export default function FashionDetailsSection({ formData, onInputChange }: FashionDetailsSectionProps) {
  const fitTypes = [
    { value: 'slim', label: 'Slim Fit' },
    { value: 'regular', label: 'Regular Fit' },
    { value: 'loose', label: 'Loose Fit' },
    { value: 'oversized', label: 'Oversized Fit' }
  ]

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <SparklesIcon className="h-6 w-6 text-gray-400 mr-3" />
        <h3 className="text-lg font-medium text-gray-900">Fashion Details</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Composition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material Composition <span className="text-gray-400 text-xs">({(formData.material_composition || '').length}/{FIELD_MAX_LENGTHS.material_composition})</span>
          </label>
          <textarea
            value={String(formData.material_composition || '')}
            onChange={(e) => onInputChange('material_composition', e.target.value)}
            placeholder="e.g., 100% Cotton, 95% Polyester 5% Elastane"
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            List the materials and their percentages (max {FIELD_MAX_LENGTHS.material_composition} characters)
          </p>
        </div>

        {/* Care Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Care Instructions <span className="text-gray-400 text-xs">({(formData.care_instructions || '').length}/{FIELD_MAX_LENGTHS.care_instructions})</span>
          </label>
          <textarea
            value={String(formData.care_instructions || '')}
            onChange={(e) => onInputChange('care_instructions', e.target.value)}
            placeholder="e.g., Machine wash cold, Tumble dry low, Do not bleach"
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Washing and care instructions for customers (max {FIELD_MAX_LENGTHS.care_instructions} characters)
          </p>
        </div>

        {/* Fit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fit Type
          </label>
          <select
            value={String(formData.fit_type || '')}
            onChange={(e) => onInputChange('fit_type', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select fit type</option>
            {fitTypes.map((fit) => (
              <option key={fit.value} value={fit.value}>
                {fit.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            How the garment fits on the body
          </p>
        </div>

        {/* Gift Card Toggle */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Gift Card Product
              </label>
              <p className="text-sm text-gray-500">
                This product is a gift card
              </p>
            </div>
            <button
              type="button"
              onClick={() => onInputChange('is_gift_card', !formData.is_gift_card)}
              className={`${
                formData.is_gift_card ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  formData.is_gift_card ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Gift Card Fields */}
      {formData.is_gift_card && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gift Card Amount (₹)
            </label>
            <input
              type="number"
              value={typeof formData.gift_card_amount_cents === 'number' ? formData.gift_card_amount_cents / 100 : ''}
              onChange={(e) => onInputChange('gift_card_amount_cents', e.target.value ? parseInt(e.target.value) * 100 : null)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Fixed amount for this gift card
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Days
            </label>
            <input
              type="number"
              value={String(formData.gift_card_expiry_days || '')}
              onChange={(e) => onInputChange('gift_card_expiry_days', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="365"
              min="1"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Days until gift card expires (leave empty for no expiry)
            </p>
          </div>
        </div>
      )}

      {/* Model Information */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h4 className="text-md font-medium text-gray-900">Model Information</h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Help customers understand how the product fits by providing model measurements
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Height (cm)
            </label>
            <input
              type="number"
              value={String(formData.model_height_cm || '')}
              onChange={(e) => onInputChange('model_height_cm', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="170"
              min="100"
              max="250"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Weight (kg)
            </label>
            <input
              type="number"
              value={String(formData.model_weight_kg || '')}
              onChange={(e) => onInputChange('model_weight_kg', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="65"
              min="30"
              max="200"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Wearing Size <span className="text-gray-400 text-xs">({(formData.model_wearing_size || '').length}/{FIELD_MAX_LENGTHS.model_wearing_size})</span>
            </label>
            <input
              type="text"
              value={String(formData.model_wearing_size || '')}
              onChange={(e) => onInputChange('model_wearing_size', e.target.value)}
              placeholder="M"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">Model size label (max {FIELD_MAX_LENGTHS.model_wearing_size} characters)</p>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Model Photo
            </button>
          </div>
        </div>
      </div>

      {/* Fashion Tips */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-purple-400 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-900">Fashion Product Tips</h4>
            <ul className="mt-2 text-sm text-purple-700 space-y-1">
              <li>• Include detailed material composition for transparency</li>
              <li>• Provide clear care instructions to prevent damage</li>
              <li>• Model measurements help customers choose the right size</li>
              <li>• Accurate fit descriptions reduce returns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


