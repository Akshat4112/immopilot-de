import { expect, test } from '@playwright/test'

const applicationPath = '/immopilot-de/'

test('loads the desktop shell and keeps route navigation under the Pages path', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./')

  await expect(page).toHaveTitle('ImmoPilot DE')
  expect(new URL(page.url()).pathname).toBe(applicationPath)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Zahlen verstehen\.\s*Sicherer entscheiden\./i,
    }),
  ).toBeVisible()
  await expect(page.getByText('250.000 €')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Navigation öffnen' })).toBeHidden()
  await expect(page.getByRole('link', { name: 'Überblick' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.getByRole('link', { name: 'Überblick' }).focus()
  await expect(page.getByRole('link', { name: 'Überblick' })).toHaveCSS('outline-style', 'solid')

  const designTokens = await page.evaluate<{
    brand: string
    layout: string
    spacing: string
  }>(`(() => {
    const styles = getComputedStyle(document.documentElement)
    return {
      brand: styles.getPropertyValue('--color-brand').trim(),
      layout: styles.getPropertyValue('--layout-max-width').trim(),
      spacing: styles.getPropertyValue('--space-6').trim(),
    }
  })()`)

  expect(designTokens).toEqual({
    brand: '#173f32',
    layout: '73.75rem',
    spacing: '1.5rem',
  })

  await page.getByRole('link', { name: 'Kaufkosten starten' }).focus()
  await expect(page.getByRole('link', { name: 'Kaufkosten starten' })).toHaveCSS(
    'outline-style',
    'solid',
  )

  await expect(page.locator('script[type="module"]')).toHaveAttribute(
    'src',
    /^\/immopilot-de\/assets\//,
  )
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
    'href',
    /^\/immopilot-de\/assets\//,
  )

  await page.getByRole('link', { name: 'Kaufkosten starten' }).click()

  await expect(page).toHaveURL(/#\/purchase-costs$/)
  expect(new URL(page.url()).pathname).toBe(applicationPath)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Kaufkosten berechnen',
    }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Kaufkosten' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Kaufkosten berechnen' })).toBeVisible()

  await page.getByRole('button', { name: 'English' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Calculate purchase costs' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
  await expect(page.getByText(/not a financing offer or approval/i)).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('uses the compact navigation at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto('./')

  const menuButton = page.getByRole('button', { name: 'Navigation öffnen' })
  const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' })

  await expect(menuButton).toBeVisible()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  await expect(navigation).toBeHidden()

  await menuButton.click()

  await expect(page.getByRole('button', { name: 'Navigation schließen' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(navigation).toBeVisible()

  await page.getByRole('link', { name: 'Finanzierung' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Finanzierung planen' })).toBeVisible()
  await expect(navigation).toBeHidden()
  await expect(page.getByRole('main')).toBeFocused()
})

test('keeps the mobile shell accessible without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')

  const skipLink = page.getByRole('link', { name: 'Zum Inhalt springen' })
  await skipLink.focus()
  await expect(skipLink).toBeVisible()
  await expect(skipLink).toHaveCSS('outline-style', 'solid')

  const hasHorizontalOverflow = await page.evaluate<boolean>(
    `document.documentElement.scrollWidth > document.documentElement.clientWidth`,
  )
  expect(hasHorizontalOverflow).toBe(false)

  await expect(page.getByText(/kein Darlehensangebot oder Finanzierungszusage/i)).toBeVisible()
})

test('calculates acquisition costs after the user enters a purchase price', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Kaufkosten starten' }).click()

  await expect(page.getByRole('heading', { name: 'Berechnung fehlgeschlagen' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')

  await expect(page.getByText('Post-Purchase-Budget noch nicht bestätigt')).toBeVisible()
  await page.getByRole('button', { name: /Erweiterte Eingaben/ }).click()

  const budgetStatuses = page.locator('.budget-field__status-select')
  await budgetStatuses.nth(0).selectOption('confirmed-zero')
  await budgetStatuses.nth(1).selectOption('confirmed-zero')

  await expect(page.getByRole('heading', { name: 'Grunderwerbsteuer' })).toBeVisible()
  await expect(page.getByText('12.500,00 €')).toBeVisible()
  await expect(page.getByText('Berechnung fehlgeschlagen')).toHaveCount(0)
})

test('carries completed purchase costs into the financing and mortgage workflow', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Kaufkosten starten' }).click()
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')
  await page.getByRole('button', { name: /Erweiterte Eingaben/ }).click()

  const budgetStatuses = page.locator('.budget-field__status-select')
  await budgetStatuses.nth(0).selectOption('confirmed-zero')
  await budgetStatuses.nth(1).selectOption('confirmed-zero')

  await page.getByRole('link', { name: 'Zur Finanzierung →' }).click()

  await expect(page).toHaveURL(/#\/financing$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Finanzierung planen' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('66250')
  await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('50000')

  await expect(page.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
  await expect(page.getByText(/200\.000/)).toBeVisible()
  await expect(page.getByText(/916,67/)).toBeVisible()
  await expect(page.getByText(/152\.188,73/)).toBeVisible()

  await page.getByRole('button', { name: 'English' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Plan financing' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Available equity' })).toHaveValue('66250')

  await page.getByRole('link', { name: 'Open analysis →' }).click()

  await expect(page).toHaveURL(/#\/results$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Evaluate one property' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Refinancing stress test' })).toBeVisible()
})

test('persists and manages a named scenario locally without saved results', async ({ page }) => {
  await page.goto('./#/purchase-costs')
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('350000')
  await page.getByRole('link', { name: 'Gespeicherte Szenarien' }).click()

  await page.getByLabel('Szenarioname').fill('Altbau Köln')
  await page.getByRole('button', { name: 'Szenario speichern' }).click()
  await expect(page.getByText('Szenario gespeichert.')).toBeVisible()

  const persisted = await page.evaluate<string>(
    `localStorage.getItem('immopilot-de.scenarios.v1') ?? ''`,
  )
  expect(persisted).toContain('Altbau Köln')
  expect(persisted).not.toContain('results')

  await page.reload()
  const savedCard = page
    .getByRole('listitem')
    .filter({ has: page.locator('input[value="Altbau Köln"]') })
  await expect(savedCard).toBeVisible()
  await savedCard.getByRole('button', { name: 'Teilen' }).click()
  await expect(page.getByText(/Jeder mit dem vollständigen Link/)).toBeVisible()
  await page.getByRole('button', { name: 'Verstanden, Link erstellen' }).click()
  await expect(page.getByLabel('Freigabelink für das Szenario')).toHaveValue(
    /#\/scenarios\?scenario=/,
  )

  await savedCard.getByRole('button', { name: 'Duplizieren' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(2)
  const duplicateCard = page
    .getByRole('listitem')
    .filter({ has: page.locator('input[value="Altbau Köln (Kopie)"]') })
  await duplicateCard.getByRole('button', { name: 'Löschen' }).click()
  await duplicateCard.getByRole('button', { name: 'Endgültig löschen' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
})
