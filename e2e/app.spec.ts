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
