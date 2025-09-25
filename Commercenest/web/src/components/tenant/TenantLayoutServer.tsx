import { resolveTenantContext } from '@/server/tenant/resolver'
import type { ReactNode } from 'react'
import Link from 'next/link'

interface TenantLayoutServerProps {
	tenantKey?: string
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
 * For root routes (undefined tenantKey), renders platform-level layout
 */
export default async function TenantLayoutServer({ 
	tenantKey, 
	children 
}: TenantLayoutServerProps) {
	// For root routes (undefined tenantKey), render platform-level layout
	if (!tenantKey) {
		return (
			<div className="min-h-screen flex flex-col">
				<header className="bg-white shadow-sm border-b border-gray-200">
					<div className="max-w-7xl mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<h1 className="text-xl font-bold text-gray-900">CommerceNest</h1>
							<nav className="flex space-x-6">
								<Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
								<Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
								<Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
								<Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
							</nav>
						</div>
					</div>
				</header>
				<main className="flex-1">
					{children}
				</main>
				<footer className="bg-gray-900 text-white py-8">
					<div className="max-w-7xl mx-auto px-4">
						<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
							<div>
								<h3 className="text-lg font-semibold mb-4">CommerceNest</h3>
								<p className="text-gray-300">Multi-tenant e-commerce platform</p>
							</div>
							<div>
								<h4 className="font-semibold mb-4">Platform</h4>
								<ul className="space-y-2 text-gray-300">
									<li><Link href="/senlysh" className="hover:text-white">Senlysh Fashion</Link></li>
									<li><Link href="/bluebell" className="hover:text-white">Bluebell Interiors</Link></li>
								</ul>
							</div>
							<div>
								<h4 className="font-semibold mb-4">Support</h4>
								<ul className="space-y-2 text-gray-300">
									<li><Link href="/help" className="hover:text-white">Help Center</Link></li>
									<li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
								</ul>
							</div>
							<div>
								<h4 className="font-semibold mb-4">Legal</h4>
								<ul className="space-y-2 text-gray-300">
									<li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
									<li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
								</ul>
							</div>
						</div>
						<div className="border-t border-gray-800 mt-8 pt-8 text-center">
							<p>&copy; 2024 CommerceNest. All rights reserved.</p>
						</div>
					</div>
				</footer>
			</div>
		)
	}

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
		
		// Fallback to basic layout
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
