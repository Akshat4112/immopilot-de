import { expect, test } from '@playwright/test'

test('loads Household Wealth Planner as the public homepage', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveTitle(/Household Wealth Planner/)
  const planner = page.frameLocator('iframe[title="ImmoPilot Household Wealth Planner"]')
  await expect(
    planner.getByRole('heading', { name: /Household · Housing · ETFs · Rentals/i }),
  ).toBeVisible()
  await expect(planner.locator('#price')).toHaveValue('200000')
  await planner.locator('#price').fill('250000')
  await expect(planner.locator('#price')).toHaveValue('250000')
  await planner.getByRole('tab', { name: /Household/i }).click()
  await expect(planner.getByRole('tab', { name: /Household/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('the planner remains usable on mobile @cross-browser', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  const planner = page.frameLocator('iframe[title="ImmoPilot Household Wealth Planner"]')
  await expect(planner.getByRole('heading', { name: /Household · Housing · ETFs · Rentals/i })).toBeVisible()
  const outerOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(outerOverflow).toBe(false)
})
