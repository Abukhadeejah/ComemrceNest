import { NextRequest, NextResponse } from 'next/server'

// Wallet withdrawals are disabled - cashback can only be used for shopping
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Wallet withdrawals are not available',
      message: 'Your wallet balance can only be used for shopping on our platform. This ensures you get the best value from your cashback rewards!'
    },
    { status: 403 }
  )
}