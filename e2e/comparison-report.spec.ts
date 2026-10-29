import { writeFile } from 'node:fs/promises'

import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { completeFinancedPurchase } from './financed-purchase'

async function save(page: Page, name: string) {
  await page.goto('./#/scenarios')
  await page
    .getByRole('region', { name: 'Aktueller Arbeitsstand' })
    .getByLabel('Szenarioname')
    .fill(name)
  await page.getByRole('button', { name: 'Szenario speichern' }).click()
  await expect(page.getByText('Szenario gespeichert.')).toBeVisible()
}

async function populate(page: Page) {
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  await page.goto('./#/results')
  await page.locator('#currentComparableRent').fill('1000')
  await page.locator('#monthlyOwnerCosts').fill('250')
  await save(page, 'Private owner address')
  await page.goto('./#/financing')
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('')
  await page.locator('#fixedInterestYears').selectOption('15')
  await page.goto('./#/results')
  await page.getByRole('radio', { name: /Kapitalanlage/ }).check()
  for (const [id, value] of Object.entries({
    monthlyNetColdRent: '600',
    monthlyNonRecoverableHausgeld: '150',
    monthlyReserveContribution: '50',
    annualMaintenanceAllowance: '1200',
    rentalHoldingYears: '7',
    rentalPropertyAppreciationRate: '2',
    rentalSellingCostRate: '3',
  }))
    await page.locator(`#${id}`).fill(value)
  await save(page, 'Private rental address')
  await page.goto('./#/financing')
  await page.getByRole('textbox', { name: 'Verfügbares Eigenkapital' }).fill('300000')
  await page.getByRole('textbox', { name: 'Anzahlung auf den Kaufpreis' }).fill('250000')
  await page.goto('./#/results')
  await page.getByRole('radio', { name: /Eigennutzung/ }).check()
  await page.locator('#currentComparableRent').fill('')
  await save(page, 'Private cash address')
  await page.goto('./#/comparison')
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await page.getByRole('button', { name: 'Private rental address nach links verschieben' }).click()
}

test('captures three ordered bilingual reports, preserves live metrics, and clears safely @cross-browser', async ({
  page,
}, testInfo) => {
  test.setTimeout(180000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await populate(page)
  const preview = page.locator('.comparison-report-preview')
  const report = page.locator('.comparison-report')
  const trigger = preview.getByRole('button', { name: 'Vergleichsbericht ansehen' })
  const beforeStorage = await page.evaluate(() => JSON.stringify(localStorage))
  const requests: string[] = []
  const errors: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('pageerror', (error) => errors.push(error.message))
  for (const language of ['de', 'en'] as const) {
    await preview.getByRole('combobox').selectOption(language)
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(report).toHaveAttribute('lang', language)
    await expect(preview.getByRole('heading', { name: 'Berichtsvorschau' })).toBeFocused()
    const summary = report.locator('.report-comparison-table')
    await expect(summary.locator('thead').getByRole('columnheader')).toHaveCount(4)
    await expect(summary.getByRole('row')).toHaveCount(28)
    const properties = report.locator(':scope > article')
    await expect(properties).toHaveCount(3)
    await expect(properties.nth(0)).toContainText(
      language === 'de' ? 'Vermietung' : 'Rental investment',
    )
    await expect(properties.nth(1)).toContainText(
      language === 'de' ? 'Monate 193–203 · Teiljahr' : 'Months 193–203 · Partial year',
    )
    await expect(properties.nth(2)).toContainText(language === 'de' ? 'Barkauf' : 'Cash purchase')
    await expect(report.getByRole('img')).toHaveCount(4)
    await expect(report).not.toContainText('Private ')
    await expect(summary).toContainText(
      language === 'de'
        ? 'Unterschiedliche Modelle oder Zeiträume'
        : 'Different models or time horizons',
    )
    await expect(summary).toContainText(
      language === 'de' ? '1 Eingabe(n) fehlen' : '1 input(s) missing',
    )
    if (language === 'de') {
      // Every summary cell must match the live comparison's value and basis, in the same order.
      const liveCells = await page.locator('.comparison-table tbody td').allTextContents()
      expect(await summary.locator('tbody td').allTextContents()).toEqual(liveCells)
    }
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await report.locator('.report-header').first().scrollIntoViewIfNeeded()
      expect(
        await page.evaluate<boolean>(
          'document.documentElement.scrollWidth > document.documentElement.clientWidth',
        ),
      ).toBe(false)
      await page.screenshot({
        animations: 'disabled',
        path: testInfo.outputPath(`report-comparison-${language}-${width}.png`),
      })
    }
    await page.setViewportSize({ width: 360, height: 1000 })
    const region = summary.locator('..')
    await region.focus()
    await page.keyboard.press('ArrowRight')
    await expect
      .poll(() =>
        region.evaluate((element) => (element as unknown as { scrollLeft: number }).scrollLeft),
      )
      .toBeGreaterThan(0)
    expect(
      (await new AxeBuilder({ page }).include('.comparison-report-preview').analyze()).violations,
    ).toEqual([])
    await page.setViewportSize({ width: 1440, height: 1000 })
    // A test-only standalone host checks landscape summary / portrait detail CSS. No print action is exposed.
    await page.evaluate(`(() => {
      const clone = document.querySelector('.comparison-report').cloneNode(true);
      for (const element of clone.querySelectorAll('[id]')) element.id += '-print-probe';
      clone.setAttribute('data-comparison-print-probe','');
      clone.style.width='275mm';
      document.body.append(clone);
    })()`)
    await page.emulateMedia({ media: 'print' })
    await expect(preview).toBeHidden()
    const probe = page.locator('[data-comparison-print-probe]')
    await expect(probe).toBeVisible()
    const printLayout = await page.evaluate<{
      parsesNamedPages: boolean
      supportsNamedPages: boolean
      namedPageProbe: string
      summaryPage: string
      propertyPages: string[]
      width: number
      overflowingTables: { caption: string; client: number; scroll: number }[]
    }>(`(() => {
      const root = document.querySelector('[data-comparison-print-probe]');
      const capabilityProbe = document.createElement('div');
      capabilityProbe.style.setProperty('page', 'immopilot-capability-probe');
      document.body.append(capabilityProbe);
      const namedPageProbe = getComputedStyle(capabilityProbe).getPropertyValue('page');
      capabilityProbe.remove();
      const supportsNamedPages = namedPageProbe === 'immopilot-capability-probe';
      if (!supportsNamedPages) root.style.width = '188mm';
      return {
        parsesNamedPages: CSS.supports('page', 'comparison-summary'),
        supportsNamedPages,
        namedPageProbe,
        summaryPage: getComputedStyle(root.querySelector('.report-comparison-summary')).getPropertyValue('page'),
        propertyPages: [...root.querySelectorAll(':scope > article')].map(article => getComputedStyle(article).getPropertyValue('page')),
        width: root.clientWidth,
        overflowingTables: [...root.querySelectorAll('table')].filter(table => table.scrollWidth > table.clientWidth + 1).map(table => ({caption: table.caption.textContent, client: table.clientWidth, scroll: table.scrollWidth})),
      };
    })()`)
    await writeFile(
      testInfo.outputPath(`report-comparison-print-layout-${language}.json`),
      JSON.stringify(printLayout, null, 2),
    )
    if (printLayout.supportsNamedPages) {
      expect(printLayout.summaryPage).toBe('comparison-summary')
      expect(printLayout.propertyPages).toEqual([
        'property-detail',
        'property-detail',
        'property-detail',
      ])
    } else {
      // Unsupported CSS is recorded; the existing A4 portrait rule remains the fallback.
      expect(printLayout.namedPageProbe).toBe('')
      expect(printLayout.summaryPage).toBe('')
      expect(printLayout.propertyPages).toEqual(['', '', ''])
      expect(printLayout.width).toBeLessThanOrEqual(712)
    }
    expect(printLayout.overflowingTables).toEqual([])
    await probe.locator('.report-comparison-table').scrollIntoViewIfNeeded()
    await page.screenshot({
      animations: 'disabled',
      path: testInfo.outputPath(`report-comparison-print-${language}.png`),
    })
    await page.evaluate('document.querySelector("[data-comparison-print-probe]").remove()')
    await page.emulateMedia({ media: 'screen' })
    await preview.getByRole('button', { name: 'Bericht schließen' }).click()
    await expect(report).toHaveCount(0)
    await expect(trigger).toBeFocused()
  }
  await preview.getByRole('combobox').selectOption('de')
  await preview
    .getByRole('checkbox', { name: 'Vollständigen monatlichen Anhang aufnehmen' })
    .check()
  await trigger.click()
  await expect(
    report.getByRole('table', {
      name: 'Monatlicher Anhang · Ohne Sondertilgung · EUR',
      exact: true,
    }),
  ).toHaveCount(2)
  await expect(
    report.getByRole('table', {
      name: 'Monatlicher Anhang · Mit Sondertilgung · EUR',
      exact: true,
    }),
  ).toHaveCount(1)
  await preview
    .getByRole('checkbox', { name: 'Vollständigen monatlichen Anhang aufnehmen' })
    .uncheck()
  await expect(report).toHaveCount(0)
  await trigger.click()
  await page.getByRole('button', { name: 'Private owner address nach links verschieben' }).click()
  await expect(report).toHaveCount(0)
  await trigger.click()
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await expect(report).toHaveCount(0)
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(beforeStorage)
  expect(requests).toEqual([])
  expect(errors).toEqual([])
})

test('keeps one selected property and blocks a subsequently deleted library @cross-browser', async ({
  page,
}) => {
  await completeFinancedPurchase(page)
  await save(page, 'Only private property')
  await page.goto('./#/comparison')
  const preview = page.locator('.comparison-report-preview')
  const trigger = preview.getByRole('button', { name: 'Vergleichsbericht ansehen' })
  await trigger.click()
  await expect(page.locator('.report-comparison-table thead th')).toHaveCount(2)
  await preview.getByRole('button', { name: 'Bericht schließen' }).click()
  await page.evaluate('localStorage.clear()')
  await trigger.click()
  await expect(preview.getByRole('alert')).toContainText('Lade den Vergleich neu')
  await expect(page.locator('.comparison-report')).toHaveCount(0)
  await page
    .getByRole('columnheader', { name: /Only private property/ })
    .getByRole('button', { name: 'Entfernen' })
    .click()
  await expect(preview).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Vergleichsbericht ansehen' })).toHaveCount(0)
})
