import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

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
  await rentalInputs.locator('#rentalInputs .rental-property details > summary').first().click()
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
  await rental.locator('#rentalInputs .rental-property details > summary').first().click()
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

test('UX-023 essentials retains core inputs and advanced mortgage values without recalculating them away', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Properties/ }).click()
  await expect(planner.getByRole('button', { name: 'Essentials', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(planner.locator('#price')).toBeVisible()
  await expect(planner.locator('#emi')).toBeVisible()
  await expect(planner.locator('#refiRate')).toBeHidden()

  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  await expect(planner.locator('#refiRate')).toBeVisible()
  await planner.locator('#refiRate').fill('6.25')
  await planner.locator('#price').fill('245000')
  await planner.getByRole('button', { name: 'Essentials', exact: true }).click()
  await expect(planner.locator('#refiRate')).toBeHidden()
  await expect(planner.locator('#uxInputStatus')).toContainText('customized advanced')
  await expect(planner.locator('#refiRate')).toHaveValue('6.25')
  await expect(planner.locator('#price')).toHaveValue('245000')

  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  await expect(planner.locator('#refiRate')).toBeVisible()
  await expect(planner.locator('#refiRate')).toHaveValue('6.25')
  await expect(planner.locator('#price')).toHaveValue('245000')
})

test('UX-023 investments show a short input form with financial explanations', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  await planner.getByRole('tab', { name: /Investments/ }).click()
  await expect(planner.locator('#husband')).toBeVisible()
  await expect(planner.locator('#ret')).toBeVisible()
  await expect(planner.locator('#allow')).toBeHidden()
  await expect(planner.locator('#uxInputContext')).toContainText('ETFs')

  const terms = planner.locator('#etfInputsSection').getByText('Explain financial terms')
  await terms.click()
  await expect(planner.locator('#etfInputsSection')).toContainText('Vorabpauschale')
  await expect(planner.locator('#etfInputsSection')).toContainText('does not yet accurately model')
  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  await expect(planner.locator('#allow')).toBeVisible()
})

test('UX-023 input density controls are mobile usable and do not change strategy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Properties/ }).click()
  await expect(planner.locator('#uxInputToolbar')).toBeVisible()
  await expect(planner.getByRole('button', { name: 'Essentials', exact: true })).toBeVisible()
  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  await expect(planner.locator('#strategyEtf')).toHaveValue('on')
  await expect(planner.locator('#strategyRental')).toHaveValue('on')
  await expect(planner.locator('#homeMode')).toHaveValue('buy')
  await page.screenshot({ path: test.info().outputPath('explorer-ux023-mobile.png') })
})

test('UX-024 tracks unsaved inputs and updates an active saved plan', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#scenarioName').fill('Home baseline')
  await planner.locator('#saveScenario').click()
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Saved · Home baseline')
  await expect(planner.locator('#updateScenario')).toBeDisabled()

  await planner.getByRole('tab', { name: /Properties/i }).click()
  await planner.locator('#price').fill('230000')
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Unsaved edits')
  await expect(planner.locator('#updateScenario')).toBeEnabled()
  await planner.locator('#updateScenario').click()
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Saved · Home baseline')

  await planner.locator('#scenarioCards [data-action="duplicate"]').first().click()
  await expect(planner.locator('#scenarioCards .scenario-tile')).toHaveCount(2)
  await expect(planner.locator('#activeScenario option')).toHaveCount(3)
})

test('UX-024 switching saved plans allows undoing the previous load', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  page.on('dialog', (dialog) => dialog.accept())
  await planner.locator('#scenarioName').fill('Plan A')
  await planner.locator('#saveScenario').click()
  await planner.getByRole('tab', { name: /Properties/i }).click()
  await planner.locator('#price').fill('225000')
  await planner.locator('#scenarioName').fill('Plan B')
  await planner.locator('#saveScenario').click()
  await planner.locator('#price').fill('260000')
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Unsaved edits')

  await planner.locator('#activeScenario').selectOption({ label: 'Plan A' })
  await expect(planner.locator('#price')).toHaveValue('200000')
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Saved · Plan A')
  await expect(planner.locator('#undoScenarioLoad')).toBeEnabled()

  await planner.locator('#undoScenarioLoad').click()
  await expect(planner.locator('#price')).toHaveValue('260000')
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Unsaved edits · Plan B')
  await expect(planner.locator('#undoScenarioLoad')).toBeDisabled()
})

test('UX-024 comparison remains limited to three and warns on mismatched horizons', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#scenarioName').fill('One')
  await planner.locator('#saveScenario').click()
  await planner.locator('#scenarioName').fill('Two')
  await planner.locator('#saveScenario').click()
  await planner.locator('#scenarioName').fill('Three')
  await planner.locator('#saveScenario').click()
  await planner.locator('#scenarioName').fill('Four')
  await planner.locator('#saveScenario').click()
  await expect(planner.locator('#scenarioCards .scenario-tile')).toHaveCount(4)
  await expect(planner.locator('#scenarioCards [data-compare]:checked')).toHaveCount(3)
  await planner.locator('#scenarioCards [data-compare]:not(:checked)').first().click()
  await expect(planner.locator('#scenarioCards [data-compare]:checked')).toHaveCount(3)
  await expect(planner.locator('#scenarioNotice')).toContainText('Compare up to three')
  await expect(planner.locator('#scenarioCompare table thead th')).toHaveCount(4)
})

test('UX-024 rejects malformed backup without deleting saved plans', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#scenarioName').fill('Keep me')
  await planner.locator('#saveScenario').click()
  await planner.locator('#scenarioFile').setInputFiles({
    name: 'invalid-plans.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 2,
      scenarios: [{ name: 'Untrusted data', snapshot: { fields: { invalidField: 3 } }, stats: {} }],
    })),
  })
  await expect(planner.locator('#scenarioNotice')).toContainText('Import failed')
  await expect(planner.locator('#scenarioCards .scenario-tile')).toHaveCount(1)
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Saved · Keep me')
})

test('UX-024 scenario switcher is usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('#scenarioQuickbar')).toBeVisible()
  await expect(planner.locator('#activeScenario')).toBeVisible()
  await expect(planner.locator('#undoScenarioLoad')).toBeDisabled()
  await page.screenshot({ path: test.info().outputPath('explorer-ux024-mobile.png') })
})

test('UX-024 can migrate a previously exported v1 scenario backup', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  page.on('dialog', (dialog) => dialog.accept())
  await planner.locator('#scenarioName').fill('Legacy plan')
  await planner.locator('#saveScenario').click()
  const downloadPromise = page.waitForEvent('download')
  await planner.locator('#exportScenario').click()
  const download = await downloadPromise
  const payload = (await readFile(await download.path())).toString('utf8')
  expect(payload).toContain('"version": 2')
  const previousSchema = payload.replace('"version": 2', '"version": 1')

  await planner.locator('#scenarioFile').setInputFiles({
    name: 'old-scenarios.json',
    mimeType: 'application/json',
    buffer: Buffer.from(previousSchema),
  })
  await expect(planner.locator('#scenarioNotice')).toContainText('Backup upgraded to version 2')
  await expect(planner.locator('#scenarioCards .scenario-tile')).toHaveCount(1)
  await expect(planner.locator('#scenarioCards')).toContainText('Legacy plan')
})

test('UX-024 comparison warns when projection horizons differ', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#scenarioName').fill('Long horizon')
  await planner.locator('#saveScenario').click()
  await planner.getByRole('tab', { name: /Investments/i }).click()
  const outlook = planner.locator('#years').locator('xpath=ancestor::div[contains(@class,"section")][1]')
  if ((await outlook.locator('.section-toggle').getAttribute('aria-expanded')) === 'false') {
    await outlook.locator('.section-toggle').click()
  }
  await planner.locator('#years').fill('5')
  await planner.locator('#scenarioName').fill('Short horizon')
  await planner.locator('#saveScenario').click()
  await expect(planner.locator('#scenarioCompare')).toContainText('different projection horizons')
})

test('UX-025 reconciles source and allocation values from the live cash ledger', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const source = Number(await planner.locator('#sankeyAccounting').getAttribute('data-in'))
  const spent = Number(await planner.locator('#sankeyAccounting').getAttribute('data-out'))
  expect(source).toBeGreaterThan(0)
  expect(Math.abs(source - spent)).toBeLessThanOrEqual(0.02)
  await expect(planner.locator('#sankeyAccounting')).toHaveAttribute('data-balanced', 'true')
  await expect(planner.locator('#sankeyChart .sankey-link')).not.toHaveCount(0)
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="principal"]')).toHaveCount(1)
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="interest"]')).toHaveCount(1)
  // Zero monthly contributions do not create a fabricated ETF purchase ribbon.
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="etfbuy"]')).toHaveCount(0)
  await planner.getByRole('tab', { name: /Investments/i }).click()
  const etfSection = planner.locator('#etfInputsSection')
  if ((await etfSection.locator('.section-toggle').getAttribute('aria-expanded')) === 'false') {
    await etfSection.locator('.section-toggle').click()
  }
  await planner.locator('#monthlyH').fill('500')
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="etfbuy"]')).toHaveCount(1)
})

test('UX-025 annual run rate is 12 times monthly and view can toggle without changing inputs', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const monthly = Number(await planner.locator('#sankeyAccounting').getAttribute('data-in'))
  const price = await planner.locator('#price').inputValue()
  await planner.locator('[data-sankey-period="year"]').click()
  const annual = Number(await planner.locator('#sankeyAccounting').getAttribute('data-in'))
  expect(annual).toBeCloseTo(monthly * 12, 1)
  await expect(planner.locator('#sankeyPeriodName')).toContainText('annualized')
  await planner.locator('[data-sankey-view="table"]').click()
  await expect(planner.locator('#sankeyTableWrap')).toBeVisible()
  await expect(planner.locator('#sankeyChartScroll')).toBeHidden()
  await planner.locator('[data-sankey-view="diagram"]').click()
  await expect(planner.locator('#sankeyChartScroll')).toBeVisible()
  await expect(planner.locator('#price')).toHaveValue(price)
})

test('UX-025 displays a funding-gap source when cash use exceeds inflows', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Household/i }).click()
  const expenses = planner.locator('#utilities').locator('xpath=ancestor::div[contains(@class,"section")][1]')
  if ((await expenses.locator('.section-toggle').getAttribute('aria-expanded')) === 'false') {
    await expenses.locator('.section-toggle').click()
  }
  await planner.locator('#utilities').fill('50000')
  await planner.getByRole('tab', { name: /Overview/i }).click()
  await expect(planner.locator('#sankeyFundingWarning')).toBeVisible()
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="gap"]')).toHaveCount(1)
  await expect(planner.locator('#sankeyAccounting')).toHaveAttribute('data-balanced', 'true')
})

test('UX-025 ETF-only removes mortgage flows and preserves existing rental accounting', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="principal"]')).toHaveCount(0)
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="interest"]')).toHaveCount(0)
  await expect(planner.locator('#sankeyAccounting')).toHaveAttribute('data-balanced', 'true')
  await planner.getByRole('button', { name: 'All three', exact: true }).click()
  await expect(planner.locator('#sankeyTableRows [data-sankey-row="principal"]')).toHaveCount(1)
  await expect(planner.locator('#sankeyAccounting')).toHaveAttribute('data-balanced', 'true')
})

test('UX-025 mobile defaults to an accessible table and supports keyboard flow selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('#sankeyTableWrap')).toBeVisible()
  await planner.locator('[data-sankey-view="diagram"]').click()
  await expect(planner.locator('#sankeyChartScroll')).toBeVisible()
  const firstFlow = planner.locator('#sankeyChart [data-sankey-id]').first()
  await firstFlow.focus()
  await expect(planner.locator('#sankeyDetail')).toContainText('per month')
  await firstFlow.press('Enter')
  await expect(firstFlow).toHaveClass(/selected/)
  await page.screenshot({ path: test.info().outputPath('explorer-ux025-mobile.png') })
})

test('UX-026 shows a complete yearly wealth projection reconciled to signed components', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const years = Number(await planner.locator('#years').inputValue())
  await expect(planner.locator('#wealthTimelineRows tr')).toHaveCount(years + 1)
  await expect(planner.locator('#wealthCompositionChart [data-wealth-year]')).toHaveCount(
    years + 1,
  )

  const last = planner.locator('#wealthTimelineRows tr').last()
  const figures = await last.evaluate((node) => {
    const v = (key: string) => Number((node as HTMLElement).dataset[key])
    return {
      net: v('net'),
      home: v('homeEquity'),
      rental: v('rentalEquity'),
      etf: v('etf'),
      cash: v('cash'),
      homeLoan: v('homeLoan'),
      rentalLoan: v('rentalLoan'),
    }
  })
  expect(figures.net).toBeCloseTo(
    figures.home + figures.rental + figures.etf + figures.cash,
    1,
  )
  expect(figures.homeLoan).toBeGreaterThanOrEqual(0)
  expect(figures.rentalLoan).toBeGreaterThanOrEqual(0)
  await expect(planner.locator('#wealthChartStats')).toContainText('signed net position')
})

test('UX-026 switches equity and gross asset views without altering investment inputs', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const initial = await planner.locator('#wealthTimelineRows tr').last().getAttribute('data-net')
  const price = await planner.locator('#price').inputValue()
  await planner.locator('[data-wealth-mode="gross"]').click()
  await expect(planner.locator('[data-wealth-mode="gross"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(planner.locator('#wealthTimelineLegend')).toContainText('Home value')
  await expect(planner.locator('#wealthTimelineLegend')).toContainText('Property debt')
  await expect(planner.locator('#wealthTimelineRows tr').last()).toHaveAttribute(
    'data-net',
    initial ?? '',
  )
  await planner.locator('[data-wealth-mode="equity"]').click()
  await expect(planner.locator('#wealthTimelineLegend')).toContainText('Home equity')
  await expect(planner.locator('#price')).toHaveValue(price)
})

test('UX-026 selectable timeline range leaves the full planner horizon unchanged', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const horizon = await planner.locator('#years').inputValue()
  await planner.locator('#wealthRange').selectOption('5')
  await expect(planner.locator('#wealthTimelineRows tr')).toHaveCount(6)
  await expect(planner.locator('#wealthTimelineRows tr').last()).toHaveAttribute(
    'data-wealth-row',
    '5',
  )
  await planner.locator('#wealthRange').selectOption('10')
  await expect(planner.locator('#wealthTimelineRows tr')).toHaveCount(11)
  await planner.locator('#wealthRange').selectOption('all')
  await expect(planner.locator('#years')).toHaveValue(horizon)
})

test('UX-026 negative modeled cash lowers net worth and shows a visible warning', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Household/i }).click()
  const expenses = planner.locator('#utilities').locator('xpath=ancestor::div[contains(@class,"section")][1]')
  if ((await expenses.locator('.section-toggle').getAttribute('aria-expanded')) === 'false') {
    await expenses.locator('.section-toggle').click()
  }
  await planner.locator('#utilities').fill('50000')
  await planner.getByRole('tab', { name: /Overview/i }).click()
  await expect(planner.locator('#wealthTimelineWarning')).toBeVisible()
  const yearOne = planner.locator('#wealthTimelineRows tr[data-wealth-row="1"]')
  expect(Number(await yearOne.getAttribute('data-cash'))).toBeLessThan(0)
  const values = await yearOne.evaluate((node) => {
    const d = (node as HTMLElement).dataset
    return [d.homeEquity, d.rentalEquity, d.etf, d.cash, d.net].map(Number)
  })
  expect(values[4]).toBeCloseTo(values[0] + values[1] + values[2] + values[3], 1)
})

test('UX-026 ETF-only removes property debt and mobile year-by-year table is accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  const first = planner.locator('#wealthTimelineRows tr').first()
  expect(Number(await first.getAttribute('data-home-loan'))).toBe(0)
  expect(Number(await first.getAttribute('data-rental-loan'))).toBe(0)
  await planner.locator('[data-wealth-view="table"]').click()
  await expect(planner.locator('#wealthTimelineTablePane')).toBeVisible()
  await expect(planner.locator('#wealthTimelineChartPane')).toBeHidden()
  const selected = planner.locator('#wealthTimelineRows tr[data-wealth-row="5"]')
  await selected.focus()
  await expect(planner.locator('#wealthTimelineDetail')).toContainText('Year 5:')
  await planner.locator('[data-wealth-view="chart"]').click()
  await expect(planner.locator('#wealthTimelineChartPane')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('explorer-ux026-mobile.png') })
})
