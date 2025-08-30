import { NextResponse } from 'next/server'
import { exportProducts } from '@/app/(admin)/admin/products/actions'

export async function POST() {
  try {
    const csvContent = await exportProducts()
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export failed:', error)
    return NextResponse.json(
      { error: 'Failed to export products' },
      { status: 500 }
    )
  }
}
