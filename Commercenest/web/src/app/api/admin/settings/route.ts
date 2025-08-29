import { NextRequest, NextResponse } from 'next/server'
import { updateSettings } from '@/app/(admin)/admin/settings/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    await updateSettings(formData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}


































