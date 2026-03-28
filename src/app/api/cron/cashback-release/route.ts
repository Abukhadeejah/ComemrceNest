import { NextRequest, NextResponse } from 'next/server'
import { creditDueCashbackForAllCustomers } from '@/lib/cashback/cashbackService'

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production'
  }

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const batchSizeParam = request.nextUrl.searchParams.get('batchSize')
    const parsedBatchSize = Number(batchSizeParam)
    const batchSize = Number.isFinite(parsedBatchSize)
      ? Math.min(Math.max(Math.floor(parsedBatchSize), 1), 500)
      : 200

    const startedAt = Date.now()
    const result = await creditDueCashbackForAllCustomers(batchSize)
    const durationMs = Date.now() - startedAt

    return NextResponse.json({
      success: true,
      batchSize,
      delayDays: 5,
      scannedPairs: result.scannedPairs,
      creditedTransactions: result.creditedCount,
      creditedAmountCents: result.creditedAmountCents,
      durationMs,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[cron/cashback-release] Failed to process cashback release:', error)
    return NextResponse.json(
      {
        error: 'Failed to process cashback release',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
