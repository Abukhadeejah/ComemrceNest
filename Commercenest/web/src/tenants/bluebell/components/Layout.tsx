import type { LayoutProps } from '@/components/tenant/contracts'

export default function Layout({ theme, children }: LayoutProps) {
	return (
		<div 
			className="min-h-screen flex flex-col bg-gray-50"
			style={{ 
				'--brand-color': theme.brandColor || '#1e40af', // Blue for Bluebell
				'--accent-color': theme.accentColor || '#d97706', // Orange for warmth
			} as React.CSSProperties}
		>
			{children}
		</div>
	)
}

