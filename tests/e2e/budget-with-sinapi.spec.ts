/**
 * E2E — Fase 2F: budget com SINAPI de ponta a ponta.
 *
 * Cobre 3 caminhos reais:
 *  1) Picker manual — engenheiro clica "Linkar SINAPI" numa linha, busca e linka.
 *  2) Sugestão em batch — botão "Sugerir SINAPI" + Aceitar badge numa linha.
 *  3) PDF — endpoint `/api/budgets/<id>/pdf` responde 200 com content-type application/pdf.
 *
 * Pré-requisitos no ambiente de teste:
 *  - Usuário admin (E2E_ADMIN_EMAIL) tem company_id e is_super_admin.
 *  - SINAPI importada pra SP + mês recente + desonerado=true com itens de alvenaria.
 *  - Env E2E_* setadas (sem elas, testes se marcam como skip via fixture).
 */
import { test, expect } from './helpers/auth'
import { seedBudgetInReview } from './helpers/seed'

test.describe('Fase 2F — budget com SINAPI (E2E)', () => {
  test('engenheiro linka item a SINAPI via picker, vê badge e gera PDF', async ({ authenticatedPage: page }) => {
    const seed = await seedBudgetInReview({
      name: 'E2E SINAPI Picker',
      items: [
        { description: 'alvenaria de tijolo furado', quantity: 50, unit_cost: 40 },
        { description: 'concreto estrutural fck 25', quantity: 10, unit_cost: 350 },
      ],
    })

    try {
      await page.goto(`/admin/orcamentos/${seed.budgetId}/revisar`)
      await expect(page.getByRole('heading', { name: /Revisar/ })).toBeVisible({ timeout: 15_000 })

      // 1) Abrir picker no primeiro item
      await page.getByRole('button', { name: 'Linkar SINAPI' }).first().click()
      const dialog = page.getByRole('dialog', { name: /Buscar SINAPI/i })
      await expect(dialog).toBeVisible()

      // Query pré-preenchida com a description; espera resultado e seleciona o primeiro.
      const firstSelect = dialog.getByRole('button', { name: /Selecionar/i }).first()
      await expect(firstSelect).toBeVisible({ timeout: 10_000 })
      await firstSelect.click()

      // Picker fecha, badge SINAPI aparece na linha
      await expect(dialog).toBeHidden({ timeout: 10_000 })
      await expect(page.getByText(/SINAPI (insumo|composição)/)).toBeVisible()

      // 2) PDF endpoint responde OK com content-type PDF
      const pdfRes = await page.request.get(`/api/budgets/${seed.budgetId}/pdf`)
      expect(pdfRes.status()).toBe(200)
      expect(pdfRes.headers()['content-type']).toMatch(/pdf/)
    } finally {
      await seed.cleanup()
    }
  })

  test('batch "Sugerir SINAPI" preenche badges e admin aceita uma sugestão', async ({ authenticatedPage: page }) => {
    const seed = await seedBudgetInReview({
      name: 'E2E SINAPI Suggest',
      items: [
        { description: 'alvenaria de tijolo furado meio vez', quantity: 30, unit_cost: 42 },
        { description: 'pintura látex acrílico parede interna', quantity: 80, unit_cost: 18 },
        { description: 'xyzzz totalmente inventado sem match', quantity: 1, unit_cost: 1 },
      ],
    })

    try {
      await page.goto(`/admin/orcamentos/${seed.budgetId}/revisar`)
      await expect(page.getByRole('heading', { name: /Revisar/ })).toBeVisible({ timeout: 15_000 })

      // Clica "Sugerir SINAPI"
      await page.getByRole('button', { name: /Sugerir SINAPI/i }).click()

      // Aguarda ao menos um badge (≥1 item com similaridade ≥ 0.35)
      const badge = page.getByText(/SINAPI sugerido/i).first()
      await expect(badge).toBeVisible({ timeout: 15_000 })

      // Aceitar a primeira sugestão
      await page.getByRole('button', { name: 'Aceitar' }).first().click()

      // Após aceite: badge de sugestão some na linha e vira badge SINAPI "oficial"
      await expect(page.getByText(/SINAPI (insumo|composição)/)).toBeVisible({ timeout: 10_000 })
    } finally {
      await seed.cleanup()
    }
  })
})
