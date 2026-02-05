import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'PATCH method is working',
      received: body
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process PATCH request',
      details: (error as Error)?.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test route is working. Use PATCH method to test PATCH functionality.'
  })
}