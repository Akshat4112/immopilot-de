import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

import owner from '../examples/scenarios/owner-occupier.json' with { type: 'json' }
import rental from '../examples/scenarios/rental-investment.json' with { type: 'json' }

async function setCanonicalPurchase(page: Page, scenario: typeof owner | typeof rental) {
  await page.goto('./')
  await page
    .getByRole('link', {
      name:
        scenario.mode === 'owner-occupier' ? 'Für Eigennutzung rechnen' : 'Kapitalanlage bewerten',
    })
    .click()
  await page
    .getByRole('textbox', { name: 'Kaufpreis', exact: true })
    .fill(String(scenario.property.purchasePriceCents / 100))
  const budgets = page.locator('.budget-field__status-select')
  if (scenario.acquisition.renovationBudget.amountCents > 0) {
    await page
      .getByRole('textbox', { name: 'Renovierungsbudget', exact: true })
      .fill(String(scenario.acquisition.renovationBudget.amountCents / 100))
  }
  await budgets.nth(0).selectOption(scenario.acquisition.renovationBudget.budgetStatus)
  await budgets.nth(1).selectOption('confirmed-zero')
  await page.getByRole('link', { name: 'Zur Finanzierung →' }).click()
  await page
    .getByRole('textbox', { name: 'Verfügbares Eigenkapital' })
    .fill(String(scenario.financing.availableEquityCents / 100))
  await page
    .getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' })
    .fill(String(scenario.financing.downPaymentCents / 100))
  await expect(page.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
  await page.getByRole('link', { name: 'Zur Auswertung →' }).click()
}

async function inspectPopulatedResults(page: Page, prefix: RegExp) {
  const panels = await page.getByRole('complementary', { name: prefix }).all()
  const labels = await Promise.all(panels.map((panel) => panel.getAttribute('aria-label')))
  expect(labels).toHaveLength(5)
  expect(new Set(labels).size).toBe(labels.length)
  // Scan financial results with configured inputs, not just the empty route.
  await page.waitForTimeout(200)
  const scan = await new AxeBuilder({ page }).analyze()
  expect(
    scan.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
  ).toEqual([])
}

test('@cross-browser reproduces the canonical owner demo in both languages', async ({ page }) => {
  await setCanonicalPurchase(page, owner)
  await page.getByText('Annahmen für Eigennutzung', { exact: true }).click()
  await page.getByRole('textbox', { name: 'Vergleichbare monatliche Kaltmiete' }).fill('1000')
  await page.getByRole('textbox', { name: 'Monatliche Eigentümerkosten' }).fill('250')
  await page.getByRole('textbox', { name: 'Kostensteigerung p.a.', exact: true }).fill('0')
  await expect(page.getByText('144.104,59 €', { exact: true })).toBeVisible()
  await expect(page.getByText('119.489,86 €', { exact: true })).toBeVisible()
  await expect(page.getByText(/24\.614,73/)).toBeVisible()
  await inspectPopulatedResults(page, /^Berechnungsgrundlage und Grenzen — /)

  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByText('€144,104.59', { exact: true })).toBeVisible()
  await expect(page.getByText('€119,489.86', { exact: true })).toBeVisible()
  await inspectPopulatedResults(page, /^Calculation basis and limitations — /)
})

test('@cross-browser reproduces negative cash flow and canonical rental sale in both languages', async ({
  page,
}) => {
  const applicationErrors: string[] = []
  const transmissions: string[] = []
  page.on('pageerror', (error) => applicationErrors.push(error.message))
  page.on('request', (request) => {
    if (request.method() !== 'GET') transmissions.push(request.url())
  })
  await setCanonicalPurchase(page, rental)
  await page.getByText('Annahmen für Vermietung', { exact: true }).click()
  for (const [name, value] of [
    ['Monatliche Nettokaltmiete', '1000'],
    ['Leerstandsquote', '5'],
    ['Nicht umlagefähiges Hausgeld pro Monat', '150'],
    ['Instandhaltung außerhalb Hausgeld pro Jahr', '1200'],
    ['Mietsteigerung p.a.', '0'],
    ['Kostensteigerung p.a.', '0'],
    ['Wertentwicklung für Verkauf p.a. (optional)', '2'],
    ['Verkaufskosten (optional)', '3'],
  ]) {
    await page.getByRole('textbox', { name, exact: true }).fill(value)
  }
  await expect(page.getByText('-180 €', { exact: true })).toHaveCount(2)
  await expect(page.getByText('42.480,31 €', { exact: true })).toBeVisible()
  await expect(page.getByText(/137\.680,31/)).toBeVisible()
  await inspectPopulatedResults(page, /^Berechnungsgrundlage und Grenzen — /)

  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByText('-€180', { exact: true })).toHaveCount(2)
  await expect(page.getByText('€42,480.31', { exact: true })).toBeVisible()
  await inspectPopulatedResults(page, /^Calculation basis and limitations — /)
  expect(applicationErrors).toEqual([])
  expect(transmissions).toEqual([])
  expect(await page.context().cookies()).toEqual([])
})

test('serves the commit manifest under the Pages base path', async ({ request }) => {
  const response = await request.get('./release.json')
  expect(response.status()).toBe(200)
  const manifest = (await response.json()) as {
    commit: string
    basePath: string
    files: { path: string }[]
  }
  expect(manifest.commit).toMatch(/^[a-f0-9]{40}$/)
  expect(manifest.basePath).toBe('/immopilot-de/')
  expect(manifest.files.map((file) => file.path)).toContain('index.html')
})
