/**
 * Playwright fixture: `authenticatedPage`.
 *
 * Faz login via `/login` com as creds de E2E e espera o redirect para `/admin`.
 * Rotas que requerem admin usam esse fixture em vez de `page` cru.
 *
 * Env obrigatórios:
 * - `E2E_ADMIN_EMAIL`
 * - `E2E_ADMIN_PASSWORD`
 *
 * Se algum estiver faltando, o teste é marcado como `skip` — o objetivo é
 * não quebrar forks/CI sem secrets, mas deixar claro o que faltou.
 */
import { test as base, expect, type Page } from '@playwright/test'

type E2EFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<E2EFixtures>({
  // eslint-disable-next-line no-empty-pattern
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.E2E_ADMIN_EMAIL
    const password = process.env.E2E_ADMIN_PASSWORD
    test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set')

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(email!)
    await page.locator('input[type="password"]').fill(password!)
    await page.locator('button[type="submit"]').click()
    // RouteGuards redireciona admin pra /admin; user comum pra /app.
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 15_000 })
    await use(page)
  },
})

export { expect }
