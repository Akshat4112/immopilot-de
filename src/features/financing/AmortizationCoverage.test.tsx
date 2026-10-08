import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import { renderWithProviders, screen, userEvent, within } from '../../test/render'
import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
} from '../scenario-workspace'
import { AmortizationBreakdown } from './AmortizationBreakdown'

describe.each(['de', 'en'] as const)('complete long-loan alternatives in %s', (language) => {
  it('reaches the capped final payment in both chart alternatives and the schedule, then restores annual detail', async () => {
    await i18n.changeLanguage(language)
    const result = calculateScenarioWorkspace(
      {
        ...initialPurchaseCostsDraft,
        purchasePrice: '250000',
        renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
        movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      },
      {
        ...initialFinancingDraft,
        availableEquity: '66250',
        downPayment: '50000',
        nominalAnnualRate: '0',
        initialRepaymentRate: '1',
      },
    )
    expect(result.amortization).toMatchObject({
      status: 'available',
      payoffMonth: 1200,
      projectedLifetimeInterestCents: 0,
    })
    const copy =
      language === 'de'
        ? {
            open: 'Detaillierten Tilgungsplan öffnen',
            full: 'Vollständige Rückzahlung (Projektion)',
            monthly: 'Monatlich',
            annual: 'Jährlich',
            last: 'Letzte Seite',
            debt: 'Restschuld im Zeitverlauf',
            payment: 'Zusammensetzung der Zahlungen',
            baseline: 'Ohne Sondertilgung',
            final: '162,67 €',
            zero: '0 €',
            annualFinal: '1.996,04 €',
            payoff: 'Volltilgung',
          }
        : {
            open: 'Open detailed amortization schedule',
            full: 'Full projected repayment',
            monthly: 'Monthly',
            annual: 'Annual',
            last: 'Last page',
            debt: 'Remaining debt over time',
            payment: 'Payment composition',
            baseline: 'Baseline',
            final: '€162.67',
            zero: '€0',
            annualFinal: '€1,996.04',
            payoff: 'Payoff',
          }
    const user = userEvent.setup()
    renderWithProviders(
      <I18nextProvider i18n={i18n}>
        <AmortizationBreakdown
          baseline={result.amortization}
          selected={result.selectedAmortization}
          selectedBasis={result.selectedAmortizationBasis}
          inputKey="long"
        />
      </I18nextProvider>,
    )
    await user.click(screen.getByText(copy.open))
    await user.click(screen.getByRole('radio', { name: copy.full }))
    await user.click(screen.getByRole('radio', { name: copy.monthly }))
    const views = [copy.debt, copy.payment].map((title) =>
      screen.getByRole('region', { name: title }),
    )
    for (const view of views) {
      await user.click(
        within(view).getByText(
          language === 'de'
            ? `Datenansicht: ${view === views[0] ? copy.debt : copy.payment}`
            : `Data view: ${view === views[0] ? copy.debt : copy.payment}`,
          { selector: 'summary' },
        ),
      )
      expect(within(view).getByRole('table')).toHaveAccessibleName(/Monthly.*EUR|Monatlich.*EUR/)
      expect(within(view).getAllByRole('row')).toHaveLength(25)
      const last = within(view).getByRole('button', { name: copy.last })
      await user.click(last)
      expect(last).toHaveFocus()
      expect(last).toHaveAttribute('aria-disabled', 'true')
      await user.keyboard('{Enter}')
    }
    const debtRow = within(views[0]!).getAllByRole('row').at(-1)!
    expect(within(debtRow).getByRole('rowheader')).toHaveTextContent(
      language === 'de' ? 'Darlehensmonat 1.200' : 'Loan month 1,200',
    )
    expect(within(debtRow).getByRole('cell')).toHaveTextContent(
      language === 'de' ? '0 € · Volltilgung' : '€0 · Payoff',
    )
    expect(within(views[0]!).getAllByRole('row')).toHaveLength(2)
    const paymentRow = within(views[1]!).getAllByRole('row').at(-1)!
    expect(within(paymentRow).getByRole('rowheader')).toHaveTextContent(copy.payoff)
    expect(
      within(paymentRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual([copy.baseline, copy.zero, copy.final, copy.zero, copy.final, copy.final])
    expect(within(views[1]!).getAllByRole('row')).toHaveLength(25)
    const schedule = document.querySelector<HTMLElement>('.amortization-schedule')!
    await user.click(within(schedule).getByRole('button', { name: copy.last }))
    const final = within(schedule).getAllByRole('row').at(-1)!
    expect(within(final).getAllByRole('cell')[1]!.textContent).toBe(copy.final)
    expect(within(final).getAllByRole('cell').at(-1)!.textContent).toBe(copy.zero)
    await user.click(screen.getByRole('radio', { name: copy.annual }))
    // Control changes reset both alternatives and all pages; only the schedule remains open.
    expect(screen.getAllByRole('table')).toHaveLength(1)
    const annualSchedule = document.querySelector<HTMLElement>('.amortization-schedule')!
    expect(within(annualSchedule).getAllByRole('row')).toHaveLength(25)
    await user.click(within(annualSchedule).getByRole('button', { name: copy.last }))
    const annual = within(annualSchedule).getAllByRole('row').at(-1)!
    expect(within(annual).getByRole('rowheader')).toHaveTextContent(
      language === 'de' ? 'Jahr 100' : 'Year 100',
    )
    expect(within(annual).getAllByRole('cell')[1]!.textContent).toBe(copy.annualFinal)
    expect(within(annual).getAllByRole('cell')[2]!.textContent).toBe(copy.zero)
    expect(within(annual).getAllByRole('cell').at(-1)!.textContent).toBe(copy.zero)
  }, 15000)
})
