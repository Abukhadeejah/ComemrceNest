import { z } from 'zod'

export const NavItemSchema = z.object({
	label: z.string().min(1),
	href: z.string().min(1),
	children: z.array(z.object({
		label: z.string().min(1),
		href: z.string().min(1),
	})).optional(),
})

export const ComponentConfigV1 = z.object({
	headerPreset: z.enum(['base', 'compact', 'mega']).default('base'),
	showAnnouncement: z.boolean().default(false),
	nav: z.array(NavItemSchema).default([]),
})

export const ThemeConfigV1 = z.object({
	brandColor: z.string().default('#111827'), // gray-900
	accentColor: z.string().default('#2563eb'), // blue-600
	logoUrl: z.string().url().optional(),
	typography: z.object({
		baseFont: z.string().default('Inter'),
	}).default({ baseFont: 'Inter' }),
})

// A thin wrapper that ensures defaults are applied
export function parseComponentConfig(input: unknown) {
	const result = ComponentConfigV1.safeParse(input ?? {})
	return result.success ? result.data : ComponentConfigV1.parse({})
}

export function parseThemeConfig(input: unknown) {
	const result = ThemeConfigV1.safeParse(input ?? {})
	return result.success ? result.data : ThemeConfigV1.parse({})
}

// Export types for use in components
export type ComponentConfig = z.infer<typeof ComponentConfigV1>
export type ThemeConfig = z.infer<typeof ThemeConfigV1>
export type NavItem = z.infer<typeof NavItemSchema>

