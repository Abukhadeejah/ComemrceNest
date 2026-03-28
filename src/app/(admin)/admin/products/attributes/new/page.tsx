import { AttributeForm } from '../AttributeForm'

export default function NewAttributePage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create New Attribute</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Create a new product attribute and add its possible values
                </p>
            </div>

            <div className="bg-white shadow rounded-lg">
                <AttributeForm mode="create" />
            </div>
        </div>
    )
}
