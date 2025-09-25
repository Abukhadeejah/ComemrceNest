import { NextResponse } from 'next/server'
import { updatePaymentSettings } from '@/app/(admin)/admin/settings/payments-actions'

export async function POST(request: Request) {
  const formData = await request.formData()
  try {
    const res = await updatePaymentSettings(formData)
    return NextResponse.json(res)
  } catch (e: unknown) {
    console.error('updatePaymentSettings failed', e)
    return NextResponse.json({ error: 'failed' }, { status: 400 })
  }
}


