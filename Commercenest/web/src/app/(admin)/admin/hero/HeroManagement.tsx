'use client'

import { useState, useTransition } from 'react'
import { 
  createHeroSlide, 
  updateHeroSlide, 
  deleteHeroSlide, 
  reorderHeroSlides,
  updateHeroSettings
} from './actions'
import { HeroSlideForm } from './HeroSlideForm'
import { HeroSettingsForm } from './HeroSettingsForm'
import { HeroSlide, HeroSettings } from '@/types/hero'

interface HeroManagementProps {
  initialSlides: HeroSlide[]
  initialSettings: HeroSettings | null
  tenantId: string
}

export function HeroManagement({ initialSlides, initialSettings, tenantId: _tenantId }: HeroManagementProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [settings, setSettings] = useState<HeroSettings | null>(initialSettings)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleCreateSlide = async (data: HeroSlide) => {
    startTransition(async () => {
      try {
        setError(null)
        const newSlide = await createHeroSlide(data)
        setSlides(prev => [...prev, newSlide])
        setSuccess('Hero slide created successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create slide')
      }
    })
  }

  const handleUpdateSlide = async (id: string, data: HeroSlide) => {
    startTransition(async () => {
      try {
        setError(null)
        const updatedSlide = await updateHeroSlide(id, data)
        setSlides(prev => prev.map(slide => 
          slide.id === id ? updatedSlide : slide
        ))
        setEditingSlide(null)
        setSuccess('Hero slide updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update slide')
      }
    })
  }

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    
    startTransition(async () => {
      try {
        setError(null)
        await deleteHeroSlide(id)
        setSlides(prev => prev.filter(slide => slide.id !== id))
        setSuccess('Hero slide deleted successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete slide')
      }
    })
  }

  const handleReorderSlides = async (newOrder: HeroSlide[]) => {
    startTransition(async () => {
      try {
        setError(null)
        const slideIds = newOrder.map(slide => slide.id).filter((id): id is string => id !== undefined)
        await reorderHeroSlides(slideIds)
        setSlides(newOrder)
        setSuccess('Slides reordered successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reorder slides')
      }
    })
  }

  const handleUpdateSettings = async (data: { auto_play: boolean; auto_play_interval_ms: number }) => {
    startTransition(async () => {
      try {
        setError(null)
        const updatedSettings = await updateHeroSettings(data)
        setSettings(updatedSettings)
        setSuccess('Hero settings updated successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update settings')
      }
    })
  }

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newSlides.length) return
    
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]]
    handleReorderSlides(newSlides)
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}

      {/* Hero Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Carousel Settings</h2>
        <HeroSettingsForm 
          settings={settings}
          onUpdate={handleUpdateSettings}
          isPending={isPending}
        />
      </div>

      {/* Hero Slides */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Hero Slides</h2>
          <button
            onClick={() => setEditingSlide({} as HeroSlide)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isPending}
          >
            Add New Slide
          </button>
        </div>

        {slides.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hero slides found. Create your first slide to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <div key={slide.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => moveSlide(index, 'up')}
                        disabled={index === 0 || isPending}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === slides.length - 1 || isPending}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {slide.title || 'Untitled Slide'}
                        </span>
                        {slide.badge && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {slide.badge}
                          </span>
                        )}
                        {!slide.is_active && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {slide.subtitle} - Position: {slide.position}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingSlide(slide)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      disabled={isPending}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => slide.id && handleDeleteSlide(slide.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      disabled={isPending}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide Form Modal */}
      {editingSlide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {editingSlide.id ? 'Edit Slide' : 'Create New Slide'}
                </h3>
                <button
                  onClick={() => setEditingSlide(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <HeroSlideForm
                slide={editingSlide}
                onSubmit={editingSlide.id ? 
                  (data) => editingSlide.id && handleUpdateSlide(editingSlide.id, data) :
                  handleCreateSlide
                }
                onCancel={() => setEditingSlide(null)}
                isPending={isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




