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

test('classifies renovation from actual acquisition date, VAT and 15 percent threshold', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Properties/i }).click()
  const rental = planner.locator('#rentalInputsSection')
  const sectionToggle = rental.locator('.section-toggle')
  if ((await sectionToggle.getAttribute('aria-expanded')) === 'false') {
    await sectionToggle.click()
  }
  await rental.locator('details summary').first().click()
  await planner.locator('#r1_acquisitionDate').fill('2026-01-15')
  await planner.locator('#r1_workPerformedDate').fill('2026-04-01')
  await planner.locator('#r1_renovation').fill('40000')
  await planner.locator('#r1_renoType').selectOption('maintenance')
  await expect(planner.locator('#renovationAudit tbody')).toContainText('capitalized')
  await planner.locator('#r1_workPerformedDate').fill('2030-04-01')
  await expect(planner.locator('#renovationAudit tbody')).toContainText('deductible')
})

test('goal-first wizard can configure ETF-only without asking for a property', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)

  await planner.locator('[data-start-goal="etf"]').click()
  const guide = planner.getByRole('dialog', { name: 'Set up your financial plan' })
  await expect(guide).toBeVisible()
  await guide.getByRole('radio', { name: /Single person/ }).check()
  await guide.getByRole('button', { name: 'Next' }).click()
  await guide.getByRole('radio', { name: /Renting/ }).check()
  await guide.getByRole('button', { name: 'Next' }).click()
  await expect(guide.getByRole('radio', { name: /ETF only/ })).toBeChecked()
  await guide.getByRole('button', { name: /Finish & open calculator/ }).click()

  await expect(guide).toBeHidden()
  await expect(planner.locator('#profileMode')).toHaveValue('single')
  await expect(planner.locator('#existingType')).toHaveValue('rent')
  await expect(planner.locator('#strategyEtf')).toHaveValue('on')
  await expect(planner.locator('#strategyRental')).toHaveValue('off')
  await expect(planner.locator('#homeMode')).toHaveValue('existing')
  await expect(planner.getByRole('tab', { name: /Investments/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('closing onboarding leaves existing inputs untouched and restoring a goal retains drafts', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Properties/ }).click()
  await planner.locator('#price').fill('245000')
  await planner.getByRole('tab', { name: /Overview/ }).click()
  await planner.getByRole('button', { name: /Plan my goals/ }).click()

  const guide = planner.getByRole('dialog', { name: 'Set up your financial plan' })
  await guide.getByRole('radio', { name: /Single person/ }).check()
  await guide.getByRole('button', { name: 'Next' }).click()
  await guide.getByRole('radio', { name: /Own outright/ }).check()
  await guide.getByRole('button', { name: 'Close' }).click()
  await expect(guide).toBeHidden()
  await expect(planner.locator('#profileMode')).toHaveValue('married')
  await expect(planner.locator('#existingType')).toHaveValue('mortgage')
  await expect(planner.locator('#price')).toHaveValue('245000')

  await planner.locator('[data-start-goal="etf"]').click()
  await guide.getByRole('button', { name: 'Next' }).click()
  await guide.getByRole('radio', { name: /Own outright/ }).check()
  await guide.getByRole('button', { name: 'Next' }).click()
  await guide.getByRole('button', { name: /Finish & open calculator/ }).click()
  await expect(planner.locator('#existingType')).toHaveValue('paid')
  await expect(planner.locator('#price')).toHaveValue('245000')
  await planner.getByRole('button', { name: 'All three', exact: true }).click()
  await expect(planner.locator('#price')).toHaveValue('245000')
})

test('the guided setup offers all seven combinations on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('[data-start-goal="all"]').click()
  const guide = planner.getByRole('dialog', { name: 'Set up your financial plan' })
  await guide.getByRole('button', { name: 'Next' }).click()
  await guide.getByRole('button', { name: 'Next' }).click()
  await expect(guide.getByRole('radio')).toHaveCount(7)
  await expect(guide.getByRole('radio', { name: /All three/ })).toBeChecked()
})

test('UX-022 dashboard reflects existing household and ETF calculations', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const dashboard = planner.locator('#overviewDashboard')
  await expect(dashboard).toBeVisible()
  await expect(planner.locator('#overviewFreeCash')).toHaveText(
    (await planner.locator('#kFree').textContent()) ?? '',
  )
  await expect(planner.locator('#overviewEtfValue')).toHaveText(
    (await planner.locator('#mPortfolio').textContent()) ?? '',
  )
  await expect(planner.locator('#overviewFutureLabel')).toContainText('year 25')
  await page.screenshot({ path: test.info().outputPath('explorer-ux022-desktop.png') })

  await planner.locator('[data-overview-jump="household"]').click()
  await expect(planner.getByRole('tab', { name: /Household/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(dashboard).toBeHidden()
})

test('UX-022 dashboard zeroes inactive investment categories and retains inputs', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  await expect(planner.locator('#overviewOpeningEquity')).toHaveText(
    (await planner.locator('#overviewAssetHomeAmt').textContent()) ?? '',
  )
  await expect(planner.locator('#overviewAssetRentalAmt')).toHaveText(
    (await planner.locator('#overviewAssetHomeAmt').textContent()) ?? '',
  )
  await planner.getByRole('button', { name: 'Own home only', exact: true }).click()
  await expect(planner.locator('#overviewEtfValue')).toHaveText(
    (await planner.locator('#mPortfolio').textContent()) ?? '',
  )
})

test('UX-022 shows a funding gap and adjusts projection horizon', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)

  // Exercise the visible form, not a script-based mutation of a hidden input.
  await planner.getByRole('tab', { name: /Household/i }).click()
  const expenses = planner.locator('#utilities').locator('xpath=ancestor::div[contains(@class,"section")][1]')
  const expenseToggle = expenses.locator('.section-toggle')
  if ((await expenseToggle.getAttribute('aria-expanded')) === 'false') {
    await expenseToggle.click()
  }
  await planner.locator('#utilities').fill('50000')
  await planner.getByRole('tab', { name: /Overview/i }).click()
  await expect(planner.locator('#overviewCashStatus')).toContainText('funding gap')
  await expect(planner.locator('#overviewFreeCash')).toHaveClass(/red/)

  await planner.getByRole('tab', { name: /Investments/i }).click()
  const outlook = planner.locator('#years').locator('xpath=ancestor::div[contains(@class,"section")][1]')
  const outlookToggle = outlook.locator('.section-toggle')
  if ((await outlookToggle.getAttribute('aria-expanded')) === 'false') {
    await outlookToggle.click()
  }
  await planner.locator('#years').fill('5')
  await planner.getByRole('tab', { name: /Overview/i }).click()
  await expect(planner.locator('#overviewFutureLabel')).toContainText('year 5')
})

test('UX-022 KPI grid remains readable on mobile without hiding the goal launcher', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('#overviewDashboard')).toBeVisible()
  await expect(planner.locator('.overview-kpi')).toHaveCount(4)
  await expect(planner.locator('#goalLauncher')).toBeVisible()
  const dashboardBox = await planner.locator('#overviewDashboard').boundingBox()
  expect(dashboardBox).not.toBeNull()
  expect(dashboardBox?.width).toBeLessThanOrEqual(376)
  await page.screenshot({ path: test.info().outputPath('explorer-ux022-mobile.png') })
})
