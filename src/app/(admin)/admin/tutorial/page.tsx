export default function AdminTutorialPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Tutorial</h1>
        <p className="text-gray-500">Learn how to tag products and create dynamic collections for your store.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quick Steps</h2>
          <ol className="mt-2 list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open Products and edit a product.</li>
            <li>Add meaningful tags (for example: summer, rain, wedding).</li>
            <li>Save and verify tags are visible in filters/collections.</li>
            <li>Use those tags in hero carousel CTA filters.</li>
          </ol>
        </div>

        <p className="text-sm text-gray-600">
          This page is available in global admin so sidebar links work on tenant domains too.
        </p>
      </div>
    </div>
  )
}
