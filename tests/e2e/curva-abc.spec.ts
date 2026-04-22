/**
 * E2E — Fase 2F: Curva ABC no AdminBudgetReview.
 *
 * Seed com distribuição Pareto-like (2 itens caros + 8 médios + 10 baixos).
 * Valida que o componente `BudgetCurvaABC` renderiza as 3 classes e que
 * o filtro "Filtrar A" reduz a tabela para a contagem da classe A.
 */
import { test, expect } from './helpers/auth'
import { seedBudgetInReview } from './helpers/seed'

test.describe('Fase 2F — Curva ABC (E2E)', () => {
  test('curva ABC classifica e filtro A reduz a tabela', async ({ authenticatedPage: page }) => {
    // Distribuição construída pra produzir ~2 A / ~8 B / ~10 C (tolerância ±1).
    const items = [
      // "Grandes" (classe A candidatos)
      { description: 'concreto estrutural fck 30 grande volume bloco A', quantity: 500, unit_cost: 400 },
      { description: 'aço CA-50 10mm pilares bloco B', quantity: 3000, unit_cost: 60 },
      // "Médios" (classe B candidatos)
      ...Array.from({ length: 8 }, (_, i) => ({
        description: `alvenaria tijolo furado pavimento ${i + 1}`,
        quantity: 200,
        unit_cost: 45,
      })),
      // "Baixos" (classe C candidatos)
      ...Array.from({ length: 10 }, (_, i) => ({
        description: `item menor miscelanea ${i + 1}`,
        quantity: 5,
        unit_cost: 12,
      })),
    ]

    const seed = await seedBudgetInReview({ name: 'E2E Curva ABC', items })

    try {
      await page.goto(`/admin/orcamentos/${seed.budgetId}/revisar`)
      await expect(page.getByRole('heading', { name: /Revisar/ })).toBeVisible({ timeout: 15_000 })

      // O componente BudgetCurvaABC renderiza 3 progressbars com aria-label "Classe A/B/C"
      await expect(page.getByRole('progressbar', { name: /Classe A/i })).toBeVisible()
      await expect(page.getByRole('progressbar', { name: /Classe B/i })).toBeVisible()
      await expect(page.getByRole('progressbar', { name: /Classe C/i })).toBeVisible()

      // Linhas de tabela visíveis antes do filtro (ignora header + footer)
      const visibleRowsBefore = await page.locator('table.data-table tbody tr').count()
      expect(visibleRowsBefore).toBe(20)

      // Aplica filtro A → tabela reduz para 1-3 linhas (tolerância ±1 em torno de 2)
      await page.getByRole('button', { name: /Filtrar A/i }).click()
      const visibleRowsAfter = await page.locator('table.data-table tbody tr').count()
      expect(visibleRowsAfter).toBeGreaterThanOrEqual(1)
      expect(visibleRowsAfter).toBeLessThanOrEqual(3)

      // Limpa filtro → volta ao total
      await page.getByRole('button', { name: /Limpar filtro/i }).click()
      const visibleRowsCleared = await page.locator('table.data-table tbody tr').count()
      expect(visibleRowsCleared).toBe(20)
    } finally {
      await seed.cleanup()
    }
  })
})
