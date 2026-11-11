import { expect, test } from '@playwright/test'

test('@cross-browser offers first-use paths with no desktop or mobile overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')

  await expect(
    page.getByRole('heading', { name: 'So startest du deine Immobilienrechnung' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Eigennutzungs-Beispiel laden' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Eigennutzung leer starten' })).toHaveAttribute(
    'href',
    '#/purchase-costs',
  )
  const overflowing = await page.evaluate<boolean>(
    'document.documentElement.scrollWidth > document.documentElement.clientWidth',
  )
  expect(overflowing).toBe(false)

  await page.getByRole('link', { name: 'Kapitalanlage leer starten' }).click()
  await expect(page).toHaveURL(/#\/purchase-costs$/u)
  await expect(page.getByRole('heading', { name: 'Kaufkosten berechnen' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('240000')
  await page.goto('./')
  await expect(
    page.getByRole('heading', { name: 'So startest du deine Immobilienrechnung' }),
  ).toHaveCount(0)
})

test('@cross-browser confirms app-data deletion but preserves unrelated browser keys', async ({
  page,
}) => {
  await page.goto('./#/scenarios')
  await page.evaluate("localStorage.setItem('different-app-key', 'keep')")
  await page.getByRole('textbox', { name: 'Szenarioname' }).fill('User-owned scenario')
  await page.getByRole('button', { name: 'Szenario speichern' }).click()
  await expect(page.getByDisplayValue('User-owned scenario')).toBeVisible()

  await page
    .getByRole('button', { name: 'Arbeitsstand und gespeicherte Szenarien löschen' })
    .click()
  await expect(page.getByRole('alertdialog')).toContainText(
    'Bereits exportierte Dateien und geteilte Links können nicht zurückgerufen werden.',
  )
  await page.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(page.getByDisplayValue('User-owned scenario')).toBeVisible()

  await page
    .getByRole('button', { name: 'Arbeitsstand und gespeicherte Szenarien löschen' })
    .click()
  await page.getByRole('button', { name: 'Ja, zurücksetzen' }).click()
  await expect(page.getByText('Noch keine Szenarien gespeichert.')).toBeVisible()
  expect(
    await page.evaluate<string | null>("localStorage.getItem('immopilot-de.scenarios.v1')"),
  ).toBeNull()
  expect(await page.evaluate<string | null>("localStorage.getItem('different-app-key')")).toBe(
    'keep',
  )
})
