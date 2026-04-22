/**
 * E2E — Fase 2F: Memorial descritivo persiste.
 *
 * Na página de detalhe do orçamento (`/admin/orcamentos/<id>`):
 *  - Clica "Preencher" → abre editor em markdown
 *  - Digita memorial com título, bold, lista
 *  - Salva → recarrega página → textarea vem preenchida
 */
import { test, expect } from './helpers/auth'
import { seedBudgetInReview } from './helpers/seed'

const MD = `# Memorial descritivo E2E\n\n## Materiais\n- Concreto fck 25 MPa\n- Aço CA-50\n\n## Normas\n**ABNT NBR 6118** e ABNT NBR 15575.`

test.describe('Fase 2F — Memorial descritivo (E2E)', () => {
  test('engenheiro salva memorial e valor persiste após recarregar', async ({ authenticatedPage: page }) => {
    const seed = await seedBudgetInReview({
      name: 'E2E Memorial',
      items: [{ description: 'alvenaria tijolo furado', quantity: 50, unit_cost: 40 }],
    })

    try {
      await page.goto(`/admin/orcamentos/${seed.budgetId}`)
      await expect(page.getByRole('heading', { name: /Memorial descritivo/ })).toBeVisible({ timeout: 15_000 })

      // Sem conteúdo ainda → botão "Preencher"
      await page.getByRole('button', { name: /Preencher/i }).click()

      // Editor em markdown tab (default): textarea com placeholder de memorial
      const textarea = page.locator('textarea')
      await expect(textarea).toBeVisible()
      await textarea.fill(MD)

      // Salvar
      await page.getByRole('button', { name: /Salvar/i }).click()

      // Volta pra modo view e o markdown fica renderizado no preview
      await expect(page.getByRole('heading', { name: /Memorial descritivo E2E/i })).toBeVisible({ timeout: 10_000 })

      // Recarregar → conteúdo persiste
      await page.reload()
      await expect(page.getByRole('heading', { name: /Memorial descritivo E2E/i })).toBeVisible({ timeout: 15_000 })

      // Reabre editor — textarea traz o markdown salvo
      await page.getByRole('button', { name: /Editar/i }).click()
      const reopenedTextarea = page.locator('textarea')
      await expect(reopenedTextarea).toHaveValue(MD)
    } finally {
      await seed.cleanup()
    }
  })
})
