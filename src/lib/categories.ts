// Shared Category Utilities
export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
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

  // First pass: create all category nodes
  categories.forEach(category => {
    categoryMap.set(category.id, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      children: [],
      count: category.count
    })
  })

  // Second pass: build hierarchy
  categories.forEach(category => {
    const categoryNode = categoryMap.get(category.id)
    if (!categoryNode) return

    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(categoryNode)
      } else {
        // Parent not found, treat as root
        rootCategories.push(categoryNode)
      }
    } else {
      // Root category
      rootCategories.push(categoryNode)
    }
  })

  return rootCategories
}

/**
 * Filter out test categories
 */
export function filterTestCategories(categories: Category[]): Category[] {
  return categories.filter(cat => 
    !cat.name.toLowerCase().includes('test') &&
    cat.name !== 'Test' &&
    cat.name !== 'Test Category - Regression Testing'
  )
}

/**
 * Get all category slugs from tree (flattened)
 */
export function getAllCategorySlugs(categoryTree: CategoryTree[]): string[] {
  const slugs: string[] = []
  
  function traverse(categories: CategoryTree[]) {
    categories.forEach(category => {
      slugs.push(category.slug)
      if (category.children && category.children.length > 0) {
        traverse(category.children)
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
  for (const category of categoryTree) {
    if (category.slug === slug) {
      return category
    }
    if (category.children && category.children.length > 0) {
      const found = findCategoryBySlug(category.children, slug)
      if (found) return found
    }
  }
  return null
}

/**
 * Get category names by slugs
 */
export function getCategoryNamesBySlugs(categoryTree: CategoryTree[], slugs: string[]): string[] {
  const names: string[] = []
  
  slugs.forEach(slug => {
    const category = findCategoryBySlug(categoryTree, slug)
    if (category) {
      names.push(category.name)
    }
  })
  
  return names
}