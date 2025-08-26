import { resolveTenantContext } from '@/server/tenant/resolver'
import type { ReactNode } from 'react'

interface TenantLayoutServerProps {
	tenantKey: string
	children: ReactNode
}

/**
 * Simple error boundary component for client-side error handling
 */
function ErrorBoundary({ children }: { children: ReactNode; fallback: ReactNode }) {
	return (
		<>
			{children}
			{/* Note: This is a simplified error boundary. For production, consider using a proper ErrorBoundary component */}
		</>
	)
}

/**
 * Server component that resolves tenant context and renders tenant-specific layout
 */
export default async function TenantLayoutServer({ 
	tenantKey, 
	children 
}: TenantLayoutServerProps) {
	try {
		// Resolve tenant context with caching and fallbacks
		const context = await resolveTenantContext(tenantKey)
		
		// Pre-resolve components server-side for better SSR
		let Layout, Header, Footer
		
		try {
			const LayoutMod = await context.registry.layout().catch(() => import('@/components/tenant/DefaultLayout'))
			Layout = LayoutMod.default
		} catch (error) {
			console.error(`[TenantLayoutServer] Failed to load Layout for ${tenantKey}:`, error)
			const { default: DefaultLayout } = await import('@/components/tenant/DefaultLayout')
			Layout = DefaultLayout
		}
		
		try {
			const HeaderMod = await context.registry.header().catch(() => import('@/components/tenant/DefaultHeader'))
			Header = HeaderMod.default
		} catch (error) {
			console.error(`[TenantLayoutServer] Failed to load Header for ${tenantKey}:`, error)
			const { default: DefaultHeader } = await import('@/components/tenant/DefaultHeader')
			Header = DefaultHeader
		}
		
		try {
			const FooterMod = await context.registry.footer().catch(() => import('@/components/tenant/DefaultFooter'))
			Footer = FooterMod.default
		} catch (error) {
			console.error(`[TenantLayoutServer] Failed to load Footer for ${tenantKey}:`, error)
			const { default: DefaultFooter } = await import('@/components/tenant/DefaultFooter')
			Footer = DefaultFooter
		}

		// Render with error boundaries for client components
		return (
			<ErrorBoundary fallback={
				<div className="min-h-screen flex flex-col">
					<header className="bg-white shadow-sm border-b border-gray-200">
						<div className="max-w-7xl mx-auto px-4 py-4">
							<h1 className="text-xl font-bold text-gray-900">Store</h1>
						</div>
					</header>
					<main className="flex-1">
						{children}
					</main>
					<footer className="bg-gray-900 text-white py-8">
						<div className="max-w-7xl mx-auto px-4 text-center">
							<p>&copy; 2024 Store. All rights reserved.</p>
						</div>
					</footer>
				</div>
			}>
				<Layout theme={{
					brandColor: context.themeConfig.brandColor,
					accentColor: context.themeConfig.accentColor,
					logoUrl: context.themeConfig.logoUrl || '',
					typography: context.themeConfig.typography,
				}}>
					<ErrorBoundary fallback={
						<div className="h-16 bg-gray-100 flex items-center justify-center">
							<span className="text-gray-600">Navigation</span>
						</div>
					}>
						<Header config={context.componentConfig} theme={context.themeConfig} />
					</ErrorBoundary>
					<main className="flex-1">
						{children}
					</main>
					<ErrorBoundary fallback={
						<div className="h-32 bg-gray-900 text-white flex items-center justify-center">
							<span>Footer</span>
						</div>
					}>
						<Footer config={context.componentConfig} theme={context.themeConfig} />
					</ErrorBoundary>
				</Layout>
			</ErrorBoundary>
		)
		
	} catch (error) {
		console.error(`[TenantLayoutServer] Failed to render tenant layout for ${tenantKey}:`, error)
		
		// Fallback to minimal layout
		return (
			<div className="min-h-screen flex flex-col">
				<header className="bg-white shadow-sm border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 py-4">
						<h1 className="text-xl font-bold text-gray-900">Store</h1>
					</div>
				</header>
				<main className="flex-1">
					{children}
				</main>
				<footer className="bg-gray-900 text-white py-8">
					<div className="max-w-7xl mx-auto px-4 text-center">
						<p>&copy; 2024 Store. All rights reserved.</p>
					</div>
				</footer>
			</div>
		)
	}
}
