'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ADMIN_URLS } from '@/utils/admin-urls'
import { useAdminTenantKey } from '@/components/admin/AdminBrandingWrapper'
import { useDraftPersistence } from '@/hooks/useDraftPersistence'
import { buildCategoryTree, flattenCategoryTreeForSelect, getCategoryPath, type Category } from '@/utils/categoryUtils'

interface CategoryFormProps {
  mode: 'create' | 'edit'
  tenantId: string
  allCategories?: Category[]
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
  
  // Draft persistence
  const draftKey = `category_${mode}${initialData?.id ? `_${initialData.id}` : ''}`
  const { loadDraft, clearDraft, hasDraft } = useDraftPersistence({
    draftKey,
    formData,
    enabled: true
  })
  
  const [showDraftNotification, setShowDraftNotification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageAlt, setImageAlt] = useState<string>(initialData?.name || '')

  // Load draft data on component mount
  useEffect(() => {
    if (hasDraft()) {
      const draftData = loadDraft()
      if (draftData) {
        // Only load draft if we're not in edit mode with initial data
        if (mode === 'create' || !initialData) {
          setFormData(prev => ({
            ...prev,
            ...draftData
          }))
          setShowDraftNotification(true)
          console.log('[CategoryForm] Draft loaded successfully')
        }
      }
    }
  }, [hasDraft, loadDraft, mode, initialData])

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

      // Clear draft after successful submission
      clearDraft()
      console.log('[CategoryForm] Draft cleared after successful submission')

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
      {showDraftNotification && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <strong>Draft loaded:</strong> Your previous work has been restored automatically.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDraftNotification(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
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
          {formData.parentId && allCategories.length > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              ({getCategoryPath(formData.parentId, allCategories).join(' → ')})
            </span>
          )}
        </label>
        <select
          id="parentId"
          name="parentId"
          value={formData.parentId || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value || '' }))}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
        >
          <option value="">No parent (root category)</option>
          {(() => {
            // Build hierarchical options, excluding current category and its descendants
            const categoryTree = buildCategoryTree(allCategories)
            const flattenedCategories = flattenCategoryTreeForSelect(categoryTree)
            
            return flattenedCategories
              .filter(c => {
                // Exclude current category (can't be parent of itself)
                if (c.id === initialData?.id) return false
                
                // TODO: Also exclude descendants to prevent circular references
                // For now, basic exclusion is sufficient
                return true
              })
              .map(categoryOption => (
                <option key={categoryOption.id} value={categoryOption.id}>
                  {categoryOption.name}
                </option>
              ))
          })()}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Categories are displayed hierarchically. Choose a parent to create a subcategory.
        </p>
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
































