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
    expect(screen.getAllByText('Unterschiedliche Zinsbindungszeiträume')).toHaveLength(4)

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

  it('labels selected Sondertilgung results in German and English', async () => {
    const baseline = savedScenario('Ohne Sondertilgung', 'baseline', '250000')
    const withRepayments = savedScenario('Mit Plan', 'repayments', '250000')
    withRepayments.inputs.financing.additionalRepayments = {
      annualAdditionalRepayment: '5.000',
      annualAdditionalRepaymentMonth: '12',
      oneTimeAdditionalRepayments: [],
    }
    writeScenarioLibrary(window.localStorage, [baseline, withRepayments])

    renderPage()

    expect(screen.getByRole('columnheader', { name: /Mit Plan.*Mit Sondertilgung/ })).toBeVisible()
    const debtRow = screen.getByRole('row', { name: /^Restschuld / })
    expect(within(debtRow).getByText(/nach Sondertilgung und 10 Jahren/)).toBeVisible()
    const additionalRow = screen.getByRole('row', { name: /^Zusätzliche Tilgung während/ })
    expect(
      within(additionalRow)
        .getAllByRole('cell')
        .map((cell) => cell.querySelector('strong')?.textContent?.replaceAll('\u00a0', ' ')),
    ).toEqual(['0 €', '50.000 €'])
    expect(within(additionalRow).getAllByText(/Vergleich mit demselben Szenario/)).toHaveLength(2)
    const payoffRow = screen.getByRole('row', { name: /^Projizierte Volltilgung mit/ })
    expect(within(payoffRow).getAllByText(/Darlehensmonat \d+/)).toHaveLength(2)
    expect(within(payoffRow).getAllByText(/Projektion bei konstantem Sollzins/)).toHaveLength(2)
    const timeRow = screen.getByRole('row', { name: /^Projizierte Zeitersparnis/ })
    expect(within(timeRow).getByText('0 Jahre · 0 Monate')).toBeVisible()
    const returnRow = screen.getByRole('row', { name: /^Prognostiziertes Ergebnis/ })
    expect(
      within(returnRow).getByText(/Sondertilgungen werden im jeweiligen Zahlungsmonat/),
    ).toBeVisible()

    await i18n.changeLanguage('en')
    expect(
      screen.getByRole('columnheader', { name: /Mit Plan.*With additional repayments/ }),
    ).toBeVisible()
    expect(within(debtRow).getByText(/after additional repayments and a 10-year/)).toBeVisible()
    expect(within(additionalRow).getByText('€50,000')).toBeVisible()
    expect(within(payoffRow).getAllByText(/Loan month \d+/)).toHaveLength(2)
    expect(within(payoffRow).getAllByText(/Constant-rate projection/)).toHaveLength(2)
    expect(within(timeRow).getByText('0 years · 0 months')).toBeVisible()
  })

  it('renders unavailable schedules and cash purchases without fabricated zero savings', () => {
    const invalid = savedScenario('Invalid financing', 'invalid', '250000')
    invalid.inputs.financing.downPayment = '-1'
    const cash = savedScenario('Cash', 'cash', '250000')
    cash.inputs.financing.downPayment = '250000'
    cash.inputs.financing.availableEquity = '300000'
    writeScenarioLibrary(window.localStorage, [invalid, cash])
    renderPage()
    const row = screen.getByRole('row', { name: /^Zinsersparnis während/ })
    const [invalidCell, cashCell] = within(row).getAllByRole('cell')
    expect(invalidCell).toHaveTextContent('Nicht berechenbar')
    expect(invalidCell).toHaveTextContent('Prüfe Finanzierungs- und Sondertilgungseingaben')
    expect(cashCell).toHaveTextContent('Für dieses Modell nicht anwendbar')
    expect(within(row).queryByText('0 €')).not.toBeInTheDocument()
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
