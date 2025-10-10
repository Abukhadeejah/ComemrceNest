export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  image_url?: string | null
  image_alt?: string | null
  created_at: string
  children?: Category[]
}

/**
 * Build a hierarchical tree from flat category array
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []

  // First pass: create map and initialize children arrays
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // Second pass: build tree structure
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children!.push(categoryWithChildren)
      } else {
        // Parent not found, treat as root
        rootCategories.push(categoryWithChildren)
      }
    } else {
      rootCategories.push(categoryWithChildren)
    }
  })

  return rootCategories
}

/**
 * Flatten category tree into options with indentation for display
 */
export function flattenCategoryTreeForSelect(categories: Category[], level = 0): Array<{ id: string; name: string; level: number }> {
  const options: Array<{ id: string; name: string; level: number }> = []
  
  categories.forEach(category => {
    const indent = '  '.repeat(level) // 2 spaces per level
    const displayName = level > 0 ? `${indent}└─ ${category.name}` : category.name
    
    options.push({
      id: category.id,
      name: displayName,
      level
    })
    
    if (category.children && category.children.length > 0) {
      options.push(...flattenCategoryTreeForSelect(category.children, level + 1))
    }
  })
  
  return options
}

/**
 * Get category path (breadcrumb) from root to given category
 */
export function getCategoryPath(categoryId: string, categories: Category[]): string[] {
  const categoryMap = new Map<string, Category>()
  categories.forEach(cat => categoryMap.set(cat.id, cat))
  
  const path: string[] = []
  let currentId: string | null = categoryId
  
  while (currentId) {
    const category = categoryMap.get(currentId)
    if (!category) break
    
    path.unshift(category.name)
    currentId = category.parent_id
  }
  
  return path
}

/**
 * Check if category has any children (recursive)
 */
export function hasChildren(category: Category): boolean {
  return !!(category.children && category.children.length > 0)
}

/**
 * Get all descendant category IDs
 */
export function getDescendantIds(category: Category): string[] {
  const ids: string[] = []
  
  if (category.children) {
    category.children.forEach(child => {
      ids.push(child.id)
      ids.push(...getDescendantIds(child))
    })
  }
  
  return ids
}

/**
 * Validate category hierarchy depth (for performance)
 */
export function validateCategoryDepth(categories: Category[], maxDepth = 5): { valid: boolean; maxFoundDepth: number; issues: string[] } {
  const issues: string[] = []
  let maxFoundDepth = 0
  
  function checkDepth(category: Category, currentDepth: number, path: string[]): number {
    if (currentDepth > maxFoundDepth) {
      maxFoundDepth = currentDepth
    }
    
    if (currentDepth > maxDepth) {
      issues.push(`Category "${category.name}" exceeds max depth (${maxDepth}) at level ${currentDepth}. Path: ${path.join(' > ')}`)
    }
    
    let deepestChild = currentDepth
    if (category.children) {
      category.children.forEach(child => {
        const childDepth = checkDepth(child, currentDepth + 1, [...path, child.name])
        if (childDepth > deepestChild) {
          deepestChild = childDepth
        }
      })
    }
    
    return deepestChild
  }
  
  const tree = buildCategoryTree(categories)
  tree.forEach(rootCategory => {
    checkDepth(rootCategory, 1, [rootCategory.name])
  })
  
  return {
    valid: issues.length === 0,
    maxFoundDepth,
    issues
  }
}

