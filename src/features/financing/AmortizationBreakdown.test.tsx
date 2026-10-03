import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import { moneyCents } from '../../domain/shared/money'
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
const annualPlan = {
  annualAdditionalRepayment: '5000',
  annualAdditionalRepaymentMonth: '12',
  oneTimeAdditionalRepayments: [],
}

async function open(fullMonthly = true) {
  const user = userEvent.setup()
  await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
  if (fullMonthly && screen.queryByRole('radio', { name: 'Monatlich' })) {
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
  }
  return user
}

describe('full amortization breakdown', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('keeps monthly detail usable when annual totals exceed the safe-money range', async () => {
    const result = workspace()
    const source = result.amortization
    if (source.status !== 'available' || source.cashPurchase) throw new Error('Fixture unavailable')
    const row = { ...source.rows[0]!, regularPaymentCents: moneyCents(Number.MAX_SAFE_INTEGER) }
    const baseline = {
      ...source,
      payoffMonth: 2,
      rows: [row, { ...row, month: 2, closingBalanceCents: moneyCents(0) }],
    }
    renderWithProviders(explorer({ ...result, amortization: baseline }))
    const user = await open(false)
    expect(screen.getByText(/jährlichen Summen überschreiten/)).toBeVisible()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.queryByText(/jährlichen Summen überschreiten/)).not.toBeInTheDocument()
  })

  it('preserves chosen views across closing, reopening and a language change', async () => {
    renderWithProviders(explorer(workspace({ additionalRepayments: annualPlan })))
    const user = await open(false)
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await i18n.changeLanguage('en')
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Full projected repayment' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'With additional repayments' })).toBeChecked()
    expect(screen.getAllByRole('table')).toHaveLength(1)
  })

  it('defaults to annual Zinsbindung with the baseline and disabled absent plan choices', async () => {
    renderWithProviders(explorer())
    await open(false)
    expect(screen.getByRole('radio', { name: 'Zinsbindung' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Jährlich' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Ohne Sondertilgung' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Mit Sondertilgung' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Beide Verläufe' })).toBeDisabled()
    expect(screen.getByRole('table')).toHaveAccessibleName(
      'Tilgungsplan ohne Sondertilgung · Zinsbindung · Jährlich',
    )
    expect(screen.getAllByRole('row')).toHaveLength(11)
    expect(
      screen.getByRole('rowheader', { name: /Jahr 10.*Monate 109–120.*Monat 120/ }),
    ).toBeVisible()
    const first = screen.getByRole('rowheader', { name: /^Jahr 1.*Monate 1–12$/ }).closest('tr')!
    expect(within(first).getAllByText(/11\.000,04\s*€/)).toHaveLength(2)
    expect(screen.queryByText('Projektion')).not.toBeInTheDocument()
    expect(screen.queryByText(/Projektion bei konstantem Sollzins/)).not.toBeInTheDocument()
  })

  it('defaults to both annual schedules and exposes the actual partial payoff year in selected-only view', async () => {
    renderWithProviders(explorer(workspace({ additionalRepayments: annualPlan })))
    const user = await open(false)
    expect(screen.getByRole('radio', { name: 'Beide Verläufe' })).toBeChecked()
    expect(screen.getAllByRole('table')).toHaveLength(2)
    const selected = screen.getByRole('region', { name: selectedTitle })
    expect(within(selected).getByText('Darlehensjahre 1–10 von 10 · Seite 1 von 1')).toBeVisible()
    const first = within(selected)
      .getByRole('rowheader', { name: /^Jahr 1.*Monate 1–12$/ })
      .closest('tr')!
    expect(within(first).getByText(/5\.000\s*€/)).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    expect(screen.queryByRole('region', { name: baselineTitle })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    expect(screen.getAllByRole('row')).toHaveLength(18)
    const last = screen
      .getByRole('rowheader', { name: /Jahr 17.*Monate 193–203.*Teiljahr.*Volltilgung/ })
      .closest('tr')!
    expect(within(last).getAllByRole('cell').at(-1)).toHaveTextContent(/^0\s*€$/)
    expect(screen.getByText(/Betrachtungszeitraum bis Monat 348/)).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Ohne Sondertilgung' }))
    expect(screen.queryByRole('region', { name: selectedTitle })).not.toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(1)
  })

  it('resets pagination on horizon, detail and schedule changes while preserving input revisions view choices', async () => {
    const result = workspace({ additionalRepayments: annualPlan })
    const view = renderWithProviders(explorer(result))
    const user = await open()
    await user.click(
      within(screen.getByRole('region', { name: baselineTitle })).getByRole('button', {
        name: 'Weiter',
      }),
    )
    await user.click(screen.getByRole('radio', { name: 'Jährlich' }))
    expect(
      within(screen.getByRole('region', { name: baselineTitle })).getByText(
        'Darlehensjahre 1–24 von 29 · Seite 1 von 2',
      ),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    expect(
      within(screen.getByRole('region', { name: baselineTitle })).getByText(
        'Monate 1–24 von 348 · Seite 1 von 15',
      ),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Zinsbindung' }))
    expect(
      within(screen.getByRole('region', { name: baselineTitle })).getByText(
        'Monate 1–24 von 120 · Seite 1 von 5',
      ),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    await user.click(screen.getByRole('button', { name: 'Weiter' }))
    view.rerender(
      explorer(
        workspace({ nominalAnnualRate: '4,00', additionalRepayments: annualPlan }),
        'changed',
      ),
    )
    expect(screen.getByRole('radio', { name: 'Zinsbindung' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Monatlich' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Mit Sondertilgung' })).toBeChecked()
    expect(screen.getByText('Monate 1–24 von 120 · Seite 1 von 5')).toBeVisible()
  })

  it('preserves full annual view and its final page across languages', async () => {
    renderWithProviders(explorer())
    const user = await open(false)
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    await user.click(screen.getByRole('button', { name: 'Letzte Seite' }))
    expect(screen.getByText('Darlehensjahre 25–29 von 29 · Seite 2 von 2')).toBeVisible()
    await i18n.changeLanguage('en')
    expect(screen.getByRole('radio', { name: 'Full projected repayment' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Annual' })).toBeChecked()
    expect(screen.getByText('Loan years 25–29 of 29 · Page 2 of 2')).toBeVisible()
    expect(screen.getByRole('rowheader', { name: /Year 29.*Months 337–348.*Payoff/ })).toBeVisible()
  })

  it('falls back to the baseline when a selected plan becomes invalid or is removed', async () => {
    const view = renderWithProviders(explorer(workspace({ additionalRepayments: annualPlan })))
    const user = await open(false)
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    view.rerender(
      explorer(
        workspace({
          additionalRepayments: {
            ...annualPlan,
            oneTimeAdditionalRepayments: [{ amount: '', month: '12' }],
          },
        }),
        'invalid',
      ),
    )
    expect(screen.getByRole('radio', { name: 'Ohne Sondertilgung' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Mit Sondertilgung' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Beide Verläufe' })).toBeDisabled()
    expect(screen.getByText(/nur der ursprüngliche Verlauf als Referenz/)).toBeVisible()
    expect(screen.getAllByRole('table')).toHaveLength(1)
    view.rerender(explorer(workspace({ additionalRepayments: annualPlan }), 'valid-again'))
    expect(screen.getByRole('radio', { name: 'Ohne Sondertilgung' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Mit Sondertilgung' })).toBeEnabled()
    await user.click(screen.getByRole('radio', { name: 'Beide Verläufe' }))
    view.rerender(explorer(workspace(), 'removed'))
    expect(screen.getByRole('radio', { name: 'Ohne Sondertilgung' })).toBeChecked()
    expect(screen.queryByRole('region', { name: selectedTitle })).not.toBeInTheDocument()
  })

  it('identifies mixed annual periods without labelling all their interest as projected', async () => {
    const result = workspace()
    if (result.amortization.status !== 'available' || result.amortization.cashPurchase)
      throw new Error('Fixture unavailable')
    renderWithProviders(
      explorer({ ...result, amortization: { ...result.amortization, fixedInterestMonths: 14 } }),
    )
    const user = await open(false)
    expect(
      screen.getByRole('rowheader', { name: /Jahr 2.*Monate 13–14.*Teiljahr.*Monat 14/ }),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    expect(
      screen.getByRole('rowheader', { name: /Jahr 2.*Monate 13–24.*Monat 14.*innerhalb und nach/ }),
    ).toBeVisible()
    expect(
      screen.getByRole('rowheader', { name: /Jahr 3.*Monate 25–36.*Projektion/ }),
    ).toBeVisible()
  })

  it('supports native radio keyboard interaction', async () => {
    renderWithProviders(explorer())
    const user = await open(false)
    screen.getByRole('radio', { name: 'Jährlich' }).focus()
    await user.keyboard('[ArrowRight]')
    expect(screen.getByRole('radio', { name: 'Monatlich' })).toBeChecked()
    expect(screen.getByRole('columnheader', { name: 'Darlehensmonat' })).toBeVisible()
  })

  it('opens a bounded first page with exact opening debt and actual payment components', async () => {
    renderWithProviders(explorer())
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await open()
    const table = screen.getByRole('table', { name: new RegExp(baselineTitle) })
    expect(within(table).getAllByRole('row')).toHaveLength(25)
    const first = within(table).getByRole('rowheader', { name: '1' }).closest('tr')!
    expect(
      within(first)
        .getAllByRole('cell')
        .map((cell) => cell.textContent?.replaceAll('\u00a0', ' ')),
    ).toEqual(['200.000 €', '916,67 €', '583,33 €', '333,34 €', '0 €', '916,67 €', '199.666,66 €'])
    expect(screen.getByText('Monate 1–24 von 348 · Seite 1 von 15')).toBeVisible()
    expect(screen.getAllByText(/Projektion bei konstantem Sollzins/)).toHaveLength(2)
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
    expect(screen.getByRole('table', { name: new RegExp(baselineTitle) })).toBeVisible()
    expect(screen.queryByRole('table', { name: new RegExp(selectedTitle) })).not.toBeInTheDocument()
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
