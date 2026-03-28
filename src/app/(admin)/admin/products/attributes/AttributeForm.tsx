'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'

interface AttributeValue {
    id: string
    value: string
}

interface AttributeFormProps {
    mode: 'create' | 'edit'
    initialData?: {
        id?: string
        name: string
    }
    initialValues?: AttributeValue[]
}

export function AttributeForm({ mode, initialData, initialValues = [] }: AttributeFormProps) {
    const router = useRouter()
    const tenantKey = useAdminTenantKey()
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
    })

    const [values, setValues] = useState<AttributeValue[]>(initialValues)
    const [newValueText, setNewValueText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // First, create or update the attribute
            const response = await fetch('/api/admin/attributes', {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    id: initialData?.id,
                }),
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data?.error || 'Failed to save attribute')
            }

            const result = await response.json()
            const attributeId = result.data.id

            // If in create mode and we have values, add them
            if (mode === 'create' && values.length > 0) {
                for (const value of values) {
                    await fetch(`/api/admin/attributes/${attributeId}/values`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ value: value.value }),
                    })
                }
            }

            router.push(ADMIN_URLS.attributes(tenantKey))
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleAddValue = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newValueText.trim()) return

        if (mode === 'edit' && initialData?.id) {
            // In edit mode, add value via API
            addValueViaAPI(newValueText.trim())
        } else {
            // In create mode, add to local state
            setValues(prev => [...prev, { id: `temp-${Date.now()}`, value: newValueText.trim() }])
            setNewValueText('')
        }
    }

    const addValueViaAPI = async (value: string) => {
        try {
            const response = await fetch(
                `/api/admin/attributes/${initialData?.id}/values`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create value')
            }

            const result = await response.json()
            setValues(prev => [...prev, result.data])
            setNewValueText('')
            alert('Value added successfully!')
        } catch (err) {
            console.error('Error adding value:', err)
            setError(err instanceof Error ? err.message : 'Failed to add value')
        }
    }

    const handleDeleteValue = async (valueId: string) => {
        if (mode === 'edit' && initialData?.id) {
            // In edit mode, delete via API
            try {
                const response = await fetch(
                    `/api/admin/attributes/${initialData.id}/values/${valueId}`,
                    { method: 'DELETE' }
                )

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to delete value')
                }

                setValues(prev => prev.filter(v => v.id !== valueId))
                alert('Value deleted successfully!')
            } catch (err) {
                console.error('Error deleting value:', err)
                setError(err instanceof Error ? err.message : 'Failed to delete value')
            }
        } else {
            // In create mode, remove from local state
            setValues(prev => prev.filter(v => v.id !== valueId))
        }
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-sm text-red-800">{error}</div>
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Attribute Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Color, Size, Material"
                    required
                />
                <p className="mt-1 text-sm text-gray-500">
                    The name of the product attribute
                </p>
            </div>

            {/* Values Section */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attribute Values
                </label>

                {/* Add Value Form */}
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Add new value..."
                        value={newValueText}
                        onChange={(e) => setNewValueText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddValue(e)
                            }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={handleAddValue}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium whitespace-nowrap"
                    >
                        Add Value
                    </button>
                </div>

                {/* Values Display */}
                {values.length === 0 ? (
                    <p className="text-gray-500 text-sm">No values yet. Add values above.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {values.map((val) => (
                            <div
                                key={val.id}
                                className="flex items-center justify-between bg-white border border-gray-300 rounded px-3 py-2 text-sm group"
                            >
                                <span>{val.value}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteValue(val.id)}
                                    className="text-red-600 hover:text-red-800 ml-2 opacity-0 group-hover:opacity-100 transition"
                                    title="Delete value"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : mode === 'create' ? 'Create Attribute' : 'Update Attribute'}
                </button>
            </div>
        </form>
    )
}
