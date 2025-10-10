// Badge utility functions for product display

export interface ProductBadge {
  text: string
  className: string
  priority: number
  icon?: string
}

export interface BadgeConfig {
  is_featured?: boolean | null
  is_bestseller?: boolean | null
  is_new_arrival?: boolean | null
  is_on_sale?: boolean | null
  is_limited_edition?: boolean | null
  is_sold_out?: boolean | null
  custom_badge_text?: string | null
  badge_color?: string | null
  badge_priority?: number | null
  badge_display_until?: string | null
  badge_display_from?: string | null
  // Legacy fields for backward compatibility
  compare_at_price_cents?: number | null
  price_cents?: number
  stock?: number
  low_stock_threshold?: number | null
}

export function generateProductBadges(config: BadgeConfig): ProductBadge[] {
  const badges: ProductBadge[] = []
  const now = new Date()

  // Check if badge should be displayed based on scheduling
  const isBadgeActive = (displayFrom?: string | null, displayUntil?: string | null) => {
    if (displayFrom && new Date(displayFrom) > now) return false
    if (displayUntil && new Date(displayUntil) < now) return false
    return true
  }

  // Custom badge (highest priority)
  if (config.custom_badge_text && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: config.custom_badge_text,
      className: `text-white`,
      priority: config.badge_priority ?? 0,
      icon: '🎯'
    })
  }

  // Featured badge
  if (config.is_featured && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: 'Featured',
      className: 'bg-blue-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '⭐'
    })
  }

  // Bestseller badge
  if (config.is_bestseller && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: 'Bestseller',
      className: 'bg-amber-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '🏆'
    })
  }

  // New arrival badge
  if (config.is_new_arrival && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: 'New Arrival',
      className: 'bg-green-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '✨'
    })
  }

  // On sale badge (check for discount)
  const hasDiscount = config.compare_at_price_cents && config.price_cents && 
    config.compare_at_price_cents > config.price_cents
  const discountPercentage = hasDiscount 
    ? Math.round(((config.compare_at_price_cents! - config.price_cents!) / config.compare_at_price_cents!) * 100)
    : 0

  if ((config.is_on_sale || hasDiscount) && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: hasDiscount ? `-${discountPercentage}% OFF` : 'On Sale',
      className: 'bg-red-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '🔥'
    })
  }

  // Limited edition badge
  if (config.is_limited_edition && isBadgeActive(config.badge_display_from, config.badge_display_until)) {
    badges.push({
      text: 'Limited Edition',
      className: 'bg-purple-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '💎'
    })
  }

  // Sold out badge
  if (config.is_sold_out || config.stock === 0) {
    badges.push({
      text: 'Sold Out',
      className: 'bg-gray-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '❌'
    })
  }

  // Low stock badge (only if not sold out)
  if (config.stock && config.stock > 0 && config.low_stock_threshold && 
      config.stock <= config.low_stock_threshold && !config.is_sold_out) {
    badges.push({
      text: 'Low Stock',
      className: 'bg-orange-500 text-white',
      priority: config.badge_priority ?? 0,
      icon: '⚠️'
    })
  }

  // Sort badges by priority (lower number = higher priority)
  return badges.sort((a, b) => a.priority - b.priority)
}

export function getBadgeClassName(badge: ProductBadge, customColor?: string | null): string {
  if (customColor && badge.className.includes('text-white')) {
    return `text-white`
  }
  return badge.className
}

export function getBadgeStyle(badge: ProductBadge, customColor?: string | null): React.CSSProperties {
  if (customColor && badge.className.includes('text-white')) {
    return { backgroundColor: customColor }
  }
  return {}
}
