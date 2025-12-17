export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  image_url?: string
  image_alt?: string
  count?: number
}

export interface CategoryTree {
  id: string
  name: string
  slug: string
  children?: CategoryTree[]
  count?: number
}

/**
 * Build hierarchical category tree from flat array
 */
export function buildCategoryTree(categories: Category[]): CategoryTree[] {
  const categoryMap = new Map<string, CategoryTree>()
  const rootCategories: CategoryTree[] = []

  // Create tree nodes
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      children: [],
      count: cat.count || 0
    })
  })

  // Build hierarchy
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)
    if (!node) return

    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id)
      if (parent && parent.children) {
        parent.children.push(node)
      }
    } else {
      rootCategories.push(node)
    }
  })

  return rootCategories
}

/**
 * Filter out test categories (consistent with Header logic)
 */
export function filterTestCategories(categories: Category[]): Category[] {
  return categories.filter(cat => 
    !cat.name.toLowerCase().includes('test') &&
    cat.name !== 'Test' &&
    cat.name !== 'Test Category - Regression Testing'
  )
}

/**
 * Get all category slugs in a tree (including children)
 */
export function getAllCategorySlugs(categoryTree: CategoryTree[]): string[] {
  const slugs: string[] = []
  
  function traverse(categories: CategoryTree[]) {
    categories.forEach(cat => {
      slugs.push(cat.slug)
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children)
      }
    })
  }
  
  traverse(categoryTree)
  return slugs
}

/**
 * Find category by slug in tree
 */
export function findCategoryBySlug(categoryTree: CategoryTree[], slug: string): CategoryTree | null {
  for (const cat of categoryTree) {
    if (cat.slug === slug) {
      return cat
    }
    if (cat.children && cat.children.length > 0) {
      const found = findCategoryBySlug(cat.children, slug)
      if (found) return found
    }
  }
  return null
}