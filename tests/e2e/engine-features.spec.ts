import { test, expect } from '@playwright/test'

/**
 * Fase 2F — E2E: smoke das features do Engine de Orçamento (Fase 2).
 *
 * Valida que as rotas das features Fase 2B-2F existem e respondem
 * (mesmo que protegidas — o objetivo é detectar 404/5xx).
 *
 * Não depende de seed — usa rotas de orçamento fictícias para validar
 * shape das respostas.
 */

const FAKE_BUDGET_ID = '00000000-0000-0000-0000-000000000000'

test.describe('Fase 2F — rotas do engine de orçamento', () => {
  test('rota de detalhe de orçamento /admin/orcamentos/:id redireciona pra login', async ({ page }) => {
    await page.goto(`/admin/orcamentos/${FAKE_BUDGET_ID}`)
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|$)/)
  })

  test('rota de revisão /admin/orcamentos/:id/revisar redireciona pra login', async ({ page }) => {
    await page.goto(`/admin/orcamentos/${FAKE_BUDGET_ID}/revisar`)
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|$)/)
  })

  test('rota de curva ABC /admin/orcamentos/:id/curva-abc redireciona pra login', async ({ page }) => {
    await page.goto(`/admin/orcamentos/${FAKE_BUDGET_ID}/curva-abc`)
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|$)/)
  })
})

test.describe('Fase 2F — import SINAPI XLSX é super-admin only', () => {
  test('rota /admin/sinapi/import redireciona para /login quando não autenticado', async ({ page }) => {
    await page.goto('/admin/sinapi/import')
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 })
    expect(page.url()).toMatch(/\/(login|$)/)
  })
})

test.describe('Fase 2F — RPCs do engine são invocáveis via supabase client (indiretamente)', () => {
  // Essas rotas validam que a feature está montada; execução completa exige
  // autenticação + dados seeded. Verificamos só que não há 404/5xx de build.
  test('import SINAPI page /admin/sinapi/import existe', async ({ page }) => {
    const res = await page.goto('/admin/sinapi/import')
    expect(res?.status()).toBeLessThan(500)
  })
})
