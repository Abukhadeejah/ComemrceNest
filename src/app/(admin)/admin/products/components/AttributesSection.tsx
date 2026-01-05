'use client'

import { useController, Control, FieldValues, Path } from 'react-hook-form'
import { ProductAttributeDefinition, AttributeSelection } from '@/types/product'

interface AttributesSectionProps<T extends FieldValues> {
	control: Control<T>
	name: Path<T>
	attributes: ProductAttributeDefinition[]
}

export function AttributesSection<T extends FieldValues>({
	control,
	name,
	attributes,
}: AttributesSectionProps<T>) {
	const { field } = useController({
		control,
		name,
		defaultValue: (attributes.map((attr) => ({
				attributeId: attr.id,
				valueIds: [],
			})) as unknown) as T[Path<T>],
	})

	const handleValueToggle = (attributeId: string, valueId: string | null) => {
		const currentValue = (field.value || []) as AttributeSelection[]
		const updated = currentValue.map((item) => {
			if (item.attributeId !== attributeId) return item
			const currentIds = item.valueIds || []
			if (valueId === null) {
				return { attributeId, valueIds: [] }
			}
			const exists = currentIds.includes(valueId)
			const newIds = exists ? currentIds.filter((id) => id !== valueId) : [...currentIds, valueId]
			return { attributeId, valueIds: newIds }
		})
		// Ensure all attributes are represented
		const missingAttrs = attributes.filter((attr) => !updated.some((item) => item.attributeId === attr.id))
		const finalValue = [
			...updated,
			...missingAttrs.map((attr) => ({
				attributeId: attr.id,
				valueIds: [],
			})),
		]
		field.onChange(finalValue)
	}

	if (attributes.length === 0) {
		return (
			<div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
				<p className="text-gray-500">
					No attributes available for this tenant. Create attributes in the{' '}
					<a href="/admin/products/attributes" className="text-blue-600 underline">
						Attributes Manager
					</a>
				</p>
			</div>
		)
	}

	const currentSelections = (field.value || []) as AttributeSelection[]

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
			<div>
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Product Attributes
				</h3>
				<p className="text-sm text-gray-600 mb-4">
					Select one or more values for each attribute
				</p>
			</div>

			<div className="space-y-4">
				{attributes.map((attribute) => {
					const selection = currentSelections.find((s) => s.attributeId === attribute.id)
					const selectedValueIds = selection?.valueIds || []

					return (
						<div key={attribute.id} className="border-b border-gray-200 pb-4 last:border-b-0">
							<label className="block text-sm font-medium text-gray-900 mb-3">
								{attribute.name}
							</label>
							<div className="space-y-2">
								<label className="flex items-center gap-2 text-sm text-gray-700">
									<input
										type="checkbox"
										checked={selectedValueIds.length === 0}
										onChange={() => handleValueToggle(attribute.id, null)}
										className="h-4 w-4 text-blue-600 border-gray-300 rounded"
									/>
									<span>None</span>
								</label>
								{attribute.values.map((value) => (
									<label key={value.id} className="flex items-center gap-2 text-sm text-gray-700">
										<input
											type="checkbox"
											checked={selectedValueIds.includes(value.id)}
											onChange={() => handleValueToggle(attribute.id, value.id)}
											className="h-4 w-4 text-blue-600 border-gray-300 rounded"
										/>
										<span>{value.value}</span>
									</label>
								))}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
