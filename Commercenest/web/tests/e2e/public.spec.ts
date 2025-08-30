import { test, expect } from '@playwright/test';

// Base URL from environment or default
const BASE = process.env.E2E_BASE_URL || process.env.STAGING_BASE_URL || 'http://localhost:3000';

/**
 * Helper to verify CSS variables are defined
 */
async function assertCssVars(page) {
  // Check that primary brand colors are defined
  const cssVars = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      primary: styles.getPropertyValue('--color-primary'),
      brown: styles.getPropertyValue('--color-brown'),
      crimson: styles.getPropertyValue('--color-crimson'),
      mustard: styles.getPropertyValue('--color-mustard'),
    };
  });
  
  // Verify at least some CSS vars are defined
  expect(Object.values(cssVars).some(val => val && val.trim() !== '')).toBeTruthy();
}

/**
 * Helper to verify images are loaded
 */
async function expectImagesToLoad(page) {
  // Wait for at least one image to be loaded
  await page.waitForSelector('img', { state: 'visible', timeout: 10000 });
  
  // Check that images are actually loaded (naturalWidth > 0)
  const loadedImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => img.complete && img.naturalWidth > 0).length;
  });
  
  expect(loadedImages).toBeGreaterThan(0);
}

/**
 * Helper to click an element if it exists
 */
async function clickIfExists(page, selector) {
  const exists = await page.$(selector);
  if (exists) {
    await page.click(selector);
    return true;
  }
  return false;
}

test.describe('Bluebell Public Pages', () => {
  test('Home page loads with all elements', async ({ page }) => {
    await page.goto(`${BASE}/bluebell`);
    
    // Verify title
    await expect(page).toHaveTitle(/Bluebell/);
    
    // Check header and footer
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Check CSS variables
    await assertCssVars(page);
    
    // Check images load
    await expectImagesToLoad(page);
    
    // Try clicking primary CTA or navigation
    const clicked = await clickIfExists(page, 'a[href="#products"]') || 
                    await clickIfExists(page, 'a:has-text("Explore Collection")') ||
                    await clickIfExists(page, 'a:has-text("Browse Catalog")');
    
    // If we clicked something, wait for navigation or content update
    if (clicked) {
      await page.waitForTimeout(500); // Allow time for scroll or content update
    }
  });
  
  test('Products page shows listings and navigates to PDP', async ({ page }) => {
    await page.goto(`${BASE}/bluebell/products`);
    
    // Verify title and heading
    await expect(page).toHaveTitle(/Fabrics|Bluebell/);
    
    // Check for products heading
    const hasHeading = await page.$('h1:has-text("Featured Fabrics")') || 
                       await page.$('text="Fabrics"');
    expect(hasHeading).toBeTruthy();
    
    // Check for product cards
    const productCards = await page.$$('.product-card, a[href*="/products/"]');
    expect(productCards.length).toBeGreaterThan(0);
    
    // Click first View Details link
    const viewDetailsLink = await page.$('a:has-text("View Details")');
    expect(viewDetailsLink).toBeTruthy();
    
    if (viewDetailsLink) {
      await viewDetailsLink.click();
      
      // Verify we landed on a PDP
      await expect(page).toHaveURL(/\/bluebell\/products\/.+/);
      
      // Check for product details
      await expect(page.locator('text=/per metre/')).toBeVisible();
      
      // Verify product image loads
      await expectImagesToLoad(page);
    }
  });
});

test.describe('Senlysh Public Pages', () => {
  test('Home page loads with all elements', async ({ page }) => {
    await page.goto(`${BASE}/senlysh`);
    
    // Verify title
    await expect(page).toHaveTitle(/Senlysh/);
    
    // Check header and footer
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // Check CSS variables
    await assertCssVars(page);
    
    // Check images load
    await expectImagesToLoad(page);
    
    // Try clicking primary CTA if it exists
    await clickIfExists(page, 'a:has-text("Shop Now")') ||
    await clickIfExists(page, 'a:has-text("Explore Now")');
  });
  
  test('Products page shows listings and navigates to PDP', async ({ page }) => {
    await page.goto(`${BASE}/senlysh/products`);
    
    // Verify title
    await expect(page).toHaveTitle(/Shop|Senlysh/);
    
    // Check for product cards
    const productCards = await page.$$('a[href*="/products/"]');
    expect(productCards.length).toBeGreaterThan(0);
    
    // Click first product link
    if (productCards.length > 0) {
      await productCards[0].click();
      
      // Verify we landed on a PDP
      await expect(page).toHaveURL(/\/products\/.+/);
      
      // Verify product image loads
      await expectImagesToLoad(page);
      
      // Check for product details
      const hasPrice = await page.$('text=/₹/');
      expect(hasPrice).toBeTruthy();
    }
  });
});
