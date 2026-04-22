import { test, expect } from '@playwright/test'

/**
 * Fase 2F — E2E: garante que todas as rotas admin (SINAPI, orçamentos, curva ABC,
 * revisão, memorial) exigem autenticação. Sem auth, o RouteGuards do client
 * deve redirecionar para /login.
 *
 * Roda sem seed de dados — testa só os gates e o comportamento público.
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/sinapi/import',
  '/admin/orcamentos',
  '/admin/projetos',
  '/admin/composicoes',
  '/admin/validacoes',
  '/admin/kanban',
]

test.describe('Fase 2F — rotas admin protegidas', () => {
  for (const path of ADMIN_ROUTES) {
    test(`${path} redireciona para /login quando não autenticado`, async ({ page }) => {
      await page.goto(path)
      await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
      expect(page.url()).toMatch(/\/(login|$)/)
    })
  }
})

test.describe('Fase 2F — página de login é funcional', () => {
  test('botão "Entrar" existe e está habilitado', async ({ page }) => {
    await page.goto('/login')
    const submit = page.locator('button[type="submit"]').first()
    await expect(submit).toBeVisible()
    await expect(submit).toBeEnabled()
  })

  test('formulário de login rejeita submissão vazia (HTML5 required)', async ({ page }) => {
    await page.goto('/login')
    const email = page.locator('input[type="email"]')
    // Campo de email deve ter "required" (validação HTML5)
    await expect(email).toHaveAttribute('required', '')
  })
})

test.describe('Fase 2F — landing mostra propostas de valor', () => {
  test('landing contém seção de serviços / engenharia', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('body')
    // Termos-chave do domínio (engenharia de orçamento B2B)
    await expect(body).toContainText(/engenharia|orçamento|SINAPI|projeto/i)
  })
})

test.describe('Fase 2F — API PDF gate', () => {
  test('GET /api/budgets/:id/pdf não retorna 200 sem dados válidos', async ({ request }) => {
    const res = await request.get('/api/budgets/00000000-0000-0000-0000-000000000000/pdf')
    // Sem budget válido: deve ser erro (qualquer 4xx/5xx). Não pode ser 200.
    expect(res.status()).not.toBe(200)
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})
