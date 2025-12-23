import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/admin/attributes/[id]/values - List attribute values
export async function GET(request: Request, { params }: RouteParams) {
	try {
		const { id: attributeId } = await params
		const tenantId = await resolveTenantIdFromRequest()

		if (!attributeId || typeof attributeId !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid attribute ID' },
				{ status: 400 }
			)
		}

		// Verify the attribute belongs to this tenant
		const { data: attribute, error: attrError } = await supabaseAdmin
			.from('attributes')
			.select('id')
			.eq('id', attributeId)
			.eq('tenant_id', tenantId)
			.maybeSingle()

		if (attrError || !attribute) {
			return NextResponse.json(
				{ error: 'Attribute not found' },
				{ status: 404 }
			)
		}

		// Get all values for this attribute
		const { data: values, error } = await supabaseAdmin
			.from('attribute_values')
			.select('id, value, created_at, updated_at')
			.eq('attribute_id', attributeId)
			.eq('tenant_id', tenantId)
			.order('value', { ascending: true })

		if (error) {
			console.error('GET /api/admin/attributes/[id]/values error', error)
			return NextResponse.json(
				{ error: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json({ data: values }, { status: 200 })
	} catch (err: unknown) {
		console.error('GET /api/admin/attributes/[id]/values unexpected error', err)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// POST /api/admin/attributes/[id]/values - Create a new attribute value
export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { id: attributeId } = await params
		const tenantId = await resolveTenantIdFromRequest()
		const body = await request.json()

		if (!attributeId || typeof attributeId !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid attribute ID' },
				{ status: 400 }
			)
		}

		const rawValue = body?.value
		const value = typeof rawValue === 'string' ? rawValue.trim() : ''

		if (!value) {
			return NextResponse.json(
				{ error: 'Value is required' },
				{ status: 400 }
			)
		}

		// Verify the attribute belongs to this tenant
		const { data: attribute, error: attrError } = await supabaseAdmin
			.from('attributes')
			.select('id')
			.eq('id', attributeId)
			.eq('tenant_id', tenantId)
			.maybeSingle()

		if (attrError || !attribute) {
			return NextResponse.json(
				{ error: 'Attribute not found' },
				{ status: 404 }
			)
		}

		// Create the attribute value
		const { data: newValue, error } = await supabaseAdmin
			.from('attribute_values')
			.insert({
				tenant_id: tenantId,
				attribute_id: attributeId,
				value,
			})
			.select('id, value, created_at, updated_at')
			.single()

		if (error) {
			console.error('POST /api/admin/attributes/[id]/values error', error)
			// Check for unique constraint violation
			if (error.code === '23505') {
				return NextResponse.json(
					{ error: 'This value already exists for this attribute' },
					{ status: 409 }
				)
			}
			return NextResponse.json(
				{ error: error.message },
				{ status: 500 }
			)
		}

		return NextResponse.json({ data: newValue }, { status: 201 })
	} catch (err: unknown) {
		console.error('POST /api/admin/attributes/[id]/values unexpected error', err)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
