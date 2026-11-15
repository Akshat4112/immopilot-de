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

test('calculates PAP-2026 wage withholding and syncs the household salary', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: '2026 Payroll check' }).click()
  const panel = page.getByRole('region', { name: '2026 BMF payroll check' })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: 'Read salary from Household planner' }).click()
  await expect(panel.getByRole('spinbutton', { name: 'Monthly taxable gross' })).toHaveValue('8333.33')
  await panel.getByRole('spinbutton', { name: 'Monthly taxable gross' }).fill('5000')
  await panel.getByRole('combobox', { name: 'Tax class' }).selectOption('1')
  await panel.getByRole('combobox', { name: 'Health insurance' }).selectOption('gkv')
  await expect(panel.getByText('Monthly Lohnsteuer:')).toBeVisible()
})

test('reconciles property AfA with 2026 rental tax and cash assumptions', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Properties/i }).click()

  const rentalInputs = planner.locator('#rentalInputsSection')
  const sectionToggle = rentalInputs.locator('.section-toggle')
  if ((await sectionToggle.getAttribute('aria-expanded')) === 'false') {
    await sectionToggle.click()
  }
  await rentalInputs.locator('details summary').first().click()
  const propertyDate = planner.locator('#r1_eligibleFromDate')
  await propertyDate.fill('2026-07-01')
  await expect(propertyDate).toHaveValue('2026-07-01')
  await expect(planner.locator('#rentalAfaAudit')).toContainText('Qualifying months')
  await expect(planner.locator('#rentalAfaAudit')).toContainText('2026 AfA')
  await expect(planner.locator('#rentalAfaAudit tbody tr').first().locator('td').nth(3)).toHaveText('6')
  await expect(planner.locator('#rentalAfaAudit')).toContainText('Principal (not deductible)')

  // Changing capital improvement assumptions must not be counted as immediately
  // deductible upkeep; it belongs to the building basis.
  await planner.locator('#r1_renovation').fill('10000')
  await planner.locator('#r1_renoType').selectOption('capital')
  await expect(planner.locator('#rentalAfaAudit')).toContainText('Building basis')
})

test('ETF-only strategy excludes home purchase and rental properties without losing values', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only' }).click()
  await expect(planner.locator('#strategyEtf')).toHaveValue('on')
  await expect(planner.locator('#strategyRental')).toHaveValue('off')
  await expect(planner.locator('#homeMode')).toHaveValue('existing')
  await expect(planner.locator('#existingType')).toHaveValue('rent')
  await expect(planner.locator('#rentalInputsSection')).toBeHidden()
  await planner.getByRole('tab', { name: /Investments/i }).click()
  await expect(planner.locator('#husband')).toHaveValue('75000')
  await planner.getByRole('button', { name: 'All three' }).click()
  await expect(planner.locator('#strategyRental')).toHaveValue('on')
  await expect(planner.locator('#homeMode')).toHaveValue('buy')
})

test('all seven combinations can be selected independently', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const cases = [
    ['ETF only', 'on', 'off', 'existing'],
    ['Own home only', 'off', 'off', 'buy'],
    ['Rental only', 'off', 'on', 'existing'],
    ['ETF + home', 'on', 'off', 'buy'],
    ['ETF + rental', 'on', 'on', 'existing'],
    ['Home + rental', 'off', 'on', 'buy'],
    ['All three', 'on', 'on', 'buy'],
  ]
  for (const [label, etf, rental, home] of cases) {
    await planner.getByRole('button', { name: label, exact: true }).click()
    await expect(planner.locator('#strategyEtf')).toHaveValue(etf)
    await expect(planner.locator('#strategyRental')).toHaveValue(rental)
    await expect(planner.locator('#homeMode')).toHaveValue(home)
  }
})
