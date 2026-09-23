import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
} from '../scenario-workspace'
import i18n from '../../i18n/config'
import {
  createSavedScenario,
  SCENARIO_LIBRARY_STORAGE_KEY,
  writeScenarioLibrary,
} from '../../storage'
import { renderWithProviders, screen, userEvent, within } from '../../test/render'
import { ComparisonPage } from './ComparisonPage'

function savedScenario(name: string, id: string, price: string, fixedYears = '10') {
  return createSavedScenario(
    name,
    {
      purchaseCosts: {
        ...initialPurchaseCostsDraft,
        purchasePrice: price,
        renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
        movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      },
      financing: {
        ...initialFinancingDraft,
        availableEquity: '80000',
        downPayment: '60000',
        fixedInterestYears: fixedYears,
      },
      analysis: {
        ...initialScenarioAnalysisDraft,
        currentComparableRent: '1200',
        monthlyOwnerCosts: '300',
      },
    },
    { id },
  )
}

function renderPage(route = '/comparison') {
  return renderWithProviders(
    <MemoryRouter initialEntries={[route]}>
      <ComparisonPage />
    </MemoryRouter>,
  )
}

describe('ComparisonPage', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    await i18n.changeLanguage('de')
  })

  it('adds, removes, and reorders up to three recalculated scenarios', async () => {
    const scenarios = [
      savedScenario('Berlin', 'berlin', '300000'),
      savedScenario('Köln', 'cologne', '350000', '15'),
      savedScenario('Leipzig', 'leipzig', '220000'),
    ]
    writeScenarioLibrary(window.localStorage, scenarios)
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('columnheader', { name: /Berlin/ })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: /Köln/ })).toBeVisible()
    expect(screen.getByText('Unterschiedliche Zinsbindungszeiträume')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }))
    expect(screen.getByRole('columnheader', { name: /Leipzig/ })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeDisabled()
    expect(screen.getByText('3 von maximal 3 Szenarien ausgewählt')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Leipzig nach links verschieben' }))
    const headers = screen.getAllByRole('columnheader').slice(1, 4)
    expect(headers.map((header) => header.textContent)).toEqual([
      expect.stringContaining('Berlin'),
      expect.stringContaining('Leipzig'),
      expect.stringContaining('Köln'),
    ])

    await user.click(within(headers[0]!).getByRole('button', { name: 'Entfernen' }))
    expect(screen.queryByRole('columnheader', { name: /Berlin/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hinzufügen' })).toBeEnabled()
  })

  it('opens a specific scenario from its saved-scenario compare link', () => {
    writeScenarioLibrary(window.localStorage, [
      savedScenario('Berlin', 'berlin', '300000'),
      savedScenario('Köln', 'cologne', '350000'),
    ])

    renderPage('/comparison?scenario=cologne')

    expect(screen.getByRole('columnheader', { name: /Köln/ })).toBeVisible()
    expect(screen.queryByRole('columnheader', { name: /Berlin/ })).not.toBeInTheDocument()
  })

  it('handles corrupted scenario data safely and switches to English', async () => {
    window.localStorage.setItem(SCENARIO_LIBRARY_STORAGE_KEY, '{broken')
    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Ungültige Szenariodaten')
    expect(
      screen.getByRole('heading', { name: 'Noch keine Szenarien zum Vergleichen' }),
    ).toBeVisible()

    await i18n.changeLanguage('en')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Compare properties side by side' }),
    ).toBeVisible()
    expect(screen.getByRole('heading', { name: 'No scenarios to compare yet' })).toBeVisible()
  })

  it('handles browsers that deny access to local storage', () => {
    const storageAccess = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Lokaler Speicher nicht verfügbar')
    expect(
      screen.getByRole('heading', { name: 'Noch keine Szenarien zum Vergleichen' }),
    ).toBeVisible()
    storageAccess.mockRestore()
  })
})
