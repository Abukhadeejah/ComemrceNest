import type { ReactNode } from 'react'

export type NavItem = Readonly<{
	label: string
	href: string
	children?: ReadonlyArray<Readonly<{ label: string; href: string }>>
}>

export type ThemeConfig = Readonly<{
	brandColor?: string
	accentColor?: string
	logoUrl?: string
	typography?: Readonly<{
		baseFont?: string
	}>
}>

export type ComponentConfig = Readonly<{
	headerPreset?: 'base' | 'compact' | 'mega'
	showAnnouncement?: boolean
	nav?: ReadonlyArray<NavItem>
}>

export type HeaderProps = Readonly<{
	config: ComponentConfig
	theme?: ThemeConfig
	customNavItems?: ReadonlyArray<NavItem>
	customActions?: ReactNode
	showSearch?: boolean
	showCart?: boolean
	showPortfolio?: boolean
}>

export type FooterProps = Readonly<{
	config: ComponentConfig
	theme?: ThemeConfig
}>

export type LayoutProps = Readonly<{
	theme: Required<ThemeConfig> // after zod normalization, theme becomes required in runtime props
	children: ReactNode
}>
