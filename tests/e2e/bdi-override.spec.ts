/**
 * E2E — Fase 2F: BDI override por item.
 *
 * Seed 3 itens + BDI global 20%. Edita o item #1 e seta override 30%,
 * confirma que o BDI efetivo médio aumenta e que o asterisco aparece
 * indicando override. Depois limpa (input vazio) e valida retorno ao 20%.
 */
import { test, expect } from './helpers/auth'
import { seedBudgetInReview } from './helpers/seed'

test.describe('Fase 2F — BDI override (E2E)', () => {
  test('override por item muda BDI efetivo e aparece asterisco', async ({ authenticatedPage: page }) => {
    const seed = await seedBudgetInReview({
      name: 'E2E BDI Override',
      bdiPercentage: 20,
      items: [
        { description: 'item 1 com override futuro', quantity: 10, unit_cost: 1000 },
        { description: 'item 2 sem override', quantity: 10, unit_cost: 1000 },
        { description: 'item 3 sem override', quantity: 10, unit_cost: 1000 },
      ],
    })

    try {
      await page.goto(`/admin/orcamentos/${seed.budgetId}/revisar`)
      await expect(page.getByRole('heading', { name: /Revisar/ })).toBeVisible({ timeout: 15_000 })

      // Footer inicial: "BDI aplicado (20.00% médio ...)"
      await expect(page.getByText(/BDI aplicado \(20\.00% médio/i)).toBeVisible()

      // Edita item 1: clica no botão "Editar" da primeira linha
      const firstRow = page.locator('table.data-table tbody tr').first()
      await firstRow.getByRole('button', { name: 'Editar' }).click()

      // Input BDI override (aparece só em modo edição, title específico)
      const bdiInput = firstRow.locator('input[title*="BDI global"]')
      await bdiInput.fill('30')

      // Salvar
      await firstRow.getByRole('button', { name: 'Salvar' }).click()

      // Asterisco aparece na linha do item 1 (coluna BDI %) — confirma override
      await expect(firstRow.getByText(/30\.00% \*/)).toBeVisible({ timeout: 10_000 })

      // Média ponderada: (30 + 20 + 20) / 3 = 23.33 (3 itens com custos iguais)
      await expect(page.getByText(/BDI aplicado \(23\.33% médio.*overrides/i)).toBeVisible()

      // Limpa override: editar de novo, input vazio, salvar
      await firstRow.getByRole('button', { name: 'Editar' }).click()
      await bdiInput.fill('')
      await firstRow.getByRole('button', { name: 'Salvar' }).click()

      // Volta ao médio 20%
      await expect(page.getByText(/BDI aplicado \(20\.00% médio/i)).toBeVisible({ timeout: 10_000 })
    } finally {
      await seed.cleanup()
    }
  })
})
