import { test, expect } from '@playwright/test'

test.describe('Quantify — smoke tests', () => {
  test('landing page renders with services', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Quantify/i)
    // Landing should mention engineering/orçamento somewhere
    const body = page.locator('body')
    await expect(body).toContainText(/engenharia|orçamento|quantify/i)
  })

  test('login page renders with email + password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    // Signup adds a name field
    await expect(page.locator('input[type="text"], input[name*="name" i]').first()).toBeVisible()
  })

  test('protected admin route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin')
    // Wait for redirect (RouteGuards fires client-side)
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|$)/)
  })

  test('protected client app route redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/app')
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|$)/)
  })
})
