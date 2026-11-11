import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent } from '../../test/render'
import { SCENARIO_LIBRARY_STORAGE_KEY } from '../../storage'
import { useScenarioWorkspaceStore } from '../scenario-workspace'
import { HomePage } from './HomePage'

function renderPage() {
  return renderWithProviders(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage audience entry paths', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    useScenarioWorkspaceStore.getState().reset()
    await i18n.changeLanguage('de')
  })

  it('offers distinct owner-occupier and rental-investment starts', async () => {
    const user = userEvent.setup()
    renderPage()

    const owner = screen.getByRole('link', { name: /Für Eigennutzung rechnen/ })
    const rental = screen.getByRole('link', { name: 'Kapitalanlage bewerten' })
    expect(owner).toHaveAttribute('href', '/purchase-costs')
    expect(rental).toHaveAttribute('href', '/purchase-costs')

    await user.click(rental)
    expect(useScenarioWorkspaceStore.getState().analysis.propertyUse).toBe('rental-investment')
    expect(screen.getByText(/abschließenden Release-Prüfung/)).toBeVisible()
    expect(screen.queryByText(/schrittweise.*gebaut/)).not.toBeInTheDocument()
  })

  it('provides both entry paths in English and preserves the selected mode', async () => {
    const user = userEvent.setup()
    await i18n.changeLanguage('en')
    renderPage()

    expect(screen.getByRole('link', { name: /Calculate for my own home/ })).toBeVisible()
    await user.click(screen.getByRole('link', { name: 'Evaluate a rental investment' }))

    expect(useScenarioWorkspaceStore.getState().analysis.propertyUse).toBe('rental-investment')
  })
  it('confirms before replacing unsaved data and leaves saved local scenarios intact', async () => {
    const user = userEvent.setup()
    const originalLibrary = '{"saved":"untouched"}'
    window.localStorage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, originalLibrary)
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '777000',
    })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Eigennutzungs-Beispiel laden' }))
    expect(screen.getByText('Fiktives Beispiel laden?')).toBeVisible()
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('777000')

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('777000')

    await user.click(screen.getByRole('button', { name: 'Eigennutzungs-Beispiel laden' }))
    await user.click(screen.getByRole('button', { name: 'Beispiel übernehmen' }))
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.purchasePrice).toBe('250000')
    expect(useScenarioWorkspaceStore.getState().activeDemo).toBe('owner-occupier')
    expect(window.localStorage.getItem(SCENARIO_LIBRARY_STORAGE_KEY)).toBe(originalLibrary)
  })

  it('loads an English-labelled rental example without changing the language', async () => {
    const user = userEvent.setup()
    await i18n.changeLanguage('en')
    renderPage()

    expect(screen.getByText('Explore with example inputs')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Load rental example' }))
    expect(screen.getByText(/potentially unsaved inputs/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Use example' }))

    expect(useScenarioWorkspaceStore.getState().analysis.propertyUse).toBe('rental-investment')
    expect(useScenarioWorkspaceStore.getState().purchaseCosts.renovationBudget).toEqual({
      amountCents: 1_000_000,
      budgetStatus: 'budgeted',
    })
    expect(i18n.resolvedLanguage).toBe('en')
  })
  it('guides empty workspaces into a blank mode or approved demo flow', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'So startest du deine Immobilienrechnung' }),
    ).toBeVisible()
    expect(screen.getByRole('list')).toHaveTextContent('Grunderwerbsteuer')
    expect(screen.getByRole('link', { name: 'Eigennutzung leer starten' })).toHaveAttribute(
      'href',
      '/purchase-costs',
    )

    await user.click(screen.getByRole('link', { name: 'Kapitalanlage leer starten' }))
    expect(useScenarioWorkspaceStore.getState().analysis.propertyUse).toBe('rental-investment')
    expect(screen.getByRole('button', { name: 'Kapitalanlage-Beispiel laden' })).toBeVisible()
  })

  it('hides first-use guidance after actual property data is entered', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'So startest du deine Immobilienrechnung' }))
      .toBeVisible()
    useScenarioWorkspaceStore.getState().setPurchaseCosts({
      ...useScenarioWorkspaceStore.getState().purchaseCosts,
      purchasePrice: '200000',
    })
    expect(
      screen.queryByRole('heading', { name: 'So startest du deine Immobilienrechnung' }),
    ).not.toBeInTheDocument()
  })

})
