import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent, within } from '../../test/render'
import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  type FinancingDraft,
} from '../scenario-workspace'
import { AmortizationBreakdown } from './AmortizationBreakdown'

function workspace(financing: Partial<FinancingDraft> = {}) {
  return calculateScenarioWorkspace(
    {
      ...initialPurchaseCostsDraft,
      purchasePrice: '250000',
      renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    },
    { ...initialFinancingDraft, availableEquity: '66250', downPayment: '50000', ...financing },
  )
}

function explorer(result = workspace(), inputKey = 'initial') {
  return (
    <I18nextProvider i18n={i18n}>
      <AmortizationBreakdown
        baseline={result.amortization}
        inputKey={inputKey}
        selected={result.selectedAmortization}
        selectedBasis={result.selectedAmortizationBasis}
      />
    </I18nextProvider>
  )
}

const baselineTitle = 'Tilgungsplan ohne Sondertilgung'
const selectedTitle = 'Tilgungsplan mit Sondertilgung'

async function open() {
  const user = userEvent.setup()
  await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
  return user
}

describe('full amortization breakdown', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('opens a bounded first page with exact opening debt and actual payment components', async () => {
    renderWithProviders(explorer())
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await open()
    const table = screen.getByRole('table', { name: baselineTitle })
    expect(within(table).getAllByRole('row')).toHaveLength(25)
    const first = within(table).getByRole('rowheader', { name: '1' }).closest('tr')!
    expect(
      within(first)
        .getAllByRole('cell')
        .map((cell) => cell.textContent?.replaceAll('\u00a0', ' ')),
    ).toEqual(['200.000 €', '916,67 €', '583,33 €', '333,34 €', '0 €', '916,67 €', '199.666,66 €'])
    expect(screen.getByText('Monate 1–24 von 348 · Seite 1 von 15')).toBeVisible()
    expect(screen.getByText(/Projektion bei konstantem Sollzins/)).toBeVisible()
  })

  it('reaches the actual final row beyond Zinsbindung and navigates back to the first page', async () => {
    renderWithProviders(explorer())
    const user = await open()
    const region = screen.getByRole('region', { name: baselineTitle })
    await user.click(within(region).getByRole('button', { name: 'Letzte Seite' }))
    expect(within(region).getByText('Monate 337–348 von 348 · Seite 15 von 15')).toBeVisible()
    const table = within(region).getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    const last = within(table)
      .getByRole('rowheader', { name: /348.*Volltilgung/ })
      .closest('tr')!
    expect(within(last).getAllByRole('cell').at(-1)).toHaveTextContent(/^0\s*€$/)
    expect(within(last).getByText('Projektion')).toBeVisible()
    expect(within(region).getByRole('button', { name: 'Weiter' })).toBeDisabled()
    await user.click(within(region).getByRole('button', { name: 'Erste Seite' }))
    expect(within(region).getByRole('button', { name: 'Zurück' })).toBeDisabled()
    expect(within(table).getByRole('rowheader', { name: '1' })).toBeVisible()
  })

  it('marks the exact fixed-period boundary and labels later rows as projections', async () => {
    renderWithProviders(explorer())
    const user = await open()
    const region = screen.getByRole('region', { name: baselineTitle })
    for (let page = 1; page < 5; page++)
      await user.click(within(region).getByRole('button', { name: 'Weiter' }))
    expect(
      within(region).getByRole('rowheader', { name: /120.*Ende der Zinsbindung/ }),
    ).toBeVisible()
    await user.click(within(region).getByRole('button', { name: 'Weiter' }))
    expect(within(region).getByRole('rowheader', { name: /121.*Projektion/ })).toBeVisible()
    await user.click(within(region).getByRole('button', { name: 'Zurück' }))
    expect(within(region).getByText('Monate 97–120 von 348 · Seite 5 von 15')).toBeVisible()
  })

  it('paginates baseline and selected schedules independently through their respective payoff months', async () => {
    renderWithProviders(
      explorer(
        workspace({
          additionalRepayments: {
            annualAdditionalRepayment: '5000',
            annualAdditionalRepaymentMonth: '12',
            oneTimeAdditionalRepayments: [],
          },
        }),
      ),
    )
    const user = await open()
    const selected = screen.getByRole('region', { name: selectedTitle })
    await user.click(within(selected).getByRole('button', { name: 'Letzte Seite' }))
    expect(within(selected).getByText('Monate 193–203 von 203 · Seite 9 von 9')).toBeVisible()
    expect(within(selected).getByRole('rowheader', { name: /203.*Volltilgung/ })).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: baselineTitle })).getByText(
        'Monate 1–24 von 348 · Seite 1 von 15',
      ),
    ).toBeVisible()
  })

  it('preserves the page on language changes and resets it after input revisions', async () => {
    const result = workspace()
    const view = renderWithProviders(explorer(result))
    const user = await open()
    await user.click(screen.getByRole('button', { name: 'Weiter' }))
    await i18n.changeLanguage('en')
    expect(screen.getByText('Months 25–48 of 348 · Page 2 of 15')).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Opening debt' })).toBeVisible()
    expect(screen.getByRole('rowheader', { name: '25' })).toBeVisible()
    view.rerender(
      explorer(workspace({ nominalAnnualRate: '0,00', initialRepaymentRate: '100,00' }), 'changed'),
    )
    expect(screen.getByText('Months 1–12 of 12 · Page 1 of 1')).toBeVisible()
    expect(screen.getByText(/loan is repaid by the end/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('keeps the 1,200-month schedule bounded while making the last month accessible', async () => {
    renderWithProviders(
      explorer(workspace({ nominalAnnualRate: '0,00', initialRepaymentRate: '1,00' })),
    )
    const user = await open()
    expect(screen.getByText('Monate 1–24 von 1.200 · Seite 1 von 50')).toBeVisible()
    expect(screen.getAllByRole('row')).toHaveLength(25)
    await user.click(screen.getByRole('button', { name: 'Letzte Seite' }))
    expect(screen.getByRole('rowheader', { name: /1\.200.*Volltilgung/ })).toBeVisible()
    expect(screen.getAllByRole('row')).toHaveLength(25)
  })

  it('shows only the capped payoff row and does not invent later payments', async () => {
    renderWithProviders(
      explorer(
        workspace({
          additionalRepayments: {
            annualAdditionalRepayment: '',
            annualAdditionalRepaymentMonth: '12',
            oneTimeAdditionalRepayments: [
              { amount: '500000', month: '1' },
              { amount: '5000', month: '12' },
            ],
          },
        }),
      ),
    )
    await open()
    const selected = screen.getByRole('region', { name: selectedTitle })
    const table = within(selected).getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    const row = within(table)
      .getByRole('rowheader', { name: /1.*Volltilgung/ })
      .closest('tr')!
    expect(within(row).getByText(/199\.666,66\s*€/)).toBeVisible()
    expect(within(row).getAllByRole('cell').at(-1)).toHaveTextContent(/^0\s*€$/)
    expect(within(selected).getByRole('button', { name: 'Letzte Seite' })).toBeDisabled()
    expect(within(selected).getByText(/spätestens am Ende der Zinsbindung/)).toBeVisible()
  })

  it('labels a baseline reference when the additional-repayment schedule is invalid', async () => {
    renderWithProviders(
      explorer(
        workspace({
          additionalRepayments: {
            annualAdditionalRepayment: '',
            annualAdditionalRepaymentMonth: '12',
            oneTimeAdditionalRepayments: [{ amount: '', month: '12' }],
          },
        }),
      ),
    )
    await open()
    expect(screen.getByText(/nur der ursprüngliche Verlauf als Referenz/)).toBeVisible()
    expect(screen.getByRole('table', { name: baselineTitle })).toBeVisible()
    expect(screen.queryByRole('table', { name: selectedTitle })).not.toBeInTheDocument()
  })

  it('explains an unavailable baseline without displaying a numeric schedule', async () => {
    renderWithProviders(explorer(workspace({ initialRepaymentRate: '0,01' })))
    await open()
    expect(screen.getByText(/kein vollständiger Tilgungsplan/)).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('explains cash purchases in both languages without an empty loan table', async () => {
    renderWithProviders(explorer(workspace({ availableEquity: '300000', downPayment: '250000' })))
    await open()
    expect(
      screen.getByText('Bei einem Kauf ohne Darlehen gibt es keinen Tilgungsplan.'),
    ).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await i18n.changeLanguage('en')
    expect(screen.getByText('A cash purchase has no mortgage repayment schedule.')).toBeVisible()
  })
})
