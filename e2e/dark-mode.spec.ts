import { expect, test } from '@playwright/test'

test('@cross-browser follows system appearance, preserves manual choice across routes, and prints light', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('./')

  const control = page.getByRole('combobox', { name: 'Farbschema' })
  await expect(control).toHaveValue('system')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await control.selectOption('light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  // Hash navigation keeps the mounted app; a manual choice stays active.
  await page.goto('./#/financing')
  await expect(page.getByRole('combobox', { name: 'Farbschema' })).toHaveValue('light')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  // A real browser reload starts in System mode again.
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Farbschema' })).toHaveValue('system')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByRole('combobox', { name: 'Farbschema' }).selectOption('dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  const darkBackground = await page.evaluate<string>(
    "getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()",
  )
  expect(darkBackground).toBe('#101b16')

  await page.emulateMedia({ media: 'print' })
  const printBackground = await page.evaluate<string>(
    "getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()",
  )
  expect(printBackground).toBe('#ffffff')

  await page.emulateMedia({ media: 'screen' })
  await page.getByRole('combobox', { name: 'Farbschema' }).selectOption('system')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('system')

  const hasOverflow = await page.evaluate<boolean>(
    'document.documentElement.scrollWidth > document.documentElement.clientWidth',
  )
  expect(hasOverflow).toBe(false)
})
