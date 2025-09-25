import { test, expect } from '@playwright/test'
const isCI = !!process.env.CI

test.skip(isCI, 'Skip health resolution check in CI (no Supabase env)')
test('health resolves tenant on localhost', async ({ page }) => {
  const res = await page.request.get('/api/health')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.host).toBe('localhost')
  expect(body.tenantResolved).toBe(true)
  expect(body.tenantId).toBeTruthy()
})

test('home and portfolio render', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.hero-title')).toBeVisible()
  await page.goto('/portfolio')
  await expect(page.locator('h1', { hasText: 'Portfolio' })).toBeVisible()
})


