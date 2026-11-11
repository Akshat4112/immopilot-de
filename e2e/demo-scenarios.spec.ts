import { expect, test } from '@playwright/test'

const storageKey = 'immopilot-de.scenarios.v1'

test('@cross-browser loads a canonical owner demo only after consent and resets locally', async ({
  page,
}) => {
  await page.goto('./')
  await page.evaluate((key) => {
    localStorage.setItem(key, '{"saved":"keep-this-library-byte-for-byte"}')
  }, storageKey)

  await page.getByRole('button', { name: 'Eigennutzungs-Beispiel laden' }).click()
  await expect(page.getByText('Fiktives Beispiel laden?')).toBeVisible()
  await expect(page.getByText(/möglicherweise ungespeicherten Eingaben/)).toBeVisible()
  await page.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(page.getByRole('heading', { name: 'Zahlen verstehen. Sicherer entscheiden.' })).toBeVisible()

  await page.getByRole('button', { name: 'Eigennutzungs-Beispiel laden' }).click()
  await page.getByRole('button', { name: 'Beispiel übernehmen' }).click()
  await expect(page).toHaveURL(/#\/results$/u)
  await expect(page.getByRole('heading', { name: 'Mieten oder kaufen' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Aktives Rechenbeispiel' })).toContainText(
    'Fiktives Beispiel:',
  )
  await expect(page.getByText(/152\.188,73/u).first()).toBeVisible()
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(
    '{"saved":"keep-this-library-byte-for-byte"}',
  )

  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('complementary', { name: 'Active worked example' })).toContainText(
    'Fictional example:',
  )
  await page.getByRole('button', { name: 'Reset example' }).click()
  await expect(page).toHaveURL(/#\/purchase-costs$/u)
  await expect(page.getByRole('textbox', { name: 'Purchase price' })).toHaveValue('')
  await expect(page.getByRole('complementary', { name: 'Active worked example' })).toHaveCount(0)
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(
    '{"saved":"keep-this-library-byte-for-byte"}',
  )
})

test('@cross-browser loads the negative-cash-flow rental demo without mobile overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Mit Beispieldaten ausprobieren' })).toBeVisible()
  await page.getByRole('button', { name: 'Kapitalanlage-Beispiel laden' }).click()
  await page.getByRole('button', { name: 'Beispiel übernehmen' }).click()
  await expect(page).toHaveURL(/#\/results$/u)
  await expect(page.getByRole('heading', { name: 'Kapitalanlage' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Aktives Rechenbeispiel' })).toContainText(
    'Kapitalanlage in Baden-Württemberg',
  )
  await expect(page.getByText(/-180(?:,00)?\s*€/u).first()).toBeVisible()
  const overflows = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflows).toBe(false)
})
