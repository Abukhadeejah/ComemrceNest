import type { LayoutProps } from '@/components/tenant/contracts'

export default function Layout({ theme, children }: LayoutProps) {
	return (
		<div 
			className="min-h-screen flex flex-col bg-white"
			style={{ 
				'--brand-color': theme.brandColor || '#06b6d4', // Cyan for Senlysh
				'--accent-color': theme.accentColor || '#f59e0b', // Amber for fashion
			} as React.CSSProperties}
		>
			{children}
		</div>
	)
}

