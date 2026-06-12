import { test, expect } from "@playwright/test"

/**
 * Tests de l'onglet Cave — mode invité (aucune écriture Supabase).
 *
 * En mode invité l'AppShell n'est pas rendu : la bottom-nav n'est pas présente.
 * Ces specs valident l'état invité et le comportement de l'auth sheet.
 */
test.describe("Cave — mode invité", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    // Attendre la fin du chargement initial
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 })
  })

  test("affiche l'écran invité avec le message de connexion", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Ma Cave à Vins")
    await expect(page.locator("text=Connectez-vous pour accéder à votre cave")).toBeVisible()
  })

  test("le bouton Se connecter ouvre l'auth sheet", async ({ page }) => {
    const loginBtn = page.getByRole("button", { name: "Se connecter" })
    await expect(loginBtn).toBeVisible()
    await loginBtn.click()
    // L'auth sheet doit s'ouvrir — chercher un dialog ou un rôle dialog
    await expect(page.locator("[role=dialog]")).toBeVisible({ timeout: 5000 })
  })

  test("la bottom-nav n'est pas présente en mode invité", async ({ page }) => {
    // En mode invité, AppShell n'est pas rendu donc la nav n'existe pas
    await expect(page.locator("nav")).toHaveCount(0)
  })
})
