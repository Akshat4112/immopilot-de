import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'

import { completeFinancedPurchase } from './financed-purchase'

async function keyboardActivate(page: Page, locator: Locator) {
  await locator.focus()
  await page.keyboard.press('Space')
}

async function openData(chart: Locator) {
  const view = chart.locator('.chart-data-view')
  await view.locator(':scope > summary').focus()
  await view.page().keyboard.press('Enter')
  await expect(view.getByRole('table')).toBeVisible()
  return view
}

test('reaches all 1,200 zero-interest months in bilingual tables and chart alternatives @cross-browser', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 360, height: 900 })
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Sollzinssatz p.a.', exact: true }).fill('0')
  await page.getByRole('textbox', { name: 'Anfängliche Tilgung p.a.', exact: true }).fill('1')
  const explorer = page.locator('.amortization-breakdown')
  await keyboardActivate(page, explorer.locator(':scope > summary'))
  const schedule = explorer.locator('.amortization-schedule')
  await expect(schedule.getByRole('row')).toHaveCount(11)
  await expect(schedule.getByRole('row').last().getByRole('cell').last()).toHaveText('179.999,60 €')
  await keyboardActivate(
    page,
    explorer.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)', exact: true }),
  )
  await keyboardActivate(page, explorer.getByRole('radio', { name: 'Monatlich', exact: true }))
  await expect(schedule.getByRole('row')).toHaveCount(25)
  const debt = explorer.locator('.remaining-debt-chart')
  const payments = explorer.locator('.payment-composition-chart')
  await expect(debt.getByRole('combobox').locator('option')).toHaveCount(1201)
  await expect(payments.getByRole('combobox').locator('option')).toHaveCount(1200)
  await expect(payments.locator('[data-payment-series="baseline"]')).toHaveCount(1200)
  await debt.getByRole('combobox').selectOption('1199')
  await debt.getByRole('combobox').focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Tab')
  await expect(debt.getByRole('combobox')).toHaveValue('1200')
  await expect(debt.locator('.chart-inspection-announcement')).toContainText('0 € · Volltilgung')
  await payments.getByRole('combobox').selectOption('1200')
  await expect(payments.locator('.payment-chart-details')).toContainText('162,67 €')
  const debtData = await openData(debt)
  const paymentData = await openData(payments)
  for (const view of [debtData, paymentData]) {
    await expect(view.getByRole('row')).toHaveCount(25)
    const last = view.getByRole('button', { name: 'Letzte Seite', exact: true })
    await last.focus()
    await page.keyboard.press('Enter')
    await expect(last).toBeFocused()
    await expect(last).toHaveAttribute('aria-disabled', 'true')
    await page.keyboard.press('Enter')
  }
  await expect(debtData.getByRole('row')).toHaveCount(2)
  await expect(debtData.getByRole('status')).toHaveText(
    'Einträge 1.201–1.201 von 1.201 · Seite 51 von 51',
  )
  await expect(paymentData.getByRole('status')).toHaveText(
    'Einträge 1.177–1.200 von 1.200 · Seite 50 von 50',
  )
  await expect(paymentData.getByRole('row').last().getByRole('cell')).toHaveText([
    'Ohne Sondertilgung',
    '0 €',
    '162,67 €',
    '0 €',
    '162,67 €',
    '162,67 €',
  ])
  await schedule.getByRole('button', { name: 'Letzte Seite' }).click()
  await expect(schedule.getByRole('row').last().getByRole('cell').nth(1)).toHaveText('162,67 €')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(
    explorer.getByRole('radio', { name: 'Full projected repayment', exact: true }),
  ).toBeChecked()
  await expect(explorer.getByRole('radio', { name: 'Monthly', exact: true })).toBeChecked()
  await expect(debt.getByRole('combobox')).toHaveValue('1200')
  await expect(payments.getByRole('combobox')).toHaveValue('1200')
  await expect(debtData.getByRole('status')).toHaveText(
    'Entries 1,201–1,201 of 1,201 · Page 51 of 51',
  )
  await expect(paymentData.getByRole('status')).toHaveText(
    'Entries 1,177–1,200 of 1,200 · Page 50 of 50',
  )
  await expect(paymentData.getByRole('row').last().getByRole('cell')).toHaveText([
    'Baseline',
    '€0',
    '€162.67',
    '€0',
    '€162.67',
    '€162.67',
  ])
  await expect(schedule.getByRole('status')).toHaveText(
    'Months 1,177–1,200 of 1,200 · Page 50 of 50',
  )
  const scroll = paymentData.locator('.amortization-table-scroll')
  await scroll.focus()
  const before = await scroll.evaluate(
    (element) => (element as unknown as { scrollLeft: number }).scrollLeft,
  )
  for (let n = 0; n < 4; n++) await page.keyboard.press('ArrowRight')
  await expect
    .poll(() =>
      scroll.evaluate((element) => (element as unknown as { scrollLeft: number }).scrollLeft),
    )
    .toBeGreaterThan(before)
  expect(
    await page.evaluate<boolean>(
      'document.documentElement.scrollWidth > document.documentElement.clientWidth',
    ),
  ).toBe(false)
  expect(
    (await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()).violations,
  ).toEqual([])
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await paymentData.getByRole('status').scrollIntoViewIfNeeded()
    await page.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(`explorer-coverage-long-${width}.png`),
    })
  }
  await keyboardActivate(page, explorer.getByRole('radio', { name: 'Annual', exact: true }))
  await expect(explorer.getByRole('table')).toHaveCount(1)
  await expect(schedule.getByRole('status')).toHaveText('Loan years 1–24 of 100 · Page 1 of 5')
  await schedule.getByRole('button', { name: 'Last page' }).click()
  await expect(schedule.getByRole('row').last().getByRole('rowheader')).toContainText('Year 100')
  await expect(schedule.getByRole('row').last().getByRole('cell').nth(1)).toHaveText('€1,996.04')
  await expect(schedule.getByRole('row').last().getByRole('cell').last()).toHaveText('€0')
  await keyboardActivate(
    page,
    explorer.getByRole('radio', { name: 'Fixed-interest period', exact: true }),
  )
  await expect(schedule.getByRole('row')).toHaveCount(11)
  await expect(schedule.getByRole('row').last().getByRole('cell').last()).toHaveText('€179,999.60')
})

test('caps early payoff and keeps zero-debt tails separate from actual payments @cross-browser', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000)
  await completeFinancedPurchase(page)
  await page.getByRole('button', { name: 'Einmalzahlung hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Betrag für Einmalzahlung 1' }).fill('500000')
  await page.getByRole('textbox', { name: 'Darlehensmonat für Einmalzahlung 1' }).fill('1')
  const explorer = page.locator('.amortization-breakdown')
  await keyboardActivate(page, explorer.locator(':scope > summary'))
  await keyboardActivate(
    page,
    explorer.getByRole('radio', { name: 'Mit Sondertilgung', exact: true }),
  )
  const schedule = explorer.locator('.amortization-schedule')
  const debt = explorer.locator('.remaining-debt-chart')
  const payments = explorer.locator('.payment-composition-chart')
  await expect(schedule.getByRole('row')).toHaveCount(2)
  await expect(schedule.getByRole('row').last().getByRole('cell')).toHaveText([
    '200.000 €',
    '916,67 €',
    '583,33 €',
    '333,34 €',
    '199.666,66 €',
    '200.583,33 €',
    '0 €',
  ])
  await expect(debt.locator('[data-fixed-month]')).toHaveCount(0)
  await expect(payments.locator('[data-payment-fixed-month]')).toHaveCount(0)
  await expect(payments.locator('[data-payment-series]')).toHaveCount(1)
  await keyboardActivate(
    page,
    explorer.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)', exact: true }),
  )
  await expect(
    explorer.getByText(
      'Gemeinsamer Betrachtungszeitraum bis Monat 348. Jeder Verlauf endet an seiner eigenen rechnerischen Volltilgung.',
    ),
  ).toBeVisible()
  await debt.getByRole('combobox').selectOption('348')
  await expect(debt.locator('.chart-inspection-announcement')).toContainText(
    'bereits vollständig getilgt',
  )
  await payments.getByRole('combobox').selectOption('337')
  await expect(payments.locator('.payment-chart-details')).toContainText(
    'bereits vollständig getilgt',
  )
  await expect(payments.locator('.payment-chart-details dd')).toHaveCount(0)
  const debtData = await openData(debt)
  const paymentData = await openData(payments)
  await expect(paymentData.getByRole('row')).toHaveCount(2)
  await expect(paymentData.getByRole('row').last().getByRole('cell').last()).toHaveText(
    '200.583,33 €',
  )
  await debtData.getByRole('button', { name: 'Letzte Seite' }).click()
  await expect(debtData.getByRole('row').last().getByRole('cell')).toHaveText(
    '0 € · bereits vollständig getilgt; keine weiteren Zahlungen',
  )
  await page.getByRole('button', { name: 'English' }).click()
  await expect(paymentData.getByRole('row')).toHaveCount(2)
  await expect(paymentData.getByRole('row').last().getByRole('cell').last()).toHaveText(
    '€200,583.33',
  )
  await expect(schedule.getByRole('row').last().getByRole('rowheader')).toContainText(
    'Partial year',
  )
  await expect(debtData.getByRole('row').last().getByRole('cell')).toHaveText(
    '€0 · already repaid; no further payments',
  )
  await expect(payments.locator('[data-payment-series]')).toHaveCount(1)
  expect(
    (await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()).violations,
  ).toEqual([])
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await paymentData.getByRole('table').scrollIntoViewIfNeeded()
    expect(
      await page.evaluate<boolean>(
        'document.documentElement.scrollWidth > document.documentElement.clientWidth',
      ),
    ).toBe(false)
    await page.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(`explorer-coverage-payoff-${width}.png`),
    })
  }
  await page.getByRole('button', { name: 'Remove one-time repayment 1' }).click()
  await expect(
    explorer.getByRole('radio', { name: 'With additional repayments', exact: true }),
  ).toBeDisabled()
  await expect(explorer.getByRole('radio', { name: 'Baseline', exact: true })).toBeChecked()
  await expect(explorer.getByRole('table')).toHaveCount(1)
  await expect(schedule.getByRole('row')).toHaveCount(25)
  await expect(payments.locator('[data-payment-series]')).toHaveCount(29)
})

test('applies the 120/121 boundary and clears stale views through invalid, removed and unavailable plans @cross-browser', async ({
  page,
}) => {
  test.setTimeout(60000)
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  for (const [index, amount, month] of [
    [1, '1000', '120'],
    [2, '2000', '121'],
  ] as const) {
    await page.getByRole('button', { name: 'Einmalzahlung hinzufügen' }).click()
    await page.getByRole('textbox', { name: `Betrag für Einmalzahlung ${index}` }).fill(amount)
    await page
      .getByRole('textbox', { name: `Darlehensmonat für Einmalzahlung ${index}` })
      .fill(month)
  }
  const explorer = page.locator('.amortization-breakdown')
  await keyboardActivate(page, explorer.locator(':scope > summary'))
  const selected = explorer.locator('.amortization-schedule').last()
  await expect(selected.getByRole('row').last().getByRole('cell').nth(4)).toHaveText('6.000 €')
  await expect(selected.getByRole('row').last().getByRole('cell').nth(5)).toHaveText('17.000,04 €')
  await page.getByRole('button', { name: 'English' }).click()
  await keyboardActivate(
    page,
    explorer.getByRole('radio', { name: 'Full projected repayment', exact: true }),
  )
  await keyboardActivate(page, explorer.getByRole('radio', { name: 'Monthly', exact: true }))
  const debt = explorer.locator('.remaining-debt-chart')
  const payments = explorer.locator('.payment-composition-chart')
  await payments.getByRole('combobox').selectOption('120')
  await expect(payments.locator('.chart-inspection-announcement')).toContainText(
    'Additional principal: €6,000',
  )
  await payments.getByRole('combobox').selectOption('121')
  await expect(payments.locator('.chart-inspection-announcement')).toContainText(
    'Additional principal: €2,000',
  )
  await debt.getByRole('combobox').selectOption('121')
  const debtData = await openData(debt)
  const paymentData = await openData(payments)
  await paymentData.getByRole('button', { name: 'Last page' }).click()
  await page.getByRole('textbox', { name: 'Amount for one-time repayment 1' }).fill('')
  await expect(
    explorer.getByText(/Only the original schedule is shown as a reference/),
  ).toBeVisible()
  await expect(explorer.getByRole('radio', { name: 'Baseline', exact: true })).toBeChecked()
  await expect(
    explorer.getByRole('radio', { name: 'With additional repayments', exact: true }),
  ).toBeDisabled()
  await expect(explorer.getByRole('table')).toHaveCount(1)
  await expect(debt.locator('[data-debt-series="additional-repayments"]')).toHaveCount(0)
  await expect(payments.locator('[data-payment-series="additional-repayments"]')).toHaveCount(0)
  await expect(debt.getByRole('combobox')).toHaveValue('0')
  await expect(payments.getByRole('combobox')).toHaveValue('1')
  await page.getByRole('textbox', { name: 'Amount for one-time repayment 1' }).fill('1000')
  await expect(explorer.getByRole('radio', { name: 'Both schedules', exact: true })).toBeEnabled()
  await expect(explorer.getByRole('radio', { name: 'Baseline', exact: true })).toBeChecked()
  await keyboardActivate(page, explorer.getByRole('radio', { name: 'Both schedules', exact: true }))
  await openData(debt)
  await openData(payments)
  await expect(debtData.getByRole('status')).toContainText('Entries 1–24')
  await expect(paymentData.getByRole('status')).toContainText('Entries 1–24')
  await page.getByRole('button', { name: 'Remove one-time repayment 2' }).click()
  await page.getByRole('button', { name: 'Remove one-time repayment 1' }).click()
  await page.getByRole('textbox', { name: 'Amount per loan year' }).fill('')
  await expect(
    explorer.getByText('Without additional repayments, only the original schedule applies.'),
  ).toBeVisible()
  await expect(explorer.getByRole('table')).toHaveCount(1)
  await expect(payments.locator('[data-payment-series="additional-repayments"]')).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Initial repayment rate', exact: true }).fill('0')
  await expect(explorer.getByRole('table')).toHaveCount(0)
  await expect(explorer.getByRole('img')).toHaveCount(0)
  await expect(explorer.getByRole('status')).toContainText(
    'Check the nominal interest, initial repayment',
  )
  await page.getByRole('textbox', { name: 'Initial repayment rate', exact: true }).fill('2')
  await expect(
    explorer.getByRole('radio', { name: 'Full projected repayment', exact: true }),
  ).toBeChecked()
  await expect(explorer.getByRole('radio', { name: 'Monthly', exact: true })).toBeChecked()
  await expect(explorer.getByRole('table')).toHaveCount(1)
  await expect(
    explorer.locator('.amortization-schedule').getByRole('rowheader').first(),
  ).toHaveText('1')
  await expect(payments.locator('[data-payment-series="baseline"]')).toHaveCount(348)
  expect(
    (await new AxeBuilder({ page }).include('.amortization-breakdown').analyze()).violations,
  ).toEqual([])
})
