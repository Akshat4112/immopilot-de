import { expect, type Page } from '@playwright/test'

/** Approved €250,000 purchase / €200,000 loan fixture, entered through the real UI. */
export async function completeFinancedPurchase(page: Page) {
  await page.goto('./#/purchase-costs')
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')
  const budgetStatuses = page.locator('.budget-field__status-select')
  await budgetStatuses.nth(0).selectOption('confirmed-zero')
  await budgetStatuses.nth(1).selectOption('confirmed-zero')
  await page.getByRole('link', { name: 'Zur Finanzierung →' }).click()
  await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('66250')
  await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('50000')
  await expect(page.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
}
