import { expect, test } from '@playwright/test'

test('loads the production application and navigates to the foundation section', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveTitle('ImmoPilot DE')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Zahlen verstehen\.\s*Sicherer entscheiden\./i,
    }),
  ).toBeVisible()
  await expect(page.getByText('250.000 €')).toBeVisible()

  await page.getByRole('link', { name: 'Projekt ansehen' }).click()

  await expect(page).toHaveURL(/#foundation$/)
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Eine klare Grundlage für den Immobilienkauf.',
    }),
  ).toBeVisible()
})
