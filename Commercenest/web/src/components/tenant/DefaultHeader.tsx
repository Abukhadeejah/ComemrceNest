import type { HeaderProps } from './contracts'

export default function DefaultHeader({ config, theme }: HeaderProps) {
	return (
		<header className="bg-white shadow-sm border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center">
						<h1 className="text-xl font-bold" style={{ color: theme?.brandColor || '#111827' }}>
							CommerceNest Store
						</h1>
					</div>
					<nav className="hidden md:flex space-x-8">
						{config.nav?.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="text-gray-700 hover:text-blue-900"
							>
								{item.label}
							</a>
						))}
					</nav>
				</div>
			</div>
		</header>
	)
}

