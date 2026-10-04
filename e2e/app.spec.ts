import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const applicationPath = '/immopilot-de/'

async function completeFinancedPurchase(page: Page) {
  await page.goto('./#/purchase-costs')
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')

  const budgetStatuses = page.locator('.budget-field__status-select')
  await budgetStatuses.nth(0).selectOption('confirmed-zero')
  await budgetStatuses.nth(1).selectOption('confirmed-zero')

  await page.getByRole('link', { name: 'Zur Finanzierung →' }).click()
  await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('66250')
  await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('50000')
  await expect(page.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
}

test('loads the desktop shell and keeps route navigation under the Pages path', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('./')

  await expect(page).toHaveTitle('ImmoPilot DE · Immobilien transparent planen')
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

  await expect(page.getByRole('link', { name: 'Kapitalanlage bewerten' })).toBeVisible()
  await page.getByRole('link', { name: 'Für Eigennutzung rechnen' }).focus()
  await expect(page.getByRole('link', { name: 'Für Eigennutzung rechnen' })).toHaveCSS(
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

  await page.getByRole('link', { name: 'Für Eigennutzung rechnen' }).click()

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

test('calculates acquisition costs after the user enters a purchase price', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Für Eigennutzung rechnen' }).click()

  await expect(page.getByRole('heading', { name: 'Berechnung fehlgeschlagen' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')

  await expect(page.getByRole('heading', { name: 'Grunderwerbsteuer' })).toBeVisible()
  await expect(page.getByText('12.500,00 €')).toBeVisible()
  await expect(page.getByText('Budgets nach dem Kauf noch nicht bestätigt')).toBeVisible()

  const budgetStatuses = page.locator('.budget-field__status-select')
  await budgetStatuses.nth(0).selectOption('confirmed-zero')
  await budgetStatuses.nth(1).selectOption('confirmed-zero')

  await expect(page.getByRole('heading', { name: 'Gesamtkosten' })).toBeVisible()
  await expect(page.getByText('Berechnung fehlgeschlagen')).toHaveCount(0)
})

test('supports English decimal rate overrides and localized state names', async ({ page }) => {
  await page.goto('./#/purchase-costs')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('textbox', { name: 'Purchase price' }).fill('250000')

  await expect(page.getByRole('option', { name: 'Bavaria' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Advanced inputs' }).click()
  await page.getByRole('textbox', { name: 'Property transfer tax (Rate)' }).fill('1.5')

  const transferTaxCard = page.getByRole('heading', { name: 'Property transfer tax' }).locator('..')
  await expect(transferTaxCard.getByText('€3,750.00')).toBeVisible()
  await expect(transferTaxCard.getByText(/1\.50%/)).toBeVisible()
})

test('carries completed purchase costs into the financing and mortgage workflow', async ({
  page,
}) => {
  await page.goto('./')
  await page.getByRole('link', { name: 'Für Eigennutzung rechnen' }).click()
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')

  const budgetStatuses = page.locator('.budget-field__status-select')
  await budgetStatuses.nth(0).selectOption('confirmed-zero')
  await budgetStatuses.nth(1).selectOption('confirmed-zero')

  await page.getByRole('link', { name: 'Zur Finanzierung →' }).click()

  await expect(page).toHaveURL(/#\/financing$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Finanzierung planen' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('66250')
  await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('50000')

  await expect(page.getByRole('heading', { name: 'Finanzierung gedeckt' })).toBeVisible()
  await expect(page.getByText(/200\.000/)).toBeVisible()
  await expect(page.getByText(/916,67/)).toBeVisible()
  await expect(page.getByText(/152\.188,73/)).toBeVisible()

  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  await page.getByRole('radio', { name: 'Monatlich', exact: true }).check()
  await page.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }).check()
  const baselineSchedule = page.getByRole('table', {
    name: 'Tilgungsplan ohne Sondertilgung',
  })
  await expect(baselineSchedule.getByRole('rowheader', { name: '12', exact: true })).toBeVisible()
  await expect(baselineSchedule.getByRole('columnheader', { name: 'Zinsen' })).toBeVisible()

  await page.getByRole('button', { name: 'English' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Plan financing' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Available equity' })).toHaveValue('66250')

  await page.getByRole('link', { name: 'Open analysis →' }).click()

  await expect(page).toHaveURL(/#\/results$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Evaluate one property' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Refinancing stress test' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose an offer method' })).toBeVisible()
})

test('explores full monthly schedules and payoff with bounded pagination @cross-browser', async ({
  page,
}, testInfo) => {
  await completeFinancedPurchase(page)
  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  await page.getByRole('radio', { name: 'Monatlich', exact: true }).check()
  await page.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }).check()
  const baseline = page.getByRole('region', {
    name: 'Tilgungsplan ohne Sondertilgung',
    exact: true,
  })
  await expect(baseline.getByRole('columnheader', { name: 'Anfangsschuld' })).toBeVisible()
  await expect(baseline.getByRole('row')).toHaveCount(25)
  await baseline.getByRole('button', { name: 'Letzte Seite' }).click()
  await expect(baseline.getByRole('rowheader', { name: /348.*Volltilgung/ })).toBeVisible()
  await expect(baseline.getByText('Monate 337–348 von 348 · Seite 15 von 15')).toBeVisible()
  await expect(
    baseline
      .getByRole('rowheader', { name: /348.*Volltilgung/ })
      .locator('..')
      .getByRole('cell')
      .last(),
  ).toContainText(/^0\s*€$/)
  await page.getByRole('button', { name: 'English' }).click()
  const englishBaseline = page.getByRole('region', {
    name: 'Schedule without additional repayments',
    exact: true,
  })
  await expect(englishBaseline.getByText('Months 337–348 of 348 · Page 15 of 15')).toBeVisible()
  await expect(englishBaseline.getByText(/Constant-rate projection/)).toBeVisible()

  await page.getByRole('textbox', { name: 'Amount per loan year' }).fill('5000')
  await expect(englishBaseline.getByText('Months 1–24 of 348 · Page 1 of 15')).toBeVisible()
  const selected = page.getByRole('region', {
    name: 'Schedule with additional repayments',
    exact: true,
  })
  await selected.getByRole('button', { name: 'Last page' }).click()
  await expect(selected.getByRole('rowheader', { name: /203.*Payoff/ })).toBeVisible()
  await expect(englishBaseline.getByRole('rowheader', { name: '1', exact: true })).toBeVisible()
  await expect(selected.getByRole('row')).toHaveCount(12)
  await selected.getByRole('button', { name: 'First page' }).click()
  const accessibility = await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()
  expect(accessibility.violations).toEqual([])
  await page
    .locator('.amortization-breakdown')
    .screenshot({ animations: 'disabled', path: testInfo.outputPath('explorer-desktop.png') })
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 })
    const scroll = selected.getByRole('region', {
      name: 'Scroll Schedule with additional repayments horizontally',
      exact: true,
    })
    await scroll.focus()
    await expect(scroll).toBeFocused()
    const scrollBounds = await scroll.boundingBox()
    expect(scrollBounds).not.toBeNull()
    expect(scrollBounds!.x).toBeGreaterThanOrEqual(0)
    expect(scrollBounds!.x + scrollBounds!.width).toBeLessThanOrEqual(width)
    const nextPage = selected.getByRole('button', { name: 'Next' })
    await nextPage.scrollIntoViewIfNeeded()
    await expect(nextPage).toBeInViewport()
    const buttonBounds = await nextPage.boundingBox()
    expect(buttonBounds).not.toBeNull()
    expect(buttonBounds!.x).toBeGreaterThanOrEqual(0)
    expect(buttonBounds!.x + buttonBounds!.width).toBeLessThanOrEqual(width)
    const tableOverflow = await scroll.evaluate(
      (element: { scrollWidth: number; clientWidth: number }) =>
        element.scrollWidth > element.clientWidth,
    )
    const documentOverflow = await page.evaluate<boolean>(
      `document.documentElement.scrollWidth > document.documentElement.clientWidth`,
    )
    expect(tableOverflow).toBe(true)
    expect(documentOverflow).toBe(false)
  }
  await selected.screenshot({
    animations: 'disabled',
    path: testInfo.outputPath('explorer-mobile.png'),
  })
})

test('switches amortization horizons, annual detail and schedule basis accessibly @cross-browser', async ({
  page,
}, testInfo) => {
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  const explorer = page.locator('.amortization-breakdown')
  const baseline = page.getByRole('region', {
    name: 'Tilgungsplan ohne Sondertilgung',
    exact: true,
  })
  const selected = page.getByRole('region', { name: 'Tilgungsplan mit Sondertilgung', exact: true })
  await expect(explorer.getByRole('radio', { name: 'Zinsbindung', exact: true })).toBeChecked()
  await expect(explorer.getByRole('radio', { name: 'Jährlich', exact: true })).toBeChecked()
  await expect(explorer.getByRole('radio', { name: 'Beide Verläufe', exact: true })).toBeChecked()
  await expect(baseline.getByRole('row')).toHaveCount(11)
  await expect(selected.getByRole('row')).toHaveCount(11)
  await expect(
    selected.getByRole('rowheader', { name: /Jahr 10.*Monate 109–120.*Monat 120/ }),
  ).toBeVisible()
  const firstYear = selected.getByRole('rowheader', { name: /^Jahr 1.*Monate 1–12$/ }).locator('..')
  await expect(firstYear.getByRole('cell').nth(4)).toContainText(/^5\.000\s*€$/)
  await explorer.getByRole('radio', { name: 'Jährlich', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(explorer.getByRole('radio', { name: 'Monatlich', exact: true })).toBeChecked()
  await expect(
    baseline.getByRole('columnheader', { name: 'Darlehensmonat', exact: true }),
  ).toBeVisible()
  await explorer.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }).check()
  await baseline.getByRole('button', { name: 'Weiter', exact: true }).click()
  await explorer.getByRole('radio', { name: 'Jährlich', exact: true }).check()
  await expect(baseline.getByText('Darlehensjahre 1–24 von 29 · Seite 1 von 2')).toBeVisible()
  await explorer.getByRole('radio', { name: 'Mit Sondertilgung', exact: true }).check()
  await expect(baseline).toHaveCount(0)
  const lastYear = selected
    .getByRole('rowheader', { name: /Jahr 17.*Monate 193–203.*Teiljahr.*Volltilgung/ })
    .locator('..')
  await expect(lastYear.getByRole('cell').last()).toContainText(/^0\s*€$/)
  await page.getByRole('button', { name: 'English' }).click()
  const englishSelected = page.getByRole('region', {
    name: 'Schedule with additional repayments',
    exact: true,
  })
  await expect(
    explorer.getByRole('radio', { name: 'Full projected repayment', exact: true }),
  ).toBeChecked()
  await expect(explorer.getByRole('radio', { name: 'Annual', exact: true })).toBeChecked()
  await expect(
    explorer.getByRole('radio', { name: 'With additional repayments', exact: true }),
  ).toBeChecked()
  await expect(
    englishSelected.getByRole('rowheader', {
      name: /Year 17.*Months 193–203.*Partial year.*Payoff/,
    }),
  ).toBeVisible()
  await explorer.getByRole('radio', { name: 'Both schedules', exact: true }).check()
  const englishBaseline = page.getByRole('region', {
    name: 'Schedule without additional repayments',
    exact: true,
  })
  await englishBaseline.getByRole('button', { name: 'Last page', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'Nominal annual interest rate', exact: true })
    .fill('4.00')
  await expect(
    englishBaseline.getByRole('rowheader', { name: /^Year 1.*Months 1–12$/ }),
  ).toBeVisible()
  await expect(explorer.getByRole('radio', { name: 'Both schedules', exact: true })).toBeChecked()
  await explorer.getByRole('radio', { name: 'Fixed-interest period', exact: true }).check()
  await expect(englishBaseline.getByRole('row')).toHaveCount(11)
  const accessibility = await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()
  expect(accessibility.violations).toEqual([])
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const radio of await explorer.getByRole('radio').all()) {
      const bounds = await radio.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    }
    const scroll = englishSelected.getByRole('region', {
      name: 'Scroll Schedule with additional repayments horizontally',
      exact: true,
    })
    const bounds = await scroll.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    if (width === 390 || width === 1440)
      await explorer.screenshot({
        animations: 'disabled',
        path: testInfo.outputPath(`explorer-controls-${width === 390 ? 'mobile' : 'desktop'}.png`),
      })
  }
})

test('plots aligned remaining debt and inspects exact payoff months @cross-browser', async ({
  page,
}, testInfo) => {
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  const chart = page.locator('.remaining-debt-chart')
  const graph = chart.getByRole('img')
  await expect(graph).toHaveAccessibleName(/Restschuld im Zeitverlauf/)
  await expect(graph.locator('[data-debt-series]')).toHaveCount(2)
  await expect(
    graph.locator('[data-debt-series="baseline"] [data-chart-month="0"]'),
  ).toHaveAttribute('data-balance-cents', '20000000')
  await expect(graph.locator('[data-fixed-month="120"]')).toHaveCount(1)
  await expect(graph.locator('[data-chart-projection]')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }).check()
  await expect(graph.locator('[data-chart-projection]')).toHaveCount(1)
  await expect(graph.locator('[data-debt-series="baseline"] [data-chart-payoff]')).toHaveAttribute(
    'data-chart-month',
    '348',
  )
  await expect(
    graph.locator('[data-debt-series="additional-repayments"] [data-chart-payoff]'),
  ).toHaveAttribute('data-chart-month', '203')
  await expect(
    graph.locator('[data-debt-series="additional-repayments"] [data-chart-month="348"]'),
  ).toHaveAttribute('data-balance-cents', '0')
  const inspect = chart.getByRole('combobox')
  await inspect.selectOption('203')
  await expect(
    chart.locator('.debt-chart-inspector').getByText(/^0\s*€ · Volltilgung$/),
  ).toBeVisible()
  const line = graph.locator('[data-debt-series="baseline"] .debt-chart-line')
  const path = await line.getAttribute('d')
  await page
    .getByRole('region', { name: 'Tilgungsplan ohne Sondertilgung', exact: true })
    .getByRole('button', { name: 'Letzte Seite' })
    .click()
  await expect(line).toHaveAttribute('d', path!)
  await expect(inspect).toHaveValue('203')
  await page.getByRole('radio', { name: 'Monatlich', exact: true }).check()
  await expect(inspect.locator('option')).toHaveCount(349)
  await inspect.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await expect(inspect).toHaveValue('1')
  await inspect.selectOption('216')
  await expect(
    chart
      .locator('.debt-chart-inspector')
      .getByText(/bereits vollständig getilgt; keine weiteren Zahlungen/),
  ).toBeVisible()
  await page.getByRole('button', { name: 'English' }).click()
  await expect(graph).toHaveAccessibleName(/Remaining debt over time/)
  await expect(inspect).toHaveAccessibleName('Inspect a loan month in the chart')
  await expect(inspect).toHaveValue('216')
  await page.getByRole('radio', { name: 'With additional repayments', exact: true }).check()
  await expect(graph.locator('[data-debt-series]')).toHaveCount(1)
  await page.getByRole('radio', { name: 'Both schedules', exact: true }).check()
  await page.getByRole('radio', { name: 'Annual', exact: true }).check()
  await inspect.selectOption('203')
  const accessibility = await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()
  expect(accessibility.violations).toEqual([])
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const scroll = chart.getByRole('region', { name: 'Scroll remaining-debt chart horizontally' })
    await scroll.focus()
    await expect(scroll).toBeFocused()
    const bounds = await scroll.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    const selectorBounds = await inspect.boundingBox()
    expect(selectorBounds!.x + selectorBounds!.width).toBeLessThanOrEqual(width)
    expect(
      await page.evaluate<boolean>(
        'document.documentElement.scrollWidth > document.documentElement.clientWidth',
      ),
    ).toBe(false)
    if (width === 390 || width === 1440) {
      await chart.getByRole('heading').click()
      await chart.screenshot({
        animations: 'disabled',
        path: testInfo.outputPath(`explorer-debt-${width === 390 ? 'mobile' : 'desktop'}.png`),
      })
    }
  }
  const previous = await graph
    .locator('[data-debt-series="baseline"] [data-chart-month="120"]')
    .getAttribute('data-balance-cents')
  await page
    .getByRole('textbox', { name: 'Nominal annual interest rate', exact: true })
    .fill('4.00')
  await expect(inspect).toHaveValue('0')
  await expect(
    graph.locator('[data-debt-series="baseline"] [data-chart-month="120"]'),
  ).not.toHaveAttribute('data-balance-cents', previous!)
  await page.getByRole('textbox', { name: 'Amount per loan year' }).fill('')
  await expect(graph.locator('[data-debt-series]')).toHaveCount(1)
})

test('reconciles payment composition and inspects aligned loan periods @cross-browser', async ({
  page,
}, testInfo) => {
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  const chart = page.locator('.payment-composition-chart')
  const graph = chart.getByRole('img')
  const inspect = chart.getByRole('combobox')
  const baseline = chart.getByRole('region', { name: 'Ohne Sondertilgung', exact: true })
  const selected = chart.getByRole('region', { name: 'Mit Sondertilgung', exact: true })
  await expect(graph).toHaveAccessibleName(/Zusammensetzung der Zahlungen/)
  await expect(graph.locator('[data-payment-series]')).toHaveCount(20)
  await expect(graph.locator('[data-payment-fixed-month="120"]')).toHaveCount(1)
  await expect(graph.locator('[data-payment-projection]')).toHaveCount(0)
  await expect(
    baseline.getByText('Gesamtzahlung', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('11.000,04 €')
  await expect(
    selected.getByText('Gesamtzahlung', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('16.000,04 €')
  await expect(
    selected.getByText('Sondertilgung', { exact: true }).locator('..').locator('dd'),
  ).toHaveText('5.000 €')
  await page.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }).check()
  await expect(graph.locator('[data-payment-series]')).toHaveCount(46)
  await expect(graph.locator('[data-payment-projection]')).toHaveCount(1)
  await inspect.selectOption('193')
  await expect(baseline.getByText(/Monate 193–204/)).toBeVisible()
  await expect(
    selected.getByText(/Monate 193–203 · Teiljahr · Projektion · Volltilgung/),
  ).toBeVisible()
  await expect(
    graph.locator('[data-payment-series="additional-repayments"][data-first-month="205"]'),
  ).toHaveCount(0)
  const bars = await graph
    .locator('[data-payment-series]')
    .evaluateAll((elements) =>
      elements.map((e) => (e as unknown as { outerHTML: string }).outerHTML),
    )
  expect(bars).toHaveLength(46)
  await page
    .getByRole('region', { name: 'Tilgungsplan ohne Sondertilgung', exact: true })
    .getByRole('button', { name: 'Letzte Seite' })
    .click()
  expect(
    await graph
      .locator('[data-payment-series]')
      .evaluateAll((elements) =>
        elements.map((e) => (e as unknown as { outerHTML: string }).outerHTML),
      ),
  ).toEqual(bars)
  await expect(inspect).toHaveValue('193')
  await page.getByRole('radio', { name: 'Monatlich', exact: true }).check()
  await expect(graph.locator('[data-payment-series]')).toHaveCount(551)
  await expect(inspect.locator('option')).toHaveCount(348)
  await inspect.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await expect(inspect).toHaveValue('2')
  await inspect.selectOption('12')
  const table = page.getByRole('table', { name: /Tilgungsplan mit Sondertilgung/ })
  const row = table.getByRole('rowheader', { name: '12', exact: true }).locator('..')
  for (const [label, cellIndex] of [
    ['Zinsen', 2],
    ['Reguläre Tilgung', 3],
    ['Sondertilgung', 4],
    ['Reguläre Rate', 1],
    ['Gesamtzahlung', 5],
  ] as const) {
    await expect(selected.getByText(label, { exact: true }).locator('..').locator('dd')).toHaveText(
      (await row.getByRole('cell').nth(cellIndex).innerText()).trim(),
    )
  }
  await expect(
    graph.locator(
      '[data-payment-series="additional-repayments"][data-first-month="12"] [data-component="additionalPrincipal"]',
    ),
  ).toHaveAttribute('data-amount-cents', '500000')
  const scroll = chart.getByRole('region', { name: 'Zahlungs-Diagramm horizontal scrollen' })
  await inspect.selectOption('204')
  expect(
    await scroll.evaluate((e) => (e as unknown as { scrollLeft: number }).scrollLeft),
  ).toBeGreaterThan(0)
  await expect(selected.getByText(/bereits vollständig getilgt/)).toBeVisible()
  await expect(selected.locator('dd')).toHaveCount(0)
  await page.getByRole('button', { name: 'English' }).click()
  await expect(graph).toHaveAccessibleName(/Payment composition/)
  await expect(inspect).toHaveAccessibleName('Inspect a payment period in the chart')
  await expect(inspect).toHaveValue('204')
  await page.getByRole('radio', { name: 'With additional repayments', exact: true }).check()
  await expect(graph.locator('[data-payment-series="baseline"]')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Baseline', exact: true }).check()
  await expect(graph.locator('[data-payment-series="additional-repayments"]')).toHaveCount(0)
  await page.getByRole('radio', { name: 'Both schedules', exact: true }).check()
  await page.getByRole('radio', { name: 'Annual', exact: true }).check()
  await inspect.selectOption('193')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(
    (await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()).violations,
  ).toEqual([])
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const region = chart.getByRole('region', {
      name: 'Scroll payment-composition chart horizontally',
    })
    await region.focus()
    await page.keyboard.press('Tab')
    await expect(inspect).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(region).toBeFocused()
    await expect(region).toHaveCSS('outline-style', 'solid')
    for (const target of [region, inspect, chart.locator('.payment-chart-details')]) {
      const bounds = await target.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    }
    expect(
      await page.evaluate<boolean>(
        'document.documentElement.scrollWidth > document.documentElement.clientWidth',
      ),
    ).toBe(false)
    if (width === 390 || width === 1440) {
      await chart.getByRole('heading', { level: 3 }).click()
      await page
        .locator(':focus')
        .evaluateAll((elements) =>
          elements.forEach((e) => (e as unknown as { blur: () => void }).blur()),
        )
      await chart.screenshot({
        animations: 'disabled',
        path: testInfo.outputPath(`explorer-payment-${width === 390 ? 'mobile' : 'desktop'}.png`),
      })
    }
  }
  const original = await graph
    .locator('[data-payment-series="baseline"][data-first-month="1"] [data-component="interest"]')
    .getAttribute('data-amount-cents')
  await page
    .getByRole('textbox', { name: 'Nominal annual interest rate', exact: true })
    .fill('4.00')
  await expect(inspect).toHaveValue('1')
  await expect(
    graph.locator(
      '[data-payment-series="baseline"][data-first-month="1"] [data-component="interest"]',
    ),
  ).not.toHaveAttribute('data-amount-cents', original!)
  await page.getByRole('textbox', { name: 'Amount per loan year' }).fill('')
  await expect(graph.locator('[data-payment-series="additional-repayments"]')).toHaveCount(0)
})

test('provides complete chart alternatives and keyboard inspection @cross-browser', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  const explorer = page.locator('.amortization-breakdown')
  await explorer.locator(':scope > summary').focus()
  await page.keyboard.press('Enter')
  const horizon = explorer.getByRole('radio', { name: 'Zinsbindung', exact: true })
  await horizon.focus()
  await page.keyboard.press('ArrowRight')
  await expect(
    explorer.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }),
  ).toBeChecked()
  const debt = page.locator('.remaining-debt-chart')
  const payments = page.locator('.payment-composition-chart')
  const debtSelect = debt.getByRole('combobox')
  const paymentSelect = payments.getByRole('combobox')
  await expect(debt.locator('.chart-inspection-announcement')).toBeEmpty()
  await expect(payments.locator('.chart-inspection-announcement')).toBeEmpty()
  await debtSelect.focus()
  await page.keyboard.press('ArrowDown')
  await expect(debtSelect).toHaveValue('12')
  await expect(debtSelect).toBeFocused()
  await expect(debt.locator('.chart-inspection-announcement')).toContainText('Darlehensmonat 12')
  await debtSelect.selectOption('203')
  await expect(debt.locator('.chart-inspection-announcement')).toContainText(
    'Mit Sondertilgung: 0 € · Volltilgung',
  )
  await debtSelect.focus()
  await page.keyboard.press('Tab')
  const debtSummary = debt.locator('.chart-data-view > summary')
  await expect(debtSummary).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(debtSummary).toBeFocused()
  const debtData = debt.locator('.chart-data-view')
  const debtTable = debtData.getByRole('table')
  await expect(debtTable).toHaveAccessibleName(
    /Datenansicht: Restschuld im Zeitverlauf.*Vollständige Rückzahlung.*Jährlich.*EUR/,
  )
  await expect(debtTable.getByRole('row')).toHaveCount(25)
  const opening = debtTable
    .getByRole('rowheader', { name: /Darlehensmonat 0.*Anfangsschuld/ })
    .locator('..')
  await expect(opening.getByRole('cell').nth(0)).toHaveText('200.000 €')
  await expect(opening.getByRole('cell').nth(1)).toHaveText('200.000 €')
  const payoff = debtTable
    .getByRole('rowheader', { name: /Darlehensmonat 203.*Projektion/ })
    .locator('..')
  await expect(payoff.getByRole('cell').nth(1)).toHaveText('0 € · Volltilgung')
  await page.keyboard.press('Tab')
  await expect(debtData.getByRole('region')).toBeFocused()
  await page.keyboard.press('Tab')
  const debtNext = debtData.getByRole('button', { name: 'Weiter', exact: true })
  await expect(debtNext).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(debtData.getByRole('status')).toHaveText('Einträge 25–31 von 31 · Seite 2 von 2')
  await expect(debtNext).toBeFocused()
  await expect(debtNext).toHaveAttribute('aria-disabled', 'true')
  const debtFirst = debtData.getByRole('button', { name: 'Erste Seite' })
  await debtFirst.focus()
  await page.keyboard.press('Tab')
  await expect(debtData.getByRole('button', { name: 'Zurück', exact: true })).toBeFocused()
  await expect(
    debtTable
      .getByRole('rowheader', { name: /Darlehensmonat 348/ })
      .locator('..')
      .getByRole('cell')
      .nth(1),
  ).toHaveText('0 € · bereits vollständig getilgt; keine weiteren Zahlungen')
  await paymentSelect.selectOption('193')
  await expect(payments.locator('.chart-inspection-announcement')).toContainText(
    'Monate 193–203 · Teiljahr · Projektion · Volltilgung',
  )
  await paymentSelect.focus()
  await page.keyboard.press('Tab')
  const paymentSummary = payments.locator('.chart-data-view > summary')
  await expect(paymentSummary).toBeFocused()
  await page.keyboard.press('Space')
  const paymentData = payments.locator('.chart-data-view')
  const paymentTable = paymentData.getByRole('table')
  await expect(paymentTable.getByRole('columnheader')).toHaveCount(7)
  const first = paymentTable
    .getByRole('rowheader', { name: /^Jahr 1 · Monate 1–12/ })
    .nth(1)
    .locator('..')
  const firstCells = first.getByRole('cell')
  await expect(firstCells).toHaveText([
    'Mit Sondertilgung',
    '6.935,21 €',
    '4.064,83 €',
    '5.000 €',
    '11.000,04 €',
    '16.000,04 €',
  ])
  await paymentData.getByRole('button', { name: 'Letzte Seite' }).focus()
  await page.keyboard.press('Enter')
  const final = paymentTable
    .getByRole('rowheader', { name: /Jahr 17 · Monate 193–203.*Teiljahr.*Projektion.*Volltilgung/ })
    .locator('..')
  await expect(final.getByRole('cell')).toHaveText([
    'Mit Sondertilgung',
    '146,03 €',
    '9.041,99 €',
    '0 €',
    '9.188,02 €',
    '9.188,02 €',
  ])
  await expect(paymentData.getByRole('status')).toHaveText('Einträge 25–46 von 46 · Seite 2 von 2')
  await expect(paymentSelect).toHaveValue('193')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(debtSelect).toHaveValue('203')
  await expect(paymentSelect).toHaveValue('193')
  await expect(paymentTable).toHaveAccessibleName(
    /Data view: Payment composition.*Full projected repayment.*Annual.*EUR/,
  )
  await expect(paymentData.getByRole('status')).toHaveText('Entries 25–46 of 46 · Page 2 of 2')
  await expect(payments.locator('.chart-inspection-announcement')).toContainText(
    'Months 193–203 · Partial year · Projection · Payoff',
  )
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  expect(
    (await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()).violations,
  ).toEqual([])
  const css = async (locator: ReturnType<typeof page.locator>, property: string) =>
    locator.evaluate(
      (e, name) =>
        (
          globalThis as unknown as {
            getComputedStyle: (el: unknown) => { getPropertyValue: (key: string) => string }
          }
        )
          .getComputedStyle(e)
          .getPropertyValue(name),
      property,
    )
  const luminance = (color: string) => {
    const rgb = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
  }
  const contrast = (a: string, b: string) => {
    const l = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (l[0] + 0.05) / (l[1] + 0.05)
  }
  const surface = await css(payments.locator('.payment-chart-scroll'), 'background-color')
  for (const component of ['interest', 'scheduledPrincipal', 'additionalPrincipal']) {
    const fill = await css(payments.locator(`.payment-fill--${component}`).first(), 'fill')
    expect(contrast(fill, surface)).toBeGreaterThanOrEqual(3)
    const segmentBorder = await css(
      payments.locator(`[data-component="${component}"]`).first(),
      'stroke',
    )
    expect(contrast(fill, segmentBorder)).toBeGreaterThanOrEqual(3)
  }
  for (const selector of [
    '.debt-series--baseline',
    '.debt-series--additional-repayments',
    '.debt-chart-hatch',
    '.debt-chart-boundary',
    '.debt-chart-inspection',
  ])
    expect(
      contrast(await css(debt.locator(selector).first(), 'stroke'), surface),
    ).toBeGreaterThanOrEqual(3)
  expect(
    (
      await css(
        debt.locator('.debt-series--additional-repayments .debt-chart-line').first(),
        'stroke-dasharray',
      )
    )
      .split(/[, ]+/)
      .map(parseFloat),
  ).toEqual([8, 5])
  expect(
    (
      await css(
        payments.locator('.payment-bar-outline--additional-repayments').first(),
        'stroke-dasharray',
      )
    )
      .split(/[, ]+/)
      .map(parseFloat),
  ).toEqual([3, 2])
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const chart of [debt, payments]) {
      const data = chart.locator('.chart-data-view')
      for (const target of [
        chart.getByRole('combobox'),
        data.locator('summary'),
        data.getByRole('region'),
        data.getByRole('button', { name: 'First page' }),
      ]) {
        await target.focus()
        // Reach this control through actual sequential keyboard navigation.
        await page.keyboard.press('Tab')
        await page.keyboard.press('Shift+Tab')
        await expect(target).toBeFocused()
        expect(await css(target, 'outline-style')).toBe('solid')
        expect(parseFloat(await css(target, 'outline-width'))).toBeGreaterThanOrEqual(3)
        expect(contrast(await css(target, 'outline-color'), surface)).toBeGreaterThanOrEqual(3)
        const bounds = await target.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
      }
      for (const scroll of [
        chart.locator('.debt-chart-scroll,.payment-chart-scroll'),
        data.getByRole('region'),
      ]) {
        await expect(scroll).toHaveCSS('scroll-behavior', 'auto')
        await expect(scroll).toHaveCSS('animation-name', 'none')
      }
      if (width === 390 || width === 1440) {
        await data.locator('summary').focus()
        await data.locator('summary').scrollIntoViewIfNeeded()
        const skipBounds = await page.locator('.skip-link').boundingBox()
        expect(skipBounds!.y + skipBounds!.height).toBeLessThanOrEqual(0)
        await page.screenshot({
          fullPage: false,
          animations: 'disabled',
          path: testInfo.outputPath(
            `explorer-alternative-${chart === debt ? 'debt' : 'payment'}-${width === 390 ? 'mobile' : 'desktop'}.png`,
          ),
        })
      }
    }
    expect(
      await page.evaluate<boolean>(
        'document.documentElement.scrollWidth > document.documentElement.clientWidth',
      ),
    ).toBe(false)
  }
  await page.emulateMedia({ forcedColors: 'active' })
  const forcedColors = await page.evaluate(() => {
    const browser = globalThis as unknown as {
      matchMedia: (query: string) => { matches: boolean }
      CSS: { supports: (property: string, value: string) => boolean }
    }
    return (
      browser.matchMedia('(forced-colors: active)').matches &&
      browser.CSS.supports('forced-color-adjust', 'none')
    )
  })
  if (forcedColors) {
    await expect(payments.locator('.payment-fill--interest').first()).toHaveCSS(
      'forced-color-adjust',
      'none',
    )
  }
  await page.emulateMedia({ forcedColors: 'none' })
  await page.addStyleTag({ content: '.debt-chart-svg,.payment-chart-svg { display:none }' })
  await debtSelect.selectOption('120')
  await expect(debt.locator('.debt-chart-inspector')).toContainText('End of fixed interest')
  await expect(paymentTable).toBeVisible()
  await explorer.getByRole('radio', { name: 'Monthly', exact: true }).check()
  await expect(explorer.getByRole('table', { name: /Data view/ })).toHaveCount(0)
  await expect(debtSelect).toHaveValue('0')
  await expect(paymentSelect).toHaveValue('1')
  await paymentSummary.focus()
  await page.keyboard.press('Enter')
  await paymentData.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(paymentData.getByRole('button', { name: 'Next', exact: true })).toBeFocused()
  await expect(paymentData.getByRole('status')).toContainText('Entries 25–48 of 551')
  await page
    .getByRole('textbox', { name: 'Nominal annual interest rate', exact: true })
    .fill('4.00')
  await expect(explorer.getByRole('table', { name: /Data view/ })).toHaveCount(0)
  await expect(payments.locator('.chart-inspection-announcement')).toBeEmpty()
})

test('explains invalid repayment schedules and cash purchases in the explorer @cross-browser', async ({
  page,
}) => {
  await completeFinancedPurchase(page)
  await page.getByRole('button', { name: 'Einmalzahlung hinzufügen' }).click()
  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  const explorer = page.locator('.amortization-breakdown')
  await expect(explorer.getByText(/nur der ursprüngliche Verlauf als Referenz/)).toBeVisible()
  await expect(explorer.getByRole('table')).toHaveCount(1)
  await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('300000')
  await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('250000')
  await expect(
    explorer.getByText('Bei einem Kauf ohne Darlehen gibt es keinen Tilgungsplan.'),
  ).toBeVisible()
  await expect(explorer.getByRole('table')).toHaveCount(0)
  await page.getByRole('button', { name: 'English' }).click()
  await expect(
    explorer.getByText('A cash purchase has no mortgage repayment schedule.'),
  ).toBeVisible()
})

test('persists and manages a named scenario locally without saved results', async ({ page }) => {
  await page.goto('./#/purchase-costs')
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('350000')
  await page.getByRole('link', { name: 'Gespeicherte Szenarien' }).click()

  await page.getByLabel('Szenarioname').fill('Altbau Köln')
  await page.getByRole('button', { name: 'Szenario speichern' }).click()
  await expect(page.getByText('Szenario gespeichert.')).toBeVisible()

  const persisted = await page.evaluate<string>(
    `localStorage.getItem('immopilot-de.scenarios.v1') ?? ''`,
  )
  expect(persisted).toContain('Altbau Köln')
  expect(persisted).not.toContain('results')

  await page.reload()
  const savedRegion = page.getByRole('region', { name: 'Lokal gespeicherte Szenarien' })
  const savedCards = savedRegion.getByRole('listitem')
  const savedCard = savedCards.filter({ has: page.locator('input[value="Altbau Köln"]') })
  await expect(savedCard).toBeVisible()
  await savedCard.getByRole('button', { name: 'Teilen' }).click()
  await expect(page.getByText(/Jeder mit dem vollständigen Link/)).toBeVisible()
  await page.getByRole('button', { name: 'Verstanden, Link erstellen' }).click()
  await expect(page.getByLabel('Freigabelink für das Szenario')).toHaveValue(
    /#\/scenarios\?scenario=/,
  )

  await savedCard.getByRole('button', { name: 'Duplizieren' }).click()
  await expect(savedCards).toHaveCount(2)
  const duplicateCard = savedCards.filter({
    has: page.locator('input[value="Altbau Köln (Kopie)"]'),
  })
  await duplicateCard.getByRole('button', { name: 'Löschen' }).click()
  await duplicateCard.getByRole('button', { name: 'Endgültig löschen' }).click()
  await expect(savedCards).toHaveCount(1)
})

test('compares three saved properties and supports reorder, remove, and mobile scrolling', async ({
  page,
}) => {
  for (const [name, price] of [
    ['Berlin', '250000'],
    ['Hamburg', '320000'],
    ['Leipzig', '210000'],
  ] as const) {
    await page.goto('./#/purchase-costs')
    await page.getByRole('textbox', { name: 'Kaufpreis' }).fill(price)
    await page.goto('./#/scenarios')
    await page
      .getByRole('region', { name: 'Aktueller Arbeitsstand' })
      .getByLabel('Szenarioname')
      .fill(name)
    await page.getByRole('button', { name: 'Szenario speichern' }).click()
    await expect(page.getByText('Szenario gespeichert.')).toBeVisible()
  }

  await page.goto('./#/comparison')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Immobilien im direkten Vergleich' }),
  ).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Berlin/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: /Hamburg/ })).toBeVisible()

  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(page.getByRole('columnheader', { name: /Leipzig/ })).toBeVisible()
  await expect(page.getByText('3 von maximal 3 Szenarien ausgewählt')).toBeVisible()

  await page.getByRole('button', { name: 'Leipzig nach links verschieben' }).click()
  const propertyHeaders = page
    .getByRole('columnheader')
    .filter({ has: page.getByRole('button', { name: 'Entfernen' }) })
  await expect(propertyHeaders.nth(1)).toContainText('Leipzig')

  await propertyHeaders.nth(0).getByRole('button', { name: 'Entfernen' }).click()
  await expect(page.getByRole('columnheader', { name: /Berlin/ })).toHaveCount(0)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByText(/horizontal wischen/)).toBeVisible()
  const overflow = await page.evaluate<{
    container: number
    content: number
    page: number
    viewport: number
  }>(`(() => {
    const element = document.querySelector('.comparison-table-scroll')
    if (!(element instanceof HTMLElement)) throw new Error('Missing comparison table')
    return {
      container: element.clientWidth,
      content: element.scrollWidth,
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }
  })()`)
  expect(overflow.content).toBeGreaterThan(overflow.container)
  expect(overflow.page).toBeLessThanOrEqual(overflow.viewport)
})

test('carries Sondertilgung through results, saved restoration, and comparison @cross-browser', async ({
  page,
}) => {
  await completeFinancedPurchase(page)

  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5.000')
  await page.getByRole('combobox', { name: 'Monat im Darlehensjahr' }).selectOption('12')
  await page.getByRole('button', { name: 'Einmalzahlung hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Betrag für Einmalzahlung 1' }).fill('2.500')
  await page.getByRole('textbox', { name: 'Darlehensmonat für Einmalzahlung 1' }).fill('12')

  await page.getByText('Detaillierten Tilgungsplan öffnen').click()
  await page.getByRole('radio', { name: 'Monatlich', exact: true }).check()
  await page.getByRole('radio', { name: 'Vollständige Rückzahlung', exact: true }).check()
  await page.getByRole('radio', { name: 'Beide Verläufe', exact: true }).check()
  const selectedSchedule = page.getByRole('table', {
    name: 'Tilgungsplan mit Sondertilgung',
  })
  const month12 = selectedSchedule.getByRole('rowheader', { name: '12', exact: true }).locator('..')
  await expect(month12).toContainText(/7\.500(?:,00)?\s*€/)

  await page.getByRole('link', { name: 'Zur Auswertung →' }).click()
  const comparison = page.locator('.sondertilgung-comparison')
  await expect(
    comparison.getByRole('heading', { name: 'Sondertilgung im Vergleich' }),
  ).toBeVisible()
  await expect(
    comparison.getByRole('heading', { name: 'Zusätzliche Tilgung' }).locator('..'),
  ).toContainText(/52\.500\s*€/)
  await expect(
    page.getByText(/Refinanzierungsbasis: Restschuld .* nach Sondertilgung/),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Gespeicherte Szenarien' }).click()
  await page.getByLabel('Szenarioname').fill('Sondertilgung Plan')
  await page.getByRole('button', { name: 'Szenario speichern' }).click()
  await expect(page.getByText('Szenario gespeichert.')).toBeVisible()

  await page.getByRole('button', { name: 'Arbeitsstand zurücksetzen' }).click()
  await expect(page.getByText('Der aktuelle Arbeitsstand wurde zurückgesetzt.')).toBeVisible()

  const savedRegion = page.getByRole('region', { name: 'Lokal gespeicherte Szenarien' })
  const savedCard = savedRegion
    .getByRole('listitem')
    .filter({ has: page.locator('input[value="Sondertilgung Plan"]') })
  await savedCard.getByRole('button', { name: 'Laden' }).click()
  await expect(
    page.getByText('Szenario geladen. Alle Ergebnisse werden neu berechnet.'),
  ).toBeVisible()

  await page.goto('./#/financing')
  await expect(page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' })).toHaveValue('5.000')
  await expect(page.getByRole('combobox', { name: 'Monat im Darlehensjahr' })).toHaveValue('12')
  await expect(page.getByRole('textbox', { name: 'Betrag für Einmalzahlung 1' })).toHaveValue(
    '2.500',
  )
  await expect(
    page.getByRole('textbox', { name: 'Darlehensmonat für Einmalzahlung 1' }),
  ).toHaveValue('12')

  await page.goto('./#/scenarios')
  await savedCard.getByRole('link', { name: 'Vergleichen' }).click()
  await expect(
    page.getByRole('columnheader', { name: /Sondertilgung Plan.*Mit Sondertilgung/ }),
  ).toBeVisible()
  await expect(page.getByRole('row', { name: /^Zusätzliche Tilgung während/ })).toContainText(
    /52\.500\s*€/,
  )
  await expect(page.getByRole('row', { name: /^Projizierte Volltilgung mit/ })).toContainText(
    /Darlehensmonat \d+/,
  )
  await expect(page.getByRole('row', { name: /^Projizierte Zeitersparnis/ })).toContainText(
    /Projektion bei konstantem Sollzins/,
  )
  await page.getByRole('button', { name: 'English' }).click()
  await expect(
    page.getByRole('columnheader', {
      name: /Sondertilgung Plan.*With additional repayments/,
    }),
  ).toBeVisible()
  await expect(page.getByRole('row', { name: /^Additional principal during/ })).toContainText(
    '€52,500',
  )
  await expect(page.getByRole('row', { name: /^Projected payoff with / })).toContainText(
    /Loan month \d+/,
  )
  await expect(page.getByRole('row', { name: /^Projected time saved/ })).toContainText(
    /Constant-rate projection/,
  )
})

test('validates one-time repayments and retains them across a cash purchase switch', async ({
  page,
}) => {
  await completeFinancedPurchase(page)
  await page.getByRole('button', { name: 'English' }).click()

  await page.getByRole('textbox', { name: 'Amount per loan year' }).fill('5,000.50')
  await page.getByRole('combobox', { name: 'Month in the loan year' }).selectOption('6')
  await page.getByRole('button', { name: 'Add one-time repayment' }).click()
  await expect(page.getByText('Enter an amount for this one-time repayment.')).toBeVisible()
  await expect(page.getByText('Enter a loan month for this one-time repayment.')).toBeVisible()

  await page.getByRole('textbox', { name: 'Amount for one-time repayment 1' }).fill('1,000')
  await page.getByRole('textbox', { name: 'Loan month for one-time repayment 1' }).fill('18')
  await page.getByRole('button', { name: 'Add one-time repayment' }).click()
  await page.getByRole('textbox', { name: 'Amount for one-time repayment 2' }).fill('2,000')
  await page.getByRole('textbox', { name: 'Loan month for one-time repayment 2' }).fill('18')
  await expect(
    page.getByText('A one-time additional repayment already exists for this loan month.'),
  ).toHaveCount(2)

  await page.getByRole('button', { name: 'Remove one-time repayment 2' }).click()
  await page.getByRole('radio', { name: /Use available equity/ }).check()
  await page.getByRole('textbox', { name: 'Available equity' }).fill('266250')

  await expect(page.getByRole('textbox', { name: 'Amount per loan year' })).toBeDisabled()
  await expect(
    page.getByRole('textbox', { name: 'Amount for one-time repayment 1' }),
  ).toBeDisabled()
  await expect(
    page.getByText(/entries are retained if you switch back to loan financing/i),
  ).toBeVisible()

  await page.getByRole('radio', { name: /Set a down payment/ }).check()
  await expect(page.getByRole('textbox', { name: 'Amount per loan year' })).toHaveValue('5,000.50')
  await expect(page.getByRole('textbox', { name: 'Amount for one-time repayment 1' })).toHaveValue(
    '1,000',
  )
  await expect(
    page.getByRole('textbox', { name: 'Loan month for one-time repayment 1' }),
  ).toHaveValue('18')

  await page.setViewportSize({ width: 390, height: 844 })
  const hasHorizontalOverflow = await page.evaluate<boolean>(
    `document.documentElement.scrollWidth > document.documentElement.clientWidth`,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('imports current and legacy JSON while rejecting unsafe files without replacing the workspace', async ({
  page,
}) => {
  await page.goto('./#/purchase-costs')
  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('250000')
  await page.goto('./#/scenarios')
  await page.getByLabel('Szenarioname').fill('Import source')
  await page.getByRole('button', { name: 'Szenario speichern' }).click()

  const source = await page.evaluate<Record<string, unknown>>(`(() => {
    const raw = localStorage.getItem('immopilot-de.scenarios.v1')
    if (!raw) throw new Error('Missing saved scenario fixture')
    return JSON.parse(raw).scenarios[0]
  })()`)
  const fileInput = page.locator('.scenario-file-action input[type="file"]')
  type ImportFixture = {
    schemaVersion: string
    id: string
    name: string
    inputs: {
      purchaseCosts: { purchasePrice: string }
      financing: { additionalRepayments?: unknown }
    }
  }
  const current = structuredClone(source) as unknown as ImportFixture
  current.id = 'browser-import-1-1'
  current.name = 'Imported 1.1 scenario'
  current.inputs.purchaseCosts.purchasePrice = '410000'

  await fileInput.setInputFiles({
    name: 'scenario-1.1.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(current)),
  })
  await expect(page.locator('input[value="Imported 1.1 scenario"]')).toBeVisible()
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('input[value="Imported 1.1 scenario"]') })
    .getByRole('button', { name: 'Laden' })
    .click()
  await page.goto('./#/purchase-costs')
  await expect(page.getByRole('textbox', { name: 'Kaufpreis' })).toHaveValue('410000')

  await page.getByRole('textbox', { name: 'Kaufpreis' }).fill('777000')
  await page.goto('./#/scenarios')
  await fileInput.setInputFiles({
    name: 'corrupted.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not json'),
  })
  await expect(page.getByRole('alert')).toContainText('Ungültige Szenariodaten')

  await fileInput.setInputFiles({
    name: 'unsupported.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: '9.0.0' })),
  })
  await expect(page.getByRole('alert')).toContainText('Nicht unterstützte Szenarioversion')
  await page.goto('./#/purchase-costs')
  await expect(page.getByRole('textbox', { name: 'Kaufpreis' })).toHaveValue('777000')

  const legacy = structuredClone(current)
  legacy.schemaVersion = '1.0.0'
  legacy.id = 'browser-import-1-0'
  legacy.name = 'Imported legacy scenario'
  delete legacy.inputs.financing.additionalRepayments
  await page.goto('./#/scenarios')
  await fileInput.setInputFiles({
    name: 'scenario-1.0.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  const legacyCard = page
    .getByRole('listitem')
    .filter({ has: page.locator('input[value="Imported legacy scenario"]') })
  await expect(legacyCard).toBeVisible()
  await legacyCard.getByRole('button', { name: 'Laden' }).click()
  await page.goto('./#/financing')
  await expect(page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' })).toHaveValue('')
  await expect(page.getByRole('combobox', { name: 'Monat im Darlehensjahr' })).toHaveValue('12')
})
