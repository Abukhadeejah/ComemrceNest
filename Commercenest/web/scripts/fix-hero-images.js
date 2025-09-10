// Script to fix hero_image_url for products that have images
// Run this script to update hero_image_url for products with existing images

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixHeroImages() {
  try {
    console.log('🔍 Finding products with images but no hero_image_url...')
    
    // Get products that have images but no hero_image_url
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        hero_image_url,
        product_images!inner(
          id,
          url,
          sort_order
        )
      `)
      .is('hero_image_url', null)
      .not('product_images.url', 'is', null)
      .neq('product_images.url', '[]')

    if (productsError) {
      throw productsError
    }

    console.log(`📦 Found ${products.length} products to fix`)

    for (const product of products) {
      // Get the first image (sorted by sort_order, then by id for consistency)
      const firstImage = product.product_images
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order
          }
          return a.id.localeCompare(b.id)
        })[0]

      if (firstImage && firstImage.url) {
        console.log(`🖼️  Updating ${product.name} with image: ${firstImage.url}`)
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ hero_image_url: firstImage.url })
          .eq('id', product.id)

        if (updateError) {
          console.error(`❌ Failed to update ${product.name}:`, updateError.message)
        } else {
          console.log(`✅ Updated ${product.name}`)
        }
      }
    }

    console.log('🎉 Hero image fix completed!')
  } catch (error) {
    console.error('❌ Error fixing hero images:', error.message)
    process.exit(1)
  }
}

fixHeroImages()
