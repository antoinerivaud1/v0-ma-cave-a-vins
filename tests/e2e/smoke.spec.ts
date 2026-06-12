import { test, expect } from "@playwright/test"

test.describe("Smoke — chargement initial", () => {
  test("le titre de page est correct", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/Ma Cave à Vins/)
  })

  test("l'app passe le spinner et affiche du contenu", async ({ page }) => {
    await page.goto("/")
    // Attendre que le spinner disparaisse (authLoading + isLoaded)
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 })
    await expect(page.locator("body")).toBeVisible()
  })

  test("l'écran invité affiche le titre de l'app", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 })
    // En mode invité (non authentifié) : titre h1 visible
    await expect(page.locator("h1")).toContainText("Ma Cave à Vins")
  })

  test("l'écran invité affiche un bouton Se connecter", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator(".animate-spin")).toHaveCount(0, { timeout: 10000 })
    const loginBtn = page.getByRole("button", { name: "Se connecter" })
    await expect(loginBtn).toBeVisible()
  })
})
