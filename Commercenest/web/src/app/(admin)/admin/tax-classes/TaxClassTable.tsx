'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PencilIcon, 
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { deleteTaxClass, setDefaultTaxClass } from './actions'
import type { TaxClass } from '@/types/product'

interface TaxClassTableProps {
  taxClasses: TaxClass[]
}

export function TaxClassTable({ taxClasses }: TaxClassTableProps) {
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const router = useRouter()

  const handleDeleteTaxClass = async (taxClass: TaxClass) => {
    if (!confirm(`Are you sure you want to delete "${taxClass.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingClassId(taxClass.id)
      await deleteTaxClass(taxClass.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete tax class:', error)
      alert(`Failed to delete tax class: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeletingClassId(null)
    }
  }

  const handleSetDefault = async (taxClass: TaxClass) => {
    if (taxClass.is_default) return // Already default

    try {
      setSettingDefaultId(taxClass.id)
      await setDefaultTaxClass(taxClass.id)
      router.refresh()
    } catch (error) {
      console.error('Failed to set default tax class:', error)
      alert(`Failed to set default tax class: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSettingDefaultId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getUsageIndicator = (taxClass: TaxClass) => {
    // TODO: Add product count query to show how many products use this tax class
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tax Class
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Default
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {taxClasses.map((taxClass) => (
            <tr key={taxClass.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900 flex items-center">
                    {taxClass.name}
                    {taxClass.is_default && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  {taxClass.description && (
                    <div className="text-sm text-gray-500">
                      {taxClass.description}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {taxClass.rate_percent}%
                </div>
                <div className="text-xs text-gray-500">
                  GST Rate
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleSetDefault(taxClass)}
                  disabled={settingDefaultId === taxClass.id || Boolean(taxClass.is_default)}
                  className={`p-1 rounded ${
                    taxClass.is_default 
                      ? 'text-yellow-500' 
                      : 'text-gray-400 hover:text-yellow-500'
                  } disabled:opacity-50`}
                  title={taxClass.is_default ? 'Default tax class' : 'Set as default'}
                >
                  {taxClass.is_default ? (
                    <StarIconSolid className="h-5 w-5" />
                  ) : (
                    <StarIcon className="h-5 w-5" />
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(taxClass.updated_at || new Date().toISOString())}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {/* TODO: Edit functionality */}}
                    className="text-gray-600 hover:text-gray-900"
                    title="Edit tax class"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTaxClass(taxClass)}
                    disabled={deletingClassId === taxClass.id || Boolean(taxClass.is_default)}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={taxClass.is_default ? "Cannot delete default tax class" : "Delete tax class"}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {taxClasses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No tax classes found</p>
            <p className="text-sm mt-1">Create your first tax class to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}

