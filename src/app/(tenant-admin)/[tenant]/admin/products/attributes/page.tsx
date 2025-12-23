import { getAttributes } from '@/app/(admin)/admin/products/attributes/actions'
import { CreateAttributeButton } from '@/app/(admin)/admin/products/attributes/CreateAttributeButton'
import { AttributeTable } from '@/app/(admin)/admin/products/attributes/AttributeTable'

interface AdminAttributesProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function AdminAttributes({ searchParams }: AdminAttributesProps) {
  const params = await searchParams

  const attributes = await getAttributes()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Attributes</h1>
        <CreateAttributeButton />
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search attributes
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search attributes by name..."
                  type="search"
                  defaultValue={params.search}
                />
              </div>
            </div>
          </div>
        </div>

        <AttributeTable attributes={attributes} />
      </div>
    </div>
  )
}
