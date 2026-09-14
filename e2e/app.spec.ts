import { expect, test } from '@playwright/test'

const applicationPath = '/immopilot-de/'

test('loads the production application and navigates to the foundation section', async ({
  page,
}) => {
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

  await expect(page.locator('script[type="module"]')).toHaveAttribute(
    'src',
    /^\/immopilot-de\/assets\//,
  )
  await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
    'href',
    /^\/immopilot-de\/assets\//,
  )

  await page.getByRole('link', { name: 'Projekt ansehen' }).click()

  await expect(page).toHaveURL(/#foundation$/)
  expect(new URL(page.url()).pathname).toBe(applicationPath)
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Eine klare Grundlage für den Immobilienkauf.',
    }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'English' }).click()

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Understand the numbers\.\s*Decide with confidence\./i,
    }),
  ).toBeVisible()
  await expect(page.getByText('€250,000')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})
