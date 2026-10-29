import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { completeFinancedPurchase } from './financed-purchase'

test('previews both property modes in DE/EN with complete data, safe lifecycle and mobile keyboard access @cross-browser', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000)
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Betrag pro Darlehensjahr' }).fill('5000')
  await page.getByRole('link', { name: 'Auswertung', exact: true }).click()
  await page.locator('#currentComparableRent').fill('1000')
  await page.locator('#monthlyOwnerCosts').fill('250')
  const report = page.locator('.property-report')
  const preview = page.locator('.property-report-preview')
  const trigger = preview.getByRole('button', { name: 'Immobilienbericht ansehen' })
  const beforeStorage = await page.evaluate(() => JSON.stringify(localStorage))
  for (const mode of ['owner', 'rental'] as const) {
    if (mode === 'rental') {
      await page.getByRole('radio', { name: /Kapitalanlage/ }).check()
      await expect(report).toHaveCount(0)
      await page.locator('#monthlyNetColdRent').fill('600')
      await page.locator('#monthlyNonRecoverableHausgeld').fill('150')
      await page.locator('#monthlyReserveContribution').fill('50')
      await page.locator('#annualMaintenanceAllowance').fill('1200')
    }
    for (const language of ['de', 'en'] as const) {
      await preview.getByRole('combobox').selectOption(language)
      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(report).toHaveAttribute('lang', language)
      await expect(preview.getByRole('heading', { name: 'Berichtsvorschau' })).toBeFocused()
      await expect(report.getByRole('img')).toHaveCount(2)
      const schedule = report.getByRole('table', {
        name: `${language === 'de' ? 'Mit Sondertilgung' : 'With additional repayments'} · EUR`,
      })
      await expect(schedule.getByRole('row')).toHaveCount(18)
      await expect(schedule.getByRole('row').last()).toContainText(
        language === 'de' ? 'Monate 193–203 · Teiljahr' : 'Months 193–203 · Partial year',
      )
      if (mode === 'rental')
        await expect(
          report.getByText(language === 'de' ? '-634,67 €' : '-€634.67', { exact: true }),
        ).toBeVisible()
      for (const width of [360, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await report
          .getByRole('heading', {
            name: language === 'de' ? 'Immobilienbericht' : 'Property report',
            exact: true,
          })
          .scrollIntoViewIfNeeded()
        expect(
          await page.evaluate<boolean>(
            'document.documentElement.scrollWidth > document.documentElement.clientWidth',
          ),
        ).toBe(false)
        await page.screenshot({
          animations: 'disabled',
          path: testInfo.outputPath(`report-${mode}-${language}-${width}.png`),
        })
      }
      await page.setViewportSize({ width: 360, height: 1000 })
      const scroll = schedule.locator('..')
      await scroll.focus()
      await page.keyboard.press('ArrowRight')
      await expect
        .poll(() =>
          scroll.evaluate((element) => (element as unknown as { scrollLeft: number }).scrollLeft),
        )
        .toBeGreaterThan(0)
      expect(
        (await new AxeBuilder({ page }).include('.property-report-preview').analyze()).violations,
      ).toEqual([])
      if (mode === 'owner') {
        await page.setViewportSize({ width: 1440, height: 1000 })
        for (const [index, figure] of (await report.locator('figure').all()).entries()) {
          await figure.scrollIntoViewIfNeeded()
          await page.screenshot({
            animations: 'disabled',
            path: testInfo.outputPath(`report-chart-${language}-${index}.png`),
          })
        }
        // Check the standalone A4 document without exposing a production print action.
        await page.evaluate(`(() => {
          const clone = document.querySelector('.property-report').cloneNode(true);
          const ids = [...clone.querySelectorAll('[id]')].map(element => [element.id, element.id + '-print-probe']);
          for (const element of clone.querySelectorAll('*')) {
            for (const attribute of ['id', 'fill', 'aria-labelledby', 'aria-describedby']) {
              const value = element.getAttribute(attribute);
              if (value === null) continue;
              let updated = value;
              for (const [before, after] of ids) updated = updated.replaceAll(before, after);
              element.setAttribute(attribute, updated);
            }
          }
          clone.setAttribute('data-report-print-probe', '');
          clone.style.width = '188mm';
          document.body.append(clone);
        })()`)
      }
      await page.emulateMedia({ media: 'print' })
      await expect(preview).toBeHidden()
      if (mode === 'owner') {
        const probe = page.locator('[data-report-print-probe]')
        await expect(probe).toBeVisible()
        expect(
          await page.evaluate<boolean>(
            '(() => [...document.querySelectorAll("[data-report-print-probe] table")].every(table => table.scrollWidth <= table.clientWidth + 1))()',
          ),
        ).toBe(true)
        expect(
          await page.evaluate<boolean>(
            '(() => [...document.querySelectorAll("[data-report-print-probe] thead")].every(head => getComputedStyle(head).display === "table-header-group"))()',
          ),
        ).toBe(true)
        await probe.scrollIntoViewIfNeeded()
        await page.screenshot({
          animations: 'disabled',
          path: testInfo.outputPath(`report-print-${language}.png`),
        })
        await page.evaluate('document.querySelector("[data-report-print-probe]").remove()')
      }
      await page.emulateMedia({ media: 'screen' })
      await preview.getByRole('button', { name: 'Bericht schließen' }).click()
      await expect(report).toHaveCount(0)
      await expect(trigger).toBeFocused()
    }
  }
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(beforeStorage)
})

test('reaches the complete long-loan appendix through the actual preview @cross-browser', async ({
  page,
}) => {
  test.setTimeout(90000)
  await completeFinancedPurchase(page)
  await page.getByRole('textbox', { name: 'Sollzinssatz p.a.', exact: true }).fill('0')
  await page.getByRole('textbox', { name: 'Anfängliche Tilgung p.a.', exact: true }).fill('1')
  await page.getByRole('link', { name: 'Auswertung', exact: true }).click()
  const preview = page.locator('.property-report-preview')
  await preview.getByRole('combobox').selectOption('en')
  await preview
    .getByRole('checkbox', { name: 'Vollständigen monatlichen Anhang aufnehmen' })
    .check()
  await preview.getByRole('button', { name: 'Immobilienbericht ansehen' }).click()
  const report = preview.getByRole('article')
  const annual = report.getByRole('table', { name: 'Baseline · EUR', exact: true })
  await expect(annual.getByRole('row')).toHaveCount(101)
  await expect(annual.getByRole('row').last()).toContainText('€1,996.04')
  const appendix = report.getByRole('table', {
    name: 'Monthly appendix · Baseline · EUR',
    exact: true,
  })
  await expect(appendix.getByRole('row')).toHaveCount(1201)
  await expect(appendix.getByRole('row').last()).toContainText('1,200')
  await expect(appendix.getByRole('row').last()).toContainText('€162.67')
  await preview
    .getByRole('checkbox', { name: 'Vollständigen monatlichen Anhang aufnehmen' })
    .uncheck()
  await expect(report).toHaveCount(0)
  await preview.getByRole('button', { name: 'Immobilienbericht ansehen' }).click()
  await expect(preview.getByRole('article')).toHaveCount(1)
  await expect(
    preview.getByRole('table', { name: 'Monthly appendix · Baseline · EUR', exact: true }),
  ).toHaveCount(0)
})
