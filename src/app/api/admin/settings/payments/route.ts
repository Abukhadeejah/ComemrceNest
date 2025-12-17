import { NextResponse } from 'next/server'
import { updatePaymentSettings } from '@/app/(admin)/admin/settings/payments-actions'

export async function POST(request: Request) {
  const formData = await request.formData()
  try {
    await updatePaymentSettings(formData)
    // Redirect to the admin dashboard with success message
    const url = new URL(request.url)
    const referer = request.headers.get('referer') || url.origin
    return NextResponse.redirect(new URL(referer + '?success=payment-settings-updated'))
  } catch (e: unknown) {
    console.error('updatePaymentSettings failed', e)
    // Redirect with error message
    const url = new URL(request.url)
    const referer = request.headers.get('referer') || url.origin
    return NextResponse.redirect(new URL(referer + '?error=payment-settings-failed'))
  }
}


