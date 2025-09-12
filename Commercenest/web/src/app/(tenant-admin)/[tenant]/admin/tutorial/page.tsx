import { TutorialGuide } from './TutorialGuide'

export default function TutorialPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Tutorial</h1>
        <p className="text-gray-500">Learn how to use tags and create dynamic collections for your store</p>
      </div>

      <TutorialGuide />
    </div>
  )
}







