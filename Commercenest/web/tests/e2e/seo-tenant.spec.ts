import { test, expect } from '@playwright/test'
const isCI = !!process.env.CI

test('home has canonical link', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  const link = page.locator('link[rel="canonical"]')
  await expect(link).toHaveAttribute('href', /^(https?:\/\/.*|\/)$/)
})

test.skip(isCI, 'Skip portfolio canonical in CI if backend deps missing')
test('portfolio has canonical link', async ({ page }) => {
  await page.goto('http://localhost:3000/portfolio')
  const link = page.locator('link[rel="canonical"]')
  await expect(link).toHaveAttribute('href', /\/portfolio$/)
})


