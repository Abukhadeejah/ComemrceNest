import { test, expect } from '@playwright/test'

test('home has canonical link', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  const link = page.locator('link[rel="canonical"]')
  await expect(link).toHaveAttribute('href', /^(https?:\/\/.*|\/)$/)
})

test('portfolio has canonical link', async ({ page }) => {
  await page.goto('http://localhost:3000/portfolio')
  const link = page.locator('link[rel="canonical"]')
  await expect(link).toHaveAttribute('href', /\/portfolio$/)
})


