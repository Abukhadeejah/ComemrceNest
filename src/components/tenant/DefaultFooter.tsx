import type { FooterProps } from './contracts'

export default function DefaultFooter({ config }: FooterProps) {
	return (
		<footer className="bg-gray-900 text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div>
						<h3 className="text-lg font-semibold mb-4">CommerceNest Store</h3>
						<p className="text-gray-300">Your trusted e-commerce platform.</p>
					</div>
					<div>
						<h4 className="text-md font-semibold mb-4">Quick Links</h4>
						<ul className="space-y-2">
							{config.nav?.slice(0, 4).map((item) => (
								<li key={item.href}>
									<a href={item.href} className="text-gray-300 hover:text-white">
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</div>
					<div>
						<h4 className="text-md font-semibold mb-4">Contact Info</h4>
						<p className="text-gray-300">Email: support@commercenest.com</p>
						<p className="text-gray-300">Phone: +91 98765 43210</p>
					</div>
				</div>
				<div className="border-t border-gray-700 mt-8 pt-8 text-center">
					<p className="text-gray-300">&copy; 2024 CommerceNest. All rights reserved.</p>
				</div>
			</div>
		</footer>
	)
}

