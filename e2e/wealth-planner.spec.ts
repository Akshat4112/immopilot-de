import AxeBuilder from '@axe-core/playwright'
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
  const attrs = await Promise.all(
    ['data-net', 'data-home-equity', 'data-rental-equity', 'data-etf',
      'data-cash', 'data-home-loan', 'data-rental-loan'].map((name) => last.getAttribute(name)),
  )
  const [net, home, rental, etf, cash, homeLoan, rentalLoan] = attrs.map(Number)
  const figures = { net, home, rental, etf, cash, homeLoan, rentalLoan }
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
  const values = (await Promise.all(
    ['data-home-equity', 'data-rental-equity', 'data-etf', 'data-cash', 'data-net']
      .map((name) => yearOne.getAttribute(name)),
  )).map(Number)
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

test('UX-027 starts with an exact baseline and no invented life-event impact', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const horizon = Number(await planner.locator('#years').inputValue())
  await expect(planner.locator('#lifeEventsRows tr')).toHaveCount(horizon + 1)
  await expect(planner.locator('#lifeEventsList')).toContainText('No life events yet')
  await expect(planner.locator('#lifeEventsChart [data-event-year]')).toHaveCount(horizon + 1)
  for (let year = 0; year <= horizon; year++) {
    const delta = Number(
      await planner.locator('#lifeEventsRows tr').nth(year).getAttribute('data-life-diff'),
    )
    expect(Math.abs(delta)).toBeLessThan(0.01)
  }
})

test('UX-027 salary event changes net cash from the chosen year, not earlier', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#lifeEventType').selectOption('salary')
  await planner.locator('#lifeEventYear').fill('3')
  await planner.locator('#lifeEventAmount').fill('500')
  await planner.locator('#lifeEventName').fill('Salary promotion')
  await planner.locator('#lifeEventAdd').click()

  const yearTwo = planner.locator('#lifeEventsRows tr').nth(2)
  const yearThree = planner.locator('#lifeEventsRows tr').nth(3)
  expect(Number(await yearTwo.getAttribute('data-life-diff'))).toBeCloseTo(0, 1)
  expect(Number(await yearThree.getAttribute('data-life-diff'))).toBeCloseTo(6000, 1)
  await expect(planner.locator('#lifeEventsList')).toContainText('Salary promotion')
  await expect(planner.locator('#lifeEventsRows')).toContainText('Salary promotion')
  await planner.locator('#lifeEventsChart [data-event-year="3"]').focus()
  await expect(planner.locator('#lifeEventsDetail')).toContainText('Year 3:')
})

test('UX-027 ETF contribution and refinance events affect only their respective future years', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#lifeEventType').selectOption('etf')
  await planner.locator('#lifeEventYear').fill('4')
  await planner.locator('#lifeEventAmount').fill('200')
  await planner.locator('#lifeEventAdd').click()
  expect(Number(await planner.locator('#lifeEventsRows tr').nth(3).getAttribute('data-life-diff'))).toBeCloseTo(0, 1)
  expect(Math.abs(Number(await planner.locator('#lifeEventsRows tr').nth(5).getAttribute('data-life-diff')))).toBeGreaterThan(0.1)

  const sixthBefore = Number(await planner.locator('#lifeEventsRows tr').nth(6).getAttribute('data-life-diff'))
  await planner.locator('#lifeEventType').selectOption('refinance')
  await planner.locator('#lifeEventYear').fill('6')
  await planner.locator('#lifeEventAmount').fill('6')
  await planner.locator('#lifeEventAdd').click()
  await expect(planner.locator('#lifeEventsList')).toContainText('Home refinancing rate')
  const sixth = Number(await planner.locator('#lifeEventsRows tr').nth(6).getAttribute('data-life-diff'))
  expect(sixth).not.toBeCloseTo(sixthBefore, 1)
})

test('UX-027 expense event reduces reserves, removal restores baseline and milestone is annotation-only', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#lifeEventType').selectOption('expense')
  await planner.locator('#lifeEventYear').fill('2')
  await planner.locator('#lifeEventAmount').fill('12000')
  await planner.locator('#lifeEventName').fill('Major renovation')
  await planner.locator('#lifeEventAdd').click()
  expect(Number(await planner.locator('#lifeEventsRows tr').nth(2).getAttribute('data-life-diff'))).toBeCloseTo(-12000, 1)
  await planner.locator('#lifeEventsList [data-remove-life]').first().click()
  expect(Number(await planner.locator('#lifeEventsRows tr').nth(2).getAttribute('data-life-diff'))).toBeCloseTo(0, 1)
  await planner.locator('#lifeEventType').selectOption('milestone')
  await planner.locator('#lifeEventYear').fill('5')
  await planner.locator('#lifeEventName').fill('Buy rental apartment')
  await planner.locator('#lifeEventAdd').click()
  await expect(planner.locator('#lifeEventStatus')).toContainText('annotations only')
  expect(Number(await planner.locator('#lifeEventsRows tr').last().getAttribute('data-life-diff'))).toBeCloseTo(0, 1)
})

test('UX-027 events survive refresh, saved scenario load and one-step undo', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  page.on('dialog', (dialog) => dialog.accept())
  await planner.locator('#lifeEventType').selectOption('salary')
  await planner.locator('#lifeEventYear').fill('3')
  await planner.locator('#lifeEventAmount').fill('500')
  await planner.locator('#lifeEventName').fill('Job raise')
  await planner.locator('#lifeEventAdd').click()
  await planner.locator('#scenarioName').fill('Raise plan')
  await planner.locator('#saveScenario').click()
  await page.reload()
  await expect(planner.locator('#lifeEventsList')).toContainText('Job raise')
  await planner.locator('#lifeEventsList [data-remove-life]').first().click()
  await expect(planner.locator('#scenarioSaveStatus')).toContainText('Unsaved edits')
  await planner.locator('#activeScenario').selectOption('')
  await planner.locator('#activeScenario').selectOption({ label: 'Raise plan' })
  await expect(planner.locator('#lifeEventsList')).toContainText('Job raise')
  await planner.locator('#undoScenarioLoad').click()
  await expect(planner.locator('#lifeEventsList')).toContainText('No life events yet')
})

test('UX-027 mobile event form and timeline remain accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('#lifeEventsPanel')).toBeVisible()
  await expect(planner.locator('#lifeEventAdd')).toBeVisible()
  await planner.locator('#lifeEventYear').fill('2')
  await planner.locator('#lifeEventAdd').click()
  await expect(planner.locator('#lifeEventsList [data-remove-life]')).toHaveCount(1)
  await expect(planner.locator('#lifeEventsChart [data-event-year="2"]')).toHaveCount(1)
  await page.screenshot({ path: test.info().outputPath('explorer-ux027-mobile.png') })
})

test('UX-028 matches upfront cash against the down payment and purchase fees', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  const panel = planner.locator('#rentBuyExplorer')
  await expect(panel).toBeVisible()
  expect(Number(await panel.getAttribute('data-rb-pool'))).toBeCloseTo(20000, 1)
  expect(Number(await panel.getAttribute('data-rb-fees'))).toBeCloseTo(20000, 1)
  const start = planner.locator('#rbRows [data-rb-year-row="0"]')
  expect(Number(await start.getAttribute('data-rb-buy'))).toBeCloseTo(0, 1)
  expect(Number(await start.getAttribute('data-rb-etf'))).toBeCloseTo(20000, 1)
  expect(Number(await start.getAttribute('data-rb-cash'))).toBeCloseTo(20000, 1)
  await expect(planner.locator('#rbMethod')).toContainText('excludes common household income')
})

test('UX-028 reconciles equal yearly housing and saving budgets across alternatives', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  for (const year of [1, 5, 10, 20]) {
    const row = planner.locator('#rbRows [data-rb-year-row="' + year + '"]')
    const numbers = await Promise.all(
      ['data-rb-budget', 'data-rb-buy-contribution', 'data-rb-rent-contribution',
        'data-rb-buy-annual', 'data-rb-rent-annual'].map((name) => row.getAttribute(name)),
    )
    const [budget, buySaving, rentSaving, buyHousing, rentHousing] = numbers.map(Number)
    expect(budget).toBeGreaterThan(0)
    expect(buyHousing + buySaving).toBeCloseTo(budget, 1)
    expect(rentHousing + rentSaving).toBeCloseTo(budget, 1)
    expect(buySaving).toBeGreaterThanOrEqual(0)
    expect(rentSaving).toBeGreaterThanOrEqual(0)
  }
  await expect(planner.locator('#rbRows tr')).toHaveCount(26)
})

test('UX-028 rent assumptions change alternative wealth without modifying main housing inputs', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  const last = planner.locator('#rbRows tr').last()
  const original = Number(await last.getAttribute('data-rb-etf'))
  const home = await planner.locator('#price').inputValue()
  const existing = await planner.locator('#existingRent').inputValue()
  await planner.locator('#decisionRent').fill('1000')
  await planner.locator('#decisionRentGrowth').fill('3')
  const updated = Number(await last.getAttribute('data-rb-etf'))
  expect(updated).not.toBeCloseTo(original, 1)
  await expect(planner.locator('#price')).toHaveValue(home)
  await expect(planner.locator('#existingRent')).toHaveValue(existing)
  await page.reload()
  await expect(planner.locator('#decisionRent')).toHaveValue('1000')
  await expect(planner.locator('#decisionRentGrowth')).toHaveValue('3')
})

test('UX-028 rent plus ETF and rent plus cash agree when ETF return and fees are zero', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Investments/i }).click()
  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  await planner.locator('#ret').fill('0')
  await planner.locator('#ter').fill('0')
  for (const year of [0, 1, 5, 10, 25]) {
    const row = planner.locator('#rbRows [data-rb-year-row="' + year + '"]')
    const etf = Number(await row.getAttribute('data-rb-etf'))
    const cash = Number(await row.getAttribute('data-rb-cash'))
    expect(etf).toBeCloseTo(cash, 1)
  }
})

test('UX-028 shows negative property equity and isolates hypothetical buying in ETF-only mode', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await expect(planner.locator('#rbWarnings')).toContainText('NEW hypothetical')
  await expect(planner.locator('#rbRows tr')).toHaveCount(26)
  // ETF-only intentionally hides home controls, so enable a home strategy before
  // changing the hypothetical purchase's appreciation assumption.
  await planner.getByRole('button', { name: 'All three', exact: true }).click()
  await planner.getByRole('tab', { name: /Investments/i }).click()
  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  const outlook = planner.locator('#houseGrowth').locator(
    'xpath=ancestor::div[contains(@class,"section")][1]',
  )
  const toggle = outlook.locator('.section-toggle')
  if ((await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click()
  }
  await expect(planner.locator('#houseGrowth')).toBeVisible()
  await planner.locator('#houseGrowth').fill('-10')
  const yearOne = planner.locator('#rbRows [data-rb-year-row="1"]')
  expect(Number(await yearOne.getAttribute('data-rb-buy'))).toBeLessThan(0)
  await expect(planner.locator('#rbChart polyline')).toHaveCount(3)
})

test('UX-028 chart/table controls and planning range do not change the projection horizon', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  const horizon = await planner.locator('#years').inputValue()
  await planner.locator('#rbYears').selectOption('5')
  await expect(planner.locator('#rbRows tr')).toHaveCount(6)
  await planner.locator('[data-rb-metric="paid"]').click()
  await expect(planner.locator('#rbLegend')).toContainText('cumulative housing cash paid')
  await planner.locator('[data-rb-metric="cost"]').click()
  await expect(planner.locator('#rbLegend')).toContainText('interest')
  await planner.locator('[data-rb-view="table"]').click()
  await expect(planner.locator('#rbTablePane')).toBeVisible()
  await expect(planner.locator('#rbChartPane')).toBeHidden()
  await planner.locator('[data-rb-view="chart"]').click()
  await planner.locator('#rbChart [data-rb-year="3"]').focus()
  await expect(planner.locator('#rbDetail')).toContainText('Year 3:')
  await expect(planner.locator('#years')).toHaveValue(horizon)
})

test('UX-028 mobile uses semantic table first and supports comparison interaction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await expect(planner.locator('#rbTablePane')).toBeVisible()
  const target = planner.locator('#rbRows [data-rb-year-row="5"]')
  await target.focus()
  await expect(planner.locator('#rbDetail')).toContainText('Year 5:')
  await planner.locator('[data-rb-view="chart"]').click()
  await expect(planner.locator('#rbChartPane')).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('explorer-ux028-mobile.png') })
})

test('UX-029 mortgage opening debt and yearly balances reconcile to the household engine', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  const panel = planner.locator('#amortPanel')
  await expect(panel).toBeVisible()
  await expect(panel).toHaveAttribute('data-mortgage-reconciled', 'true')
  await expect(planner.locator('#amortRows tr')).toHaveCount(26)
  expect(Number(await panel.getAttribute('data-mortgage-opening'))).toBeCloseTo(200000, 1)
  const original = planner.locator('#amortRows [data-amort-row="10"]')
  const household = planner.locator('#wealthTimelineRows [data-wealth-row="10"]')
  expect(Number(await original.getAttribute('data-amort-debt'))).toBeCloseTo(
    Number(await household.getAttribute('data-home-loan')),
    1,
  )
})

test('UX-029 every annual debt balance obeys opening plus interest minus payments', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  for (const year of [1, 2, 5, 10, 20, 25]) {
    const row = planner.locator('#amortRows [data-amort-row="' + year + '"]')
    const attributes = await Promise.all(
      ['data-amort-open', 'data-amort-interest', 'data-amort-paid',
        'data-amort-extra', 'data-amort-debt'].map((name) => row.getAttribute(name)),
    )
    const [opening, interest, scheduled, extra, closing] = attributes.map(Number)
    expect(opening + interest - scheduled - extra).toBeCloseTo(closing, 1)
    expect(interest).toBeGreaterThanOrEqual(0)
    expect(scheduled).toBeGreaterThanOrEqual(0)
    expect(extra).toBeGreaterThanOrEqual(0)
  }
})

test('UX-029 additional payments decrease loan balance and accrued interest but never change the main mortgage', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const originalEmi = await planner.locator('#emi').inputValue()
  const originalExtra = await planner.locator('#extra').inputValue()
  const originalHomeDebt = await planner.locator('#wealthTimelineRows [data-wealth-row="10"]').getAttribute('data-home-loan')
  const tenth = planner.locator('#amortRows [data-amort-row="10"]')
  const base = Number(await tenth.getAttribute('data-amort-debt'))
  const alt = Number(await tenth.getAttribute('data-amort-alt-debt'))
  expect(alt).toBeLessThan(base)
  expect(Number(await tenth.getAttribute('data-amort-interest-saved'))).toBeGreaterThan(0)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await planner.locator('#mortgageExtraWhatIf').fill('0')
  expect(Number(await tenth.getAttribute('data-amort-alt-debt'))).toBeCloseTo(base, 1)
  expect(Number(await tenth.getAttribute('data-amort-interest-saved'))).toBeCloseTo(0, 1)
  await expect(planner.locator('#emi')).toHaveValue(originalEmi)
  await expect(planner.locator('#extra')).toHaveValue(originalExtra)
  await expect(planner.locator('#wealthTimelineRows [data-wealth-row="10"]')).toHaveAttribute(
    'data-home-loan',
    originalHomeDebt ?? '',
  )
  await planner.locator('#mortgageExtraWhatIf').fill('3000')
  await page.reload()
  await expect(planner.locator('#mortgageExtraWhatIf')).toHaveValue('3000')
})

test('UX-029 makes negative amortization and negative property equity explicit', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Properties/i }).click()
  await planner.locator('#emi').fill('100')
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await expect(planner.locator('#amortWarning')).toContainText('Unpaid interest increases debt')
  const first = planner.locator('#amortRows [data-amort-row="1"]')
  expect(Number(await first.getAttribute('data-amort-unpaid'))).toBeGreaterThan(0)
  expect(Number(await first.getAttribute('data-amort-debt'))).toBeGreaterThan(
    Number(await first.getAttribute('data-amort-open')),
  )
  expect(Number(await first.getAttribute('data-amort-equity'))).toBeLessThan(0)
  await expect(planner.locator('#amortPanel')).toHaveAttribute('data-mortgage-reconciled', 'true')
})

test('UX-029 rental selection reconciles to rental property engine and warns about tax effects', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await planner.locator('#amortTarget').selectOption({ index: 1 })
  await expect(planner.locator('#amortPanel')).toHaveAttribute('data-mortgage-reconciled', 'true')
  await expect(planner.locator('#amortWarning')).toContainText('Rental interest deductions')
  expect(Number(await planner.locator('#amortRows [data-amort-row="0"]').getAttribute('data-amort-debt'))).toBeGreaterThan(0)
  await planner.locator('#mortgageExtraWhatIf').fill('0')
  const row = planner.locator('#amortRows [data-amort-row="10"]')
  expect(Number(await row.getAttribute('data-amort-alt-debt'))).toBeCloseTo(
    Number(await row.getAttribute('data-amort-debt')),
    1,
  )
})

test('UX-029 respects loan-free strategy without fabricating interest savings', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await expect(planner.locator('#amortWarning')).toContainText('No outstanding mortgage')
  await expect(planner.locator('#amortBaseDebt')).toContainText('0')
  expect(Number(await planner.locator('#amortRows [data-amort-row="5"]').getAttribute('data-amort-interest-saved'))).toBe(0)
  await expect(planner.locator('#amortPanel')).toHaveAttribute('data-mortgage-reconciled', 'true')
})

test('UX-029 mortgage metric, year range and accessible table do not change the plan', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  const originalHorizon = await planner.locator('#years').inputValue()
  await planner.locator('#mortgageYears').selectOption('5')
  await expect(planner.locator('#amortRows tr')).toHaveCount(6)
  await expect(planner.locator('#amortPanel')).toHaveAttribute('data-mortgage-horizon', '5')
  await planner.locator('[data-mortgage-mode="payments"]').click()
  await expect(planner.locator('#amortLegend')).toContainText('Accrued interest')
  await planner.locator('[data-mortgage-mode="savings"]').click()
  await expect(planner.locator('#amortLegend')).toContainText('Cumulative interest avoided')
  await planner.locator('[data-mortgage-view="table"]').click()
  await expect(planner.locator('#amortTablePane')).toBeVisible()
  await expect(planner.locator('#amortChartPane')).toBeHidden()
  await planner.locator('#amortRows [data-amort-row="3"]').focus()
  await expect(planner.locator('#amortDetail')).toContainText('Year 3:')
  await planner.locator('[data-mortgage-view="chart"]').click()
  await planner.locator('#amortChart [data-amort-year="2"]').focus()
  await expect(planner.locator('#amortDetail')).toContainText('Year 2:')
  await expect(planner.locator('#years')).toHaveValue(originalHorizon)
})

test('UX-029 mobile defaults to a semantic annual mortgage table', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await expect(planner.locator('#amortTablePane')).toBeVisible()
  await expect(planner.locator('#amortRows tr')).toHaveCount(26)
  await planner.locator('[data-mortgage-view="chart"]').click()
  await expect(planner.locator('#amortChartPane')).toBeVisible()
  await expect(planner.locator('#amortChart [data-amort-year="10"]')).toHaveCount(1)
  await page.screenshot({ path: test.info().outputPath('explorer-ux029-mobile.png') })
})

test('UX-030 annual rental waterfall reconciles every step to the canonical after-tax ledger', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#rentalWaterfallPanel')
  await expect(panel).toBeVisible()
  await expect(panel).toHaveAttribute('data-waterfall-balanced', 'true')
  await expect(panel).toHaveAttribute('data-waterfall-status', 'available')
  const income = Number(await panel.getAttribute('data-waterfall-collected'))
  const before = Number(await panel.getAttribute('data-waterfall-before'))
  const tax = Number(await panel.getAttribute('data-waterfall-tax'))
  const after = Number(await panel.getAttribute('data-waterfall-after'))
  expect(income).toBeGreaterThan(0)
  expect(before - tax).toBeCloseTo(after, 1)
  const entries = planner.locator('#rentalWaterfallRows tr')
  let total = 0
  for (let index = 0; index < (await entries.count()) - 1; index++) {
    total += Number(await entries.nth(index).getAttribute('data-waterfall-value'))
  }
  expect(total).toBeCloseTo(after, 1)
  expect(Number(await planner.locator('[data-waterfall-row="result"]').getAttribute('data-waterfall-running'))).toBeCloseTo(
    after, 1,
  )
  await expect(planner.locator('[data-waterfall-row="interest"]')).toHaveCount(1)
  await expect(planner.locator('[data-waterfall-row="principal"]')).toHaveCount(1)
  await expect(planner.locator('[data-waterfall-row="reserve"]')).toHaveCount(1)
})

test('UX-030 makes tenancy advances, vacancy and recoverable costs distinct cash movements', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const val = async (key: string) =>
    Number(await planner.locator('[data-waterfall-row="' + key + '"]').getAttribute('data-waterfall-value'))
  expect(await val('cold')).toBeGreaterThan(0)
  expect(await val('advances')).toBeGreaterThan(0)
  expect(await val('vacancy')).toBeLessThan(0)
  expect(await val('recoverable')).toBeLessThan(0)
  expect(await val('nonrecoverable')).toBeLessThan(0)
  expect(await val('reserve')).toBeLessThan(0)
  const total = (await val('cold')) + (await val('advances')) + (await val('vacancy'))
  expect(total).toBeCloseTo(
    Number(await planner.locator('#rentalWaterfallPanel').getAttribute('data-waterfall-collected')),
    1,
  )
  await expect(planner.locator('#rentalWaterfallWarning')).not.toContainText('nonzero reconciliation')
})

test('UX-030 monthly and annual views and future-year selection do not change core rental inputs', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const baseline = await planner.locator('#rentalWaterfallCollected').textContent()
  const currentRent = await planner.locator('#r1_kalt').inputValue()
  await planner.locator('[data-waterfall-period="year"]').click()
  await expect(planner.locator('[data-waterfall-period="year"]')).toHaveAttribute('aria-pressed', 'true')
  const annual = await planner.locator('#rentalWaterfallCollected').textContent()
  expect(annual).not.toBe(baseline)
  await planner.locator('#rentalWaterfallYear').selectOption('5')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-status', 'available')
  await expect(planner.locator('#rentalWaterfallYear')).toHaveValue('5')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-balanced', 'true')
  await planner.locator('[data-waterfall-period="month"]').click()
  await expect(planner.locator('[data-waterfall-period="month"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(planner.locator('#r1_kalt')).toHaveValue(currentRent)
  await expect(planner.locator('#years')).toHaveValue('25')
})

test('UX-030 a single property has standalone tax, which is not a portfolio share', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#rentalWaterfallScope').selectOption('1')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-source', 'standalone')
  await expect(planner.locator('#rentalWaterfallWarning')).toContainText('NOT an additive portion')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-balanced', 'true')
  const initial = Number(await planner.locator('#rentalWaterfallPanel').getAttribute('data-waterfall-collected'))
  await planner.getByRole('tab', { name: /Properties/i }).click()
  const section = planner.locator('#rentalInputsSection')
  const toggle = section.locator('.section-toggle')
  if ((await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click()
  }
  await planner.locator('#addRental').click()
  await planner.locator('#rentalWaterfallScope').selectOption('all')
  const combined = Number(await planner.locator('#rentalWaterfallPanel').getAttribute('data-waterfall-collected'))
  expect(combined).toBeGreaterThan(initial)
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-balanced', 'true')
  await planner.locator('#rentalWaterfallScope').selectOption('1')
  expect(Number(await planner.locator('#rentalWaterfallPanel').getAttribute('data-waterfall-collected'))).toBeCloseTo(
    initial, 1,
  )
  await planner.locator('#rentalWaterfallScope').selectOption('2')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-source', 'standalone')
  await planner.locator('#rentalInputs [data-remove="2"]').click()
  await expect(planner.locator('#rentalWaterfallScope')).toHaveValue('all')
})

test('UX-030 rental cash waterfall is economic even when household tax timing is cash', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const taxBefore = await planner.locator('#rentalWaterfallPanel').getAttribute('data-waterfall-tax')
  const cashBefore = await planner.locator('#rentalWaterfallPanel').getAttribute('data-waterfall-after')
  await planner.getByRole('tab', { name: /Properties/i }).click()
  await planner.getByRole('button', { name: 'All details', exact: true }).click()
  const rentalSection = planner.locator('#rentalInputsSection')
  const toggle = rentalSection.locator('.section-toggle')
  if ((await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click()
  }
  await expect(planner.locator('#rentalTaxTiming')).toBeVisible()
  await planner.locator('#rentalTaxTiming').selectOption('accrual')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-tax', taxBefore ?? '')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-after', cashBefore ?? '')
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-balanced', 'true')
})

test('UX-030 ETF-only or no-rental strategy shows a helpful empty state', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('button', { name: 'ETF only', exact: true }).click()
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-status', 'empty')
  await expect(planner.locator('#rentalBridgeChart')).toContainText('Add a rental apartment')
  await expect(planner.locator('#rentalWaterfallRows')).toContainText('No rental apartment')
  await expect(planner.locator('#rentalWaterfallAfter')).toHaveText('—')
  await planner.getByRole('button', { name: 'All three', exact: true }).click()
  await expect(planner.locator('#rentalWaterfallPanel')).toHaveAttribute('data-waterfall-status', 'available')
})

test('UX-030 table and interactive waterfall bars support keyboard selection and mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('#rentalWaterfallTablePane')).toBeVisible()
  await expect(planner.locator('#rentalWaterfallChartPane')).toBeHidden()
  const interest = planner.locator('[data-waterfall-row="interest"]')
  await interest.focus()
  await expect(planner.locator('#rentalWaterfallDetail')).toContainText('Interest covered')
  await planner.locator('[data-waterfall-view="chart"]').click()
  await expect(planner.locator('#rentalWaterfallChartPane')).toBeVisible()
  const point = planner.locator('#rentalBridgeChart [data-waterfall-step="principal"]')
  await point.focus()
  await point.press('Enter')
  await expect(planner.locator('#rentalWaterfallDetail')).toContainText('Mortgage principal paid')
  await expect(point).toHaveClass(/selected/)
  await page.screenshot({ path: test.info().outputPath('ux030-rental-waterfall-mobile.png') })
})

test('ETF tax visualizer shows source-backed values and does not invent liquidation tax', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#etfTaxPanel')
  await expect(panel).toBeVisible()
  await expect(panel.locator('#etfTaxLiquidation')).toHaveText('Not calculated')
  await expect(panel).toHaveAttribute('data-tax-complete', 'false')
  await expect(panel.locator('#etfTaxRows tr').first()).toContainText('Not modeled')
  await panel.locator('#etfTaxYear').selectOption('0')
  await expect(panel).toHaveAttribute('data-selected-year', '0')
  // Projection horizon is in a collapsed advanced panel; update the input and
  // dispatch its normal change event without relying on visibility.
  await planner
    .locator('#years')
    .evaluate(
      "(input) => { input.value = '25'; input.dispatchEvent(new Event('change', { bubbles: true })); }",
    )
  await expect(panel.locator('#etfTaxYear')).toHaveValue('0')
  await expect(panel).toHaveAttribute('data-selected-year', '0')
  await panel.locator('#etfTaxYear').selectOption('5')
  await expect(panel).toHaveAttribute('data-selected-year', '5')
  await panel.locator('#etfTaxDisplay').selectOption('table')
  await expect(panel.locator('#etfTaxChartPane')).toBeHidden()
  const years = Number(await planner.locator('#years').inputValue())
  await expect(panel.locator('#etfTaxRows tr')).toHaveCount(years + 1)
})

test('ETF tax visualizer has an accessible mobile table fallback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#etfTaxPanel')
  await expect(panel).toBeVisible()
  await expect(panel.locator('#etfTaxChartPane')).toBeHidden()
  await expect(panel.getByRole('table')).toBeVisible()
  await expect(panel.locator('#etfTaxLiquidation')).toHaveText('Not calculated')
})

test('UX-032 ETF annual evidence has a caption and scoped headers after projection changes', async ({
  page,
}) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#etfTaxPanel')
  const table = panel.getByRole('table')
  await expect(table.locator('caption')).toContainText('full-sale taxes are unavailable')
  await expect(table.locator('thead th[scope="col"]')).toHaveCount(7)
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(
    Number(await planner.locator('#years').inputValue()) + 1,
  )
  await panel.locator('#etfTaxYear').selectOption('5')
  await expect(panel).toHaveAttribute('data-selected-year', '5')
  await expect(table.locator('tbody tr').nth(5).locator('th[scope="row"]')).toHaveText('5')
  await expect(table.locator('tbody tr').nth(5).locator('td').nth(5)).toHaveText('Not modeled')
  await panel.locator('#etfTaxDisplay').selectOption('table')
  await expect(table).toBeVisible()
  await expect(panel.locator('#etfTaxLiquidation')).toHaveText('Not calculated')
})


test('UX-032 ETF CSV download mirrors visible evidence and keeps liquidation unavailable', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#etfTaxPanel')
  await expect(panel).toBeVisible()
  const firstYear = await panel.locator('.etf-tax-table tbody th').first().innerText()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    panel.getByRole('button', { name: 'Download ETF annual evidence CSV' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('etf-annual-evidence.csv')
  const csv = await readFile(await download.path(), 'utf8')
  expect(csv.charCodeAt(0)).toBe(0xfeff)
  expect(csv).toContain('Not modeled')
  expect(csv).toContain(`"${firstYear.trim()}"`)
  const rows = await Promise.all(
    (await panel.locator('.etf-tax-table tbody tr').all()).map(async (row) =>
      Promise.all(
        (await row.locator('[data-csv-number]').all()).map((cell) =>
          cell.getAttribute('data-csv-number'),
        ),
      ),
    ),
  )
  const lines = csv.trimEnd().split('\r\n').slice(1)
  expect(lines).toHaveLength(rows.length)
  rows.forEach((values, index) => {
    expect(lines[index]?.split(',').slice(1, 5)).toEqual(values)
  })
  expect(csv).not.toContain('undefined')
})

test('UX-032 rental CSV export is keyboard accessible and reflects selected period', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('[data-waterfall-period="month"]').click()
  const button = planner.getByRole('button', { name: 'Download rental cash-flow CSV' })
  await button.focus()
  await expect(button).toBeFocused()
  const [download] = await Promise.all([page.waitForEvent('download'), button.press('Enter')])
  expect(download.suggestedFilename()).toBe('rental-cash-flow.csv')
  const csv = await readFile(await download.path(), 'utf8')
  expect(csv).toContain('"Cash movement (EUR/month)"')
  expect(csv).toContain('"Running cash (EUR/month)"')
  expect(csv).toContain('"Interest covered by mortgage payments"')
  expect(csv).toContain('"Mortgage principal paid"')
  const amounts = await Promise.all(
    (await planner.locator('#rentalWaterfallRows tr').all()).map(async (row) =>
      Promise.all(
        (await row.locator('[data-csv-number]').all()).map((cell) =>
          cell.getAttribute('data-csv-number'),
        ),
      ),
    ),
  )
  const lines = csv.trimEnd().split('\r\n').slice(1)
  expect(lines).toHaveLength(amounts.length)
  amounts.forEach((values, index) => {
    expect(lines[index]).toContain(',' + values.join(',') + ',')
  })
  expect(csv).not.toContain('undefined')
})

test('UX-032 export controls remain keyboard reachable at narrow widths', async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 812 })
    await page.goto('./')
    const planner = page.frameLocator(frameSelector)
    const panel = planner.locator('#etfTaxPanel')
    await panel.locator('#etfTaxDisplay').selectOption('table')
    const button = panel.getByRole('button', { name: 'Download ETF annual evidence CSV' })
    await expect(button).toBeVisible()
    await button.focus()
    await expect(button).toBeFocused()
    const [download] = await Promise.all([page.waitForEvent('download'), button.press('Enter')])
    expect(download.suggestedFilename()).toBe('etf-annual-evidence.csv')
    await expect(panel.getByRole('table')).toBeVisible()
  }
})


test('UX-032 chart data panels pass scoped accessibility checks', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('#etfTaxDisplay').selectOption('table')
  await expect(planner.locator('#etfTaxPanel').getByRole('table')).toBeVisible()
  const results = await new AxeBuilder({ page })
    .include([frameSelector, '#etfTaxPanel'])
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.passes.length).toBeGreaterThan(0)
  expect(results.violations).toEqual([])
})

test('UX-032 rental evidence table passes scoped accessibility checks on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('#rentalWaterfallTablePane')).toBeVisible()
  const results = await new AxeBuilder({ page })
    .include([frameSelector, '#rentalWaterfallPanel'])
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.passes.length).toBeGreaterThan(0)
  expect(results.violations).toEqual([])
})

test('UX-032 rejects invalid numeric evidence instead of downloading incomplete CSV', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#etfTaxPanel')
  const cell = panel.locator('[data-csv-number]').first()
  const downloads: string[] = []
  page.on('download', (download) => downloads.push(download.suggestedFilename()))
  for (const invalid of ['Infinity', '', '   ']) {
    await cell.evaluate((element, value) => {
      element.setAttribute('data-csv-number', value)
    }, invalid)
    await panel.getByRole('button', { name: 'Download ETF annual evidence CSV' }).click()
    await expect(panel.getByText('CSV export unavailable:', { exact: false })).toBeVisible()
    expect(downloads).toEqual([])
  }
})

test('UX-032 rejects ambiguous evidence column labels', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  const panel = planner.locator('#etfTaxPanel')
  const headers = panel.locator('thead th')
  const firstLabel = await headers.first().innerText()
  const downloads: string[] = []
  page.on('download', (download) => downloads.push(download.suggestedFilename()))
  for (const label of ['   ', firstLabel.toUpperCase()]) {
    await headers.nth(1).evaluate((cell, value) => {
      cell.textContent = value
    }, label)
    await panel.getByRole('button', { name: 'Download ETF annual evidence CSV' }).click()
    await expect(panel.getByText('CSV export unavailable:', { exact: false })).toBeVisible()
    expect(downloads).toEqual([])
  }
})

test('UX-032 dark theme preserves keyboard access and printable report', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await expect(planner.locator('body')).toHaveAttribute('data-theme', 'dark')
  const panel = planner.locator('#etfTaxPanel')
  await panel.locator('#etfTaxDisplay').selectOption('table')
  const button = panel.getByRole('button', { name: 'Download ETF annual evidence CSV' })
  await button.focus()
  await expect(button).toBeFocused()
  await expect(panel.getByRole('table')).toBeVisible()
  await expect(panel.locator('#etfTaxLiquidation')).toHaveText('Not calculated')
  await page.emulateMedia({ media: 'print' })
  await expect(planner.locator('#printableReport')).toBeVisible()
  await expect(planner.locator('#reportSummary')).not.toBeEmpty()
  await expect(button).toBeHidden()
})

test('UX-032 household and wealth CSVs retain period labels and canonical numbers', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.locator('[data-sankey-period="year"]').click()
  await planner.locator('#wealthRange').selectOption('5')
  for (const config of [
    {
      button: 'Download household cash-flow CSV',
      table: '.sankey-table',
      header: 'Amount (EUR/year run-rate)',
    },
    {
      button: 'Download net worth timeline CSV',
      table: '.wealth-timeline-table',
      header: 'Net position (EUR)',
    },
  ]) {
    const button = planner.getByRole('button', { name: config.button })
    const table = planner.locator(config.table)
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
    const csv = await readFile(await download.path(), 'utf8')
    const lines = csv.trimEnd().split('\r\n')
    expect(lines[0]).toContain('"' + config.header + '"')
    const rows = await table.locator('tbody tr').all()
    expect(lines).toHaveLength(rows.length + 1)
    for (const [index, row] of rows.entries()) {
      for (const cell of await row.locator('[data-csv-number]').all()) {
        const raw = await cell.getAttribute('data-csv-number')
        expect(raw).not.toBeNull()
        expect(lines[index + 1]?.split(',')).toContain(String(Number(raw)))
      }
    }
  }
})

test('UX-032 comparison and mortgage CSVs preserve every canonical evidence column', async ({ page }) => {
  await page.goto('./')
  const planner = page.frameLocator(frameSelector)
  await planner.getByRole('tab', { name: /Compare/i }).click()
  await planner.locator('#rbYears').selectOption('5')
  for (const config of [
    {
      button: 'Download rent buy comparison CSV',
      table: '.rb-table',
      filename: 'rent-buy-comparison.csv',
      header: 'Matched annual budget (EUR)',
    },
    {
      button: 'Download mortgage schedule CSV',
      table: '.mortgage-explorer-table',
      filename: 'mortgage-schedule.csv',
      header: 'Closing debt (EUR)',
    },
  ]) {
    const button = planner.getByRole('button', { name: config.button })
    const table = planner.locator(config.table)
    await button.focus()
    await expect(button).toBeFocused()
    const [download] = await Promise.all([page.waitForEvent('download'), button.press('Enter')])
    expect(download.suggestedFilename()).toBe(config.filename)
    const csv = await readFile(await download.path(), 'utf8')
    const lines = csv.trimEnd().split('\r\n')
    expect(lines[0]).toContain('"' + config.header + '"')
    const rows = await table.locator('tbody tr').all()
    expect(rows.length).toBeGreaterThan(0)
    expect(lines).toHaveLength(rows.length + 1)
    for (const [index, row] of rows.entries()) {
      const year = await row.locator('th').innerText()
      const values = await row.locator('[data-csv-number]').evaluateAll((cells) =>
        cells.map((cell) => String(Number(cell.getAttribute('data-csv-number')))),
      )
      expect(lines[index + 1]?.split(',')).toEqual(['"' + year + '"', ...values])
    }
  }
})
