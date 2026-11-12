import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('@cross-browser methodology exposes bilingual source/version evidence without mobile overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('./#/methodology')

  await expect(page).toHaveTitle('Berechnungsmethodik und Quellen · ImmoPilot DE')
  await expect(
    page.getByRole('heading', { name: 'So berechnet ImmoPilot deine Szenarien' }),
  ).toBeVisible()
  await expect(page.getByText('de-2026.09')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Kapitalanlage: Mietrenditen und Cashflow' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Aktuelle Grunderwerbsteuersätze/u }),
  ).toHaveAttribute('href', /dnoti\.de/u)

  const overflow = await page.evaluate<boolean>(
    'document.documentElement.scrollWidth > document.documentElement.clientWidth',
  )
  expect(overflow).toBe(false)

  await page.getByRole('button', { name: 'English' }).click()
  await expect(page).toHaveTitle('Calculation methodology and sources · ImmoPilot DE')
  await expect(page.getByText(/net yield = net operating income/u)).toBeVisible()
  await expect(page.getByText(/A historical verification date/u)).toBeVisible()
  const scan = await new AxeBuilder({ page }).include('.methodology-page').analyze()
  expect(scan.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious')).toEqual(
    [],
  )
})
