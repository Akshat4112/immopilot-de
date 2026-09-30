import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const routes = [
  './',
  './#/purchase-costs',
  './#/financing',
  './#/results',
  './#/scenarios',
  './#/comparison',
] as const

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate<{ page: number; viewport: number }>(`(() => ({
    page: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))()`)
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport)
}

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  const blockingViolations = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical',
  )

  expect(blockingViolations).toEqual([])
}

async function openPrimaryNavigationRoute(page: Page, linkName: string) {
  const menuButton = page.getByRole('button', { name: 'Navigation öffnen' })
  if (await menuButton.isVisible()) await menuButton.click()
  await page.getByRole('link', { name: linkName }).click()
}

test('@accessibility scans every public route and confirmation state', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route)
    await expectNoSeriousAccessibilityViolations(page)
  }

  await page.goto('./#/scenarios')
  await page.getByRole('button', { name: 'Aktuellen Stand teilen' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Verstanden, Link erstellen' })).toBeFocused()
  await expectNoSeriousAccessibilityViolations(page)

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Abbrechen' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('@accessibility supports the skip link and visible keyboard focus', async ({ page }) => {
  await page.goto('./')
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Zum Inhalt springen' })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveCSS('outline-style', 'solid')

  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.goto('./#/financing')
  const equityInput = page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' })
  await equityInput.focus()
  await expect(equityInput).toHaveCSS('outline-style', 'solid')
})

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const) {
  test(`@cross-browser completes the bilingual property workflow at ${viewport.name} width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('./')
    await expectNoPageOverflow(page)

    await page.getByRole('link', { name: 'Kapitalanlage bewerten' }).click()
    await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')
    const budgetStatuses = page.locator('.budget-field__status-select')
    await budgetStatuses.nth(0).selectOption('confirmed-zero')
    await budgetStatuses.nth(1).selectOption('confirmed-zero')
    await expectNoPageOverflow(page)

    await page.getByRole('link', { name: 'Zur Finanzierung →' }).click()
    await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('66250')
    await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('50000')
    await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
    await expect(page.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
    await expectNoPageOverflow(page)

    await page.getByRole('link', { name: 'Zur Auswertung →' }).click()
    await expect(page.getByRole('heading', { name: 'Kapitalanlage' })).toBeVisible()
    await expectNoPageOverflow(page)

    await openPrimaryNavigationRoute(page, 'Gespeicherte Szenarien')
    await page.getByLabel('Szenarioname').fill(`Release ${viewport.name}`)
    await page.getByRole('button', { name: 'Szenario speichern' }).click()
    const savedCard = page
      .getByRole('listitem')
      .filter({ has: page.locator(`input[value="Release ${viewport.name}"]`) })
    await savedCard.getByRole('link', { name: 'Vergleichen' }).click()
    await expect(
      page.getByRole('columnheader', { name: new RegExp(`Release ${viewport.name}`) }),
    ).toBeVisible()
    await expectNoPageOverflow(page)

    if (viewport.width === 375) {
      const dimensions = await page.evaluate<{ client: number; scroll: number }>(`(() => {
        const element = document.querySelector('.comparison-table-scroll')
        if (!(element instanceof HTMLElement)) throw new Error('Missing comparison table')
        return { client: element.clientWidth, scroll: element.scrollWidth }
      })()`)
      expect(dimensions.scroll).toBeGreaterThan(dimensions.client)
    }

    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(
      page.getByRole('heading', { name: 'Compare properties side by side' }),
    ).toBeVisible()
    await expectNoPageOverflow(page)
  })
}
