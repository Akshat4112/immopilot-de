import { expect, test } from '@playwright/test'

const frameSelector = 'iframe[title="ImmoPilot Household Wealth Planner"]'

test('loads Household Wealth Planner as the public homepage', async ({ page }) => {
  await page.goto('./')
  await expect(page).toHaveTitle(/Household Wealth Planner/)

  const planner = page.frameLocator(frameSelector)
  const heading = planner.getByRole('heading', { name: /Household · Housing/ })
  await expect(heading).toBeVisible()

  const properties = planner.getByRole('tab', { name: /Properties/i })
  await properties.click()

  const price = planner.locator('#price')
  await expect(price).toHaveValue('200000')
  await price.fill('250000')
  await expect(price).toHaveValue('250000')

  const household = planner.getByRole('tab', { name: /Household/i })
  await household.click()
  await expect(household).toHaveAttribute('aria-selected', 'true')
})

test('the planner remains usable on mobile @cross-browser', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')

  const planner = page.frameLocator(frameSelector)
  const heading = planner.getByRole('heading', { name: /Household · Housing/ })
  await expect(heading).toBeVisible()

  const outerOverflow = await page.evaluate<boolean>(
    'document.documentElement.scrollWidth > document.documentElement.clientWidth',
  )
  expect(outerOverflow).toBe(false)
})
