import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '../../i18n/config'
import { formatEuroFromCents } from '../../i18n/formatters'
import { renderWithProviders, screen, userEvent, within } from '../../test/render'
import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  type FinancingDraft,
} from '../scenario-workspace'
import { AmortizationBreakdown } from './AmortizationBreakdown'
import { ChartDataView } from './ChartDataView'

const plan = {
  annualAdditionalRepayment: '5000',
  annualAdditionalRepaymentMonth: '12',
  oneTimeAdditionalRepayments: [],
}
function workspace(financing: Partial<FinancingDraft> = {}) {
  return calculateScenarioWorkspace(
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
      additionalRepayments: plan,
      ...financing,
    },
  )
}
function explorer(result = workspace(), inputKey = 'initial') {
  return (
    <I18nextProvider i18n={i18n}>
      <AmortizationBreakdown
        baseline={result.amortization}
        selected={result.selectedAmortization}
        selectedBasis={result.selectedAmortizationBasis}
        inputKey={inputKey}
      />
    </I18nextProvider>
  )
}
function dataView(title: string) {
  return screen.getByText(`Datenansicht: ${title}`, { selector: 'summary' }).closest('details')!
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

describe('chart-specific accessible alternatives', () => {
  it('does not format closed data views and keeps pagination, native semantics and focus bounded', async () => {
    const calls: number[] = []
    const user = userEvent.setup()
    renderWithProviders(
      <I18nextProvider i18n={i18n}>
        <ChartDataView
          id="fixture"
          title="Fixture"
          caption="Fixture · EUR"
          language="de"
          columns={['Monat', 'Betrag']}
          rowCount={1201}
          getRows={(first, count) => {
            calls.push(first)
            return Array.from({ length: Math.min(count, 1201 - first) }, (_, n) => ({
              key: first + n,
              heading: `Monat ${first + n}`,
              cells: [`${first + n} €`],
            }))
          }}
        />
      </I18nextProvider>,
    )
    expect(calls).toEqual([])
    const summary = screen.getByText('Datenansicht: Fixture')
    summary.focus()
    await user.click(summary)
    const table = screen.getByRole('table', { name: 'Fixture · EUR' })
    expect(within(table).getAllByRole('row')).toHaveLength(25)
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2)
    expect(within(table).getAllByRole('rowheader')).toHaveLength(24)
    const next = screen.getByRole('button', { name: 'Weiter' })
    await user.click(next)
    expect(next).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Einträge 25–48 von 1.201 · Seite 2 von 51',
    )
    expect(next).toHaveAttribute('aria-controls', table.id)
    await user.click(screen.getByRole('button', { name: 'Letzte Seite' }))
    expect(within(table).getAllByRole('row')).toHaveLength(2)
    expect(within(table).getByRole('rowheader')).toHaveTextContent('Monat 1200')
    expect(screen.getByRole('button', { name: 'Weiter' })).toHaveAttribute('aria-disabled', 'true')
    await user.click(summary)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(summary)
    expect(screen.getByRole('status')).toHaveTextContent('Seite 51 von 51')
  })

  it('exposes opening principal, exact payoff and fixed-period points with domain closing debt and labelled zero tails', async () => {
    const result = workspace()
    if (result.amortization.status !== 'available' || result.amortization.cashPurchase)
      throw new Error('fixture')
    const user = userEvent.setup()
    renderWithProviders(explorer(result))
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    const view = dataView('Restschuld im Zeitverlauf')
    await user.click(within(view).getByText('Datenansicht: Restschuld im Zeitverlauf'))
    const table = within(view).getByRole('table')
    expect(
      within(table)
        .getByRole('rowheader', { name: /Darlehensmonat 0.*Anfangsschuld/ })
        .closest('tr'),
    ).toHaveTextContent('200.000 €200.000 €')
    expect(
      within(table).getByRole('rowheader', { name: /Darlehensmonat 120.*Ende der Zinsbindung/ }),
    ).toBeVisible()
    const payoff = within(table)
      .getByRole('rowheader', { name: /Darlehensmonat 203.*Projektion/ })
      .closest('tr')!
    expect(within(payoff).getAllByRole('cell')[0]).toHaveTextContent(
      formatEuroFromCents(result.amortization.rows[202]!.closingBalanceCents, 'de').replace(
        /\s/g,
        ' ',
      ),
    )
    expect(within(payoff).getAllByRole('cell')[1]).toHaveTextContent('0 € · Volltilgung')
    await user.click(within(view).getByRole('button', { name: 'Letzte Seite' }))
    const tail = within(table)
      .getByRole('rowheader', { name: /Darlehensmonat 348/ })
      .closest('tr')!
    expect(within(tail).getAllByRole('cell')[0]).toHaveTextContent('0 € · Volltilgung')
    expect(within(tail).getAllByRole('cell')[1]).toHaveTextContent(
      '0 € · bereits vollständig getilgt; keine weiteren Zahlungen',
    )
    expect(within(view).getByRole('status')).toHaveTextContent('Einträge 25–31 von 31')
  })

  it('matches actual stacked amounts and partial payoff ranges, without adding post-payoff payment rows', async () => {
    const user = userEvent.setup()
    renderWithProviders(explorer())
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    const view = dataView('Zusammensetzung der Zahlungen')
    await user.click(within(view).getByText('Datenansicht: Zusammensetzung der Zahlungen'))
    const table = within(view).getByRole('table')
    const first = within(table)
      .getAllByRole('rowheader', { name: /Jahr 1 · Monate 1–12/ })[1]!
      .closest('tr')!
    expect(within(first).getByRole('rowheader')).toHaveTextContent('Innerhalb der Zinsbindung')
    expect(
      within(first)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual([
      'Mit Sondertilgung',
      '6.935,21 €',
      '4.064,83 €',
      '5.000 €',
      '11.000,04 €',
      '16.000,04 €',
    ])
    await user.click(within(view).getByRole('button', { name: 'Letzte Seite' }))
    const final = within(table)
      .getByRole('rowheader', {
        name: /Jahr 17 · Monate 193–203.*Teiljahr.*Projektion.*Volltilgung/,
      })
      .closest('tr')!
    expect(
      within(final)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Mit Sondertilgung', '146,03 €', '9.041,99 €', '0 €', '9.188,02 €', '9.188,02 €'])
    for (const row of within(table).getAllByRole('row').slice(1)) {
      if (within(row).getAllByRole('cell')[0]!.textContent === 'Mit Sondertilgung')
        expect(within(row).getByRole('rowheader')).not.toHaveTextContent(/Monate (205|217|229)/)
    }
    expect(within(view).getByRole('status')).toHaveTextContent('von 46')
    const graph = within(
      screen.getByRole('region', { name: 'Zusammensetzung der Zahlungen' }),
    ).getByRole('img')
    expect(graph.querySelectorAll('[data-payment-series]')).toHaveLength(46)
  })

  it('announces only user inspection with amounts and basis, retains locale state, and resets alternatives on input/control changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(explorer())
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    const debt = screen.getByRole('region', { name: 'Restschuld im Zeitverlauf' })
    const payments = screen.getByRole('region', { name: 'Zusammensetzung der Zahlungen' })
    expect(debt.querySelector('.chart-inspection-announcement')).toBeEmptyDOMElement()
    expect(payments.querySelector('.chart-inspection-announcement')).toBeEmptyDOMElement()
    const select = within(debt).getByRole('combobox')
    expect(select).toHaveAccessibleDescription(/Pfeiltasten.*Datenansicht/)
    expect(select.getAttribute('aria-controls')).toBe(debt.querySelector('dl')!.id)
    await user.selectOptions(select, '120')
    expect(debt.querySelector('[role=status]')).toHaveTextContent(
      'Darlehensmonat 120 · Innerhalb der Zinsbindung · Ende der Zinsbindung. Ohne Sondertilgung:',
    )
    await user.selectOptions(within(payments).getByRole('combobox'), '109')
    expect(payments.querySelector('[role=status]')).toHaveTextContent(
      /Mit Sondertilgung.*Sondertilgung: 5.000/,
    )
    const view = dataView('Zusammensetzung der Zahlungen')
    await user.click(within(view).getByText('Datenansicht: Zusammensetzung der Zahlungen'))
    await i18n.changeLanguage('en')
    expect(within(debt).getByRole('combobox')).toHaveValue('120')
    expect(debt.querySelector('[role=status]')).toHaveTextContent(
      'Loan month 120 · Within fixed interest · End of fixed interest',
    )
    expect(within(view).getByRole('table')).toHaveAccessibleName(
      /Data view: Payment composition.*Fixed-interest period.*Annual.*EUR/,
    )
    await user.click(screen.getByRole('radio', { name: 'Monthly' }))
    expect(screen.queryByRole('table', { name: /Data view/ })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Inspect a loan month in the chart' })).toHaveValue(
      '0',
    )
    expect(
      screen.getByRole('combobox', { name: 'Inspect a payment period in the chart' }),
    ).toHaveValue('1')
    rerender(explorer(workspace({ nominalAnnualRate: '4,00' }), 'changed'))
    expect(screen.queryByRole('table', { name: /Data view/ })).not.toBeInTheDocument()
  }, 10000)

  it('keeps every month of a long zero-interest loan available with bounded pagination', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      explorer(
        workspace({
          nominalAnnualRate: '0',
          initialRepaymentRate: '1',
          additionalRepayments: { ...plan, annualAdditionalRepayment: '' },
        }),
      ),
    )
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung' }))
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    const view = dataView('Restschuld im Zeitverlauf')
    await user.click(within(view).getByText('Datenansicht: Restschuld im Zeitverlauf'))
    expect(within(view).getByRole('status')).toHaveTextContent('von 1.201')
    expect(within(view).getAllByRole('row')).toHaveLength(25)
    await user.click(within(view).getByRole('button', { name: 'Letzte Seite' }))
    expect(within(view).getByRole('rowheader')).toHaveTextContent('Darlehensmonat 1.200')
  }, 10000)
  it('exposes the actual capped month-1 payoff in each equivalent view', async () => {
    const result = workspace({
      additionalRepayments: {
        ...plan,
        oneTimeAdditionalRepayments: [{ amount: '500000', month: '1' }],
      },
    })
    if (
      result.selectedAmortization.status !== 'available' ||
      result.selectedAmortization.cashPurchase
    )
      throw new Error('fixture')
    const user = userEvent.setup()
    renderWithProviders(explorer(result))
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    for (const title of ['Restschuld im Zeitverlauf', 'Zusammensetzung der Zahlungen'])
      await user.click(screen.getByText(`Datenansicht: ${title}`, { selector: 'summary' }))
    const debt = dataView('Restschuld im Zeitverlauf')
    expect(within(debt).getAllByRole('row')).toHaveLength(3)
    expect(
      within(debt)
        .getByRole('rowheader', { name: /^Darlehensmonat 1/ })
        .closest('tr'),
    ).toHaveTextContent('0 € · Volltilgung')
    const payment = dataView('Zusammensetzung der Zahlungen')
    expect(within(payment).getAllByRole('row')).toHaveLength(2)
    const row = within(payment)
      .getByRole('rowheader', { name: /Jahr 1 · Monate 1–1.*Teiljahr.*Volltilgung/ })
      .closest('tr')!
    expect(within(row).getAllByRole('cell').at(-1)!.textContent).toBe(
      formatEuroFromCents(result.selectedAmortization.rows[0]!.totalPaymentCents, 'de'),
    )
  })

  it('keeps focus and announces the final page while unavailable page buttons cannot change data', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <I18nextProvider i18n={i18n}>
        <ChartDataView
          id="two-pages"
          title="Fixture"
          caption="Fixture"
          columns={['Period', 'Value']}
          rowCount={25}
          language="de"
          getRows={(first, count) =>
            Array.from({ length: Math.min(count, 25 - first) }, (_, n) => ({
              key: first + n,
              heading: first + n,
              cells: [first + n],
            }))
          }
        />
      </I18nextProvider>,
    )
    await user.click(screen.getByText('Datenansicht: Fixture'))
    const next = screen.getByRole('button', { name: 'Weiter' })
    await user.click(next)
    expect(next).toHaveFocus()
    expect(next).toHaveAttribute('aria-disabled', 'true')
    expect(next).toHaveAttribute('tabindex', '-1')
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Einträge 25–25 von 25 · Seite 2 von 2')
  })
})
