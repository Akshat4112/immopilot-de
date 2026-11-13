import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '../i18n/config'
import { renderWithProviders, screen, userEvent } from '../test/render'
import { ThemeSelector } from './ThemeSelector'

describe('PF-007.5 system and manual theme preference', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete document.documentElement.dataset.theme
  })

  it('follows OS dark preference and changes automatically in system mode', () => {
    let dark = true
    let onChange: (() => void) | undefined
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return dark
        },
        addEventListener: (_event: string, listener: () => void) => {
          onChange = listener
        },
        removeEventListener: vi.fn(),
      })),
    )
    renderWithProviders(<ThemeSelector />)

    expect(screen.getByRole('combobox', { name: 'Farbschema' })).toHaveValue('system')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    act(() => {
      dark = false
      onChange?.()
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('manual override ignores OS changes and can return to system', async () => {
    const user = userEvent.setup()
    let dark = true
    let onChange: (() => void) | undefined
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return dark
        },
        addEventListener: (_event: string, listener: () => void) => {
          onChange = listener
        },
        removeEventListener: vi.fn(),
      })),
    )

    renderWithProviders(<ThemeSelector />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Farbschema' }), 'light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    act(() => {
      dark = false
      onChange?.()
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Farbschema' }), 'dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Farbschema' }), 'system')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('provides English labels without persisting a user preference', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    )
    await i18n.changeLanguage('en')

    renderWithProviders(<ThemeSelector />)
    const control = screen.getByRole('combobox', { name: 'Theme' })
    expect(screen.getByRole('option', { name: 'System' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Light' })).toBeVisible()
    expect(screen.getByRole('option', { name: 'Dark' })).toBeVisible()
    const oldStorage = JSON.stringify(window.localStorage)
    await user.selectOptions(control, 'dark')
    expect(JSON.stringify(window.localStorage)).toBe(oldStorage)
  })
})
