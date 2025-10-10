import { NextRequest, NextResponse } from 'next/server'
import { updateSettings } from '@/app/(admin)/admin/settings/actions'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    await updateSettings(formData)
    
    // Redirect to the admin dashboard with success message
    const referer = request.headers.get('referer') || request.url
    return NextResponse.redirect(new URL(referer + '?success=settings-updated'))
  } catch (error) {
    console.error('Settings update error:', error)
    // Redirect with error message
    const referer = request.headers.get('referer') || request.url
    return NextResponse.redirect(new URL(referer + '?error=settings-failed'))
  }
}







































