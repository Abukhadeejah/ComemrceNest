import { test, expect } from '@playwright/test';

// Base URL from environment or default
const BASE = process.env.E2E_BASE_URL || process.env.STAGING_BASE_URL || 'http://localhost:3000';

// Admin credentials from environment
const ADMIN_EMAIL = process.env.STAGING_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.STAGING_ADMIN_PASSWORD;

// Skip all admin tests if credentials are missing
test.describe(
  'Admin Area Tests (requires credentials)',
  () => {
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing admin credentials in environment');
    // Login before each test
    test.beforeEach(async ({ page }) => {
      // Go to login page
      await page.goto(`${BASE}/login`);
      
      // Fill login form
      await page.fill('input[type="email"]', ADMIN_EMAIL!);
      await page.fill('input[type="password"]', ADMIN_PASSWORD!);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for redirect to admin dashboard
      await page.waitForURL(`${BASE}/bluebell/admin**`);
      
      // Verify we're logged in by checking for dashboard elements
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });
    
    test('Admin dashboard loads correctly', async ({ page }) => {
      // Go directly to admin dashboard
      await page.goto(`${BASE}/bluebell/admin`);
      
      // Verify dashboard elements
      await expect(page).toHaveTitle(/Admin|Dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Check for common admin navigation elements
      const hasNavigation = await page.$('nav') || await page.$('aside');
      expect(hasNavigation).toBeTruthy();
      
      // Check for expected dashboard sections or cards
      const hasCards = await page.$('.card') || 
                      await page.$('[class*="card"]') || 
                      await page.$('section');
      expect(hasCards).toBeTruthy();
    });
    
    test('Products admin page loads correctly', async ({ page }) => {
      // Go to products admin page
      await page.goto(`${BASE}/bluebell/admin/products`);
      
      // Verify products page elements
      await expect(page).toHaveTitle(/Products|Admin/);
      
      // Check for products table or list
      const hasProductsList = await page.$('table') || 
                             await page.$('ul') || 
                             await page.$('[role="grid"]');
      expect(hasProductsList).toBeTruthy();
      
      // Verify we see product-related text
      await expect(page.locator('text=/Products|Items|Inventory/')).toBeVisible();
      
      // Verify add/new product button exists but don't click it
      const hasAddButton = await page.$('button:has-text("Add")') || 
                          await page.$('button:has-text("New")') ||
                          await page.$('a:has-text("Add")') ||
                          await page.$('a:has-text("New")');
      expect(hasAddButton).toBeTruthy();
    });
    
    test('Categories admin page loads correctly', async ({ page }) => {
      // Go to categories admin page
      await page.goto(`${BASE}/bluebell/admin/categories`);
      
      // Verify categories page elements
      await expect(page).toHaveTitle(/Categories|Admin/);
      
      // Check for categories table or list
      const hasCategoriesList = await page.$('table') || 
                               await page.$('ul') || 
                               await page.$('[role="grid"]');
      expect(hasCategoriesList).toBeTruthy();
      
      // Verify we see category-related text
      await expect(page.locator('text=/Categories|Category/')).toBeVisible();
      
      // Verify add/new category button exists but don't click it
      const hasAddButton = await page.$('button:has-text("Add")') || 
                          await page.$('button:has-text("New")') ||
                          await page.$('a:has-text("Add")') ||
                          await page.$('a:has-text("New")');
      expect(hasAddButton).toBeTruthy();
    });
  }
);
