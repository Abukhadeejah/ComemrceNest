'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'

interface CategoryFormProps {
  mode: 'create' | 'edit'
  tenantId: string
  allCategories?: Array<{ id: string; name: string }>
  initialData?: {
    id?: string
    name: string
    slug: string
    parentId?: string | null
  }
}

export function CategoryForm({ mode, allCategories = [], initialData }: CategoryFormProps) {
  const router = useRouter()
  const tenantKey = useAdminTenantKey()
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    parentId: initialData?.parentId || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageAlt, setImageAlt] = useState<string>(initialData?.name || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Optional: upload image first to get URL
      let imageUrl: string | undefined
      if (imageFile) {
        const form = new FormData()
        form.append('file', imageFile)
        // No category id yet for create; backend will store under temp
        if (initialData?.id) form.append('categoryId', initialData.id)
        const uploadRes = await fetch('/api/admin/categories/upload', { method: 'POST', body: form })
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to upload image')
        }
        const { url } = await uploadRes.json()
        imageUrl = url
      }
      const response = await fetch('/api/admin/categories', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          parentId: formData.parentId || null,
          id: initialData?.id,
          imageUrl: imageUrl || undefined,
          imageAlt: imageAlt || undefined
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to save category')
      }

      router.push(ADMIN_URLS.categories(tenantKey))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    if (!imageAlt) setImageAlt(formData.name || file.name)
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
          Category Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category Image (optional)
        </label>
        <div className="mt-1 flex items-center gap-4">
          {imagePreview ? (
            <Image src={imagePreview} alt={imageAlt || 'Preview'} width={64} height={64} className="h-16 w-16 rounded object-cover border" />
          ) : (
            <div className="h-16 w-16 rounded bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">
              IMG
            </div>
          )}
          <div>
            <input type="file" accept="image/*" onChange={onFileChange} />
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 2MB</p>
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="imageAlt" className="block text-sm font-medium text-gray-700">Alt text</label>
          <input
            id="imageAlt"
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Describe the category image"
          />
        </div>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          The URL-friendly version of the category name
        </p>
      </div>

      <div>
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
          Parent category (optional)
        </label>
        <select
          id="parentId"
          name="parentId"
          value={formData.parentId || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || '' }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">No parent</option>
          {allCategories
            .filter(c => c.id !== initialData?.id)
            .map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
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
          {loading ? 'Saving...' : mode === 'create' ? 'Create Category' : 'Update Category'}
        </button>
      </div>
    </form>
  )
}
































