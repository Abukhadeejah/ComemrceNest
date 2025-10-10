import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/server/auth'

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    return NextResponse.json({ userId })
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
}


