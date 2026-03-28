import { notFound } from 'next/navigation'
import { getAttribute, getAttributeValues } from '@/app/(admin)/admin/products/attributes/actions'
import { AttributeForm } from '@/app/(admin)/admin/products/attributes/AttributeForm'

interface EditAttributePageProps {
    params: Promise<{
        id: string
    }>
}

export default async function EditAttributePage({ params }: EditAttributePageProps) {
    const { id } = await params

    const attribute = await getAttribute(id)
    const values = await getAttributeValues(id)

    if (!attribute) {
        notFound()
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Attribute</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Update the attribute name and manage its values
                </p>
            </div>

            <div className="bg-white shadow rounded-lg">
                <AttributeForm
                    mode="edit"
                    initialData={{
                        id: attribute.id,
                        name: attribute.name,
                    }}
                    initialValues={values}
                />
            </div>
        </div>
    )
}
