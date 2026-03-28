'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'

interface AttributeValue {
    id: string
    value: string
    created_at?: string
}

interface Attribute {
    id: string
    name: string
    created_at: string
}

interface AttributeTableProps {
    attributes: Attribute[]
}

export function AttributeTable({ attributes }: AttributeTableProps) {
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
    const [expandedAttribute, setExpandedAttribute] = useState<string | null>(null)
    const [values, setValues] = useState<Record<string, AttributeValue[]>>({})
    const [loadingValues, setLoadingValues] = useState<Record<string, boolean>>({})
    const router = useRouter()
    const tenantKey = useAdminTenantKey()

    const loadAttributeValues = async (attributeId: string) => {
        if (values[attributeId]) return // Already loaded

        setLoadingValues(prev => ({ ...prev, [attributeId]: true }))
        try {
            const response = await fetch(`/api/admin/attributes/${attributeId}/values`)
            if (!response.ok) throw new Error('Failed to load values')
            const data = await response.json()
            setValues(prev => ({ ...prev, [attributeId]: data.data || [] }))
        } catch (err) {
            console.error('Error loading attribute values:', err)
        } finally {
            setLoadingValues(prev => ({ ...prev, [attributeId]: false }))
        }
    }

    const handleToggleExpand = (attributeId: string) => {
        const newExpandedId = expandedAttribute === attributeId ? null : attributeId
        setExpandedAttribute(newExpandedId)
        if (newExpandedId && !values[newExpandedId]) {
            loadAttributeValues(newExpandedId)
        }
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAttributes(attributes.map(a => a.id))
        } else {
            setSelectedAttributes([])
        }
    }

    const handleSelectAttribute = (attributeId: string, checked: boolean) => {
        if (checked) {
            setSelectedAttributes(prev => [...prev, attributeId])
        } else {
            setSelectedAttributes(prev => prev.filter(id => id !== attributeId))
        }
    }

    const handleDeleteAttribute = async (attributeId: string) => {
        if (!confirm('Are you sure you want to delete this attribute? This will also delete all its values.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/attributes/${attributeId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const errorMessage = errorData.error || `Failed to delete attribute (${response.status})`
                alert(`Failed to delete attribute: ${errorMessage}`)
                return
            }

            alert('Attribute deleted successfully!')
            router.refresh()
            setTimeout(() => {
                window.location.reload()
            }, 100)
        } catch (err) {
            console.error('Error deleting attribute:', err)
            alert('Failed to delete attribute: Network error')
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    if (attributes.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attributes</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new attribute.</p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <input
                        id="select-all"
                        name="select-all"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={attributes.length > 0 && selectedAttributes.length === attributes.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <label htmlFor="select-all" className="text-sm text-gray-900">
                        {selectedAttributes.length} of {attributes.length} selected
                    </label>
                </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attribute
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Values
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {attributes.map((attr) => {
                        const attrValues = values[attr.id] || []
                        const isExpanded = expandedAttribute === attr.id
                        const isLoading = loadingValues[attr.id]

                        return (
                            <tr key={attr.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <input
                                            id={`attribute-${attr.id}`}
                                            name={`attribute-${attr.id}`}
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                                            checked={selectedAttributes.includes(attr.id)}
                                            onChange={(e) => handleSelectAttribute(attr.id, e.target.checked)}
                                        />
                                        <button
                                            onClick={() => handleToggleExpand(attr.id)}
                                            className="flex items-center gap-2 text-left group"
                                        >
                                            <svg
                                                className={`h-5 w-5 text-gray-400 transform transition ${isExpanded ? 'rotate-90' : ''}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <div className="text-sm font-medium text-gray-900">{attr.name}</div>
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-4 ml-10 pl-4 border-l-2 border-gray-200">
                                            {isLoading ? (
                                                <p className="text-sm text-gray-500">Loading values...</p>
                                            ) : attrValues.length === 0 ? (
                                                <p className="text-sm text-gray-500">No values</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {attrValues.map((val) => (
                                                        <span
                                                            key={val.id}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                                                        >
                                                            {val.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {attrValues.length > 0 ? attrValues.length : '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(attr.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <Link
                                            href={ADMIN_URLS.attributeEdit(attr.id, tenantKey)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            className="text-red-600 hover:text-red-900"
                                            onClick={() => handleDeleteAttribute(attr.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
