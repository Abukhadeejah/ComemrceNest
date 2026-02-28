import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdminApi, TenantAdminAuthError } from '@/server/auth'

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }
    await assertTenantAdminApi(tenantId)

    const formData = await request.formData()
    const file = formData.get('file') as unknown as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const anyFile = file as unknown as { name?: string; type?: string }
    const originalName = anyFile.name?.toString?.() || 'image'
    const contentType = anyFile.type || 'image/jpeg'

    // Generate a unique path for the uploaded file
    const objectPath = `${tenantId}/uploads/${Date.now()}_${originalName}`
    
    const upload = await supabaseAdmin.storage
      .from('product-images')
      .upload(objectPath, file as File, { upsert: true, contentType })

    if (upload.error) {
      console.error('Upload storage error:', upload.error)
      return NextResponse.json({ error: upload.error.message }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(objectPath)

    return NextResponse.json({ url: data.publicUrl, path: objectPath })
  } catch (error) {
    if (error instanceof TenantAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
