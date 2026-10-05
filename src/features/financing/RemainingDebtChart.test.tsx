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
import { createRemainingDebtChart } from './remainingDebtChart'

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
    { ...initialFinancingDraft, availableEquity: '66250', downPayment: '50000', ...financing },
  )
}
function schedules(financing: Partial<FinancingDraft> = { additionalRepayments: plan }) {
  const result = workspace(financing)
  const baseline = result.amortization
  const selected = result.selectedAmortization
  if (
    baseline.status !== 'available' ||
    baseline.cashPurchase ||
    selected.status !== 'available' ||
    selected.cashPurchase
  )
    throw new Error('Fixture unavailable')
  return [
    { id: 'baseline' as const, schedule: baseline },
    { id: 'additional-repayments' as const, schedule: selected },
  ]
}
function explorer(result = workspace({ additionalRepayments: plan }), inputKey = 'initial') {
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

describe('remaining-debt presentation model', () => {
  it('uses month-zero principal and actual annual closing debt through fixed month 120', () => {
    const source = schedules()
    const model = createRemainingDebtChart(source, 'fixed', 'annual', 120)
    expect(model.months).toEqual([0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120])
    expect(model.series[0]!.points[0]).toEqual({ month: 0, balanceCents: 20_000_000 })
    expect(model.series[0]!.points[1]).toEqual({
      month: 12,
      balanceCents: source[0]!.schedule.rows[11]!.closingBalanceCents,
    })
    for (const [index, series] of model.series.entries())
      expect(series.points.at(-1)!.balanceCents).toBe(
        source[index]!.schedule.remainingDebtAtFixedPeriodCents,
      )
  })

  it('aligns 348/203-month schedules and adds the exact partial-year payoff without altering domain rows', () => {
    const source = schedules()
    const before = JSON.stringify(source)
    const model = createRemainingDebtChart(source, 'full', 'annual', 348)
    expect(model.series.map((s) => s.payoffMonth)).toEqual([348, 203])
    expect(model.months).toContain(203)
    expect(model.series[0]!.points.find((p) => p.month === 203)!.balanceCents).toBe(
      source[0]!.schedule.rows[202]!.closingBalanceCents,
    )
    expect(
      model.series[1]!.points.filter((p) => p.month >= 203).every((p) => p.balanceCents === 0),
    ).toBe(true)
    expect(model.series[0]!.points.at(-1)).toEqual({ month: 348, balanceCents: 0 })
    expect(JSON.stringify(source)).toBe(before)
    expect(source[1]!.schedule.rows).toHaveLength(203)
  })

  it('keeps every monthly closing balance exactly and pads only chart balances after payoff', () => {
    const source = schedules()
    const model = createRemainingDebtChart(source, 'full', 'monthly', 348)
    expect(model.months).toHaveLength(349)
    for (const [index, series] of model.series.entries())
      for (const p of series.points.slice(1))
        expect(p.balanceCents).toBe(
          p.month > source[index]!.schedule.payoffMonth
            ? 0
            : source[index]!.schedule.rows[p.month - 1]!.closingBalanceCents,
        )
  })

  it('preserves a non-annual fixed boundary at month 14 without rounding it to a year', () => {
    const source = schedules().map((s) => ({
      ...s,
      schedule: { ...s.schedule, fixedInterestMonths: 14 },
    }))
    expect(createRemainingDebtChart(source, 'fixed', 'annual', 14).months).toEqual([0, 12, 14])
    expect(createRemainingDebtChart(source, 'full', 'annual', 348).months).toContain(14)
  })

  it('does not apply a month-121 repayment to the fixed-period month-120 balance', () => {
    const source = schedules({
      additionalRepayments: {
        ...plan,
        annualAdditionalRepayment: '',
        oneTimeAdditionalRepayments: [{ amount: '10000', month: '121' }],
      },
    })
    const fixed = createRemainingDebtChart(source, 'fixed', 'monthly', 120)
    expect(fixed.series[0]!.points.at(-1)).toEqual(fixed.series[1]!.points.at(-1))
    const full = createRemainingDebtChart(source, 'full', 'monthly', 348)
    expect(
      full.series[0]!.points[121]!.balanceCents - full.series[1]!.points[121]!.balanceCents,
    ).toBe(1_000_000)
  })

  it('ends an early-payoff-only fixed view at month 1 and keeps the marker outside that horizon', () => {
    const source = schedules({
      additionalRepayments: {
        ...plan,
        oneTimeAdditionalRepayments: [{ amount: '500000', month: '1' }],
      },
    })
    const model = createRemainingDebtChart([source[1]!], 'fixed', 'annual', 120)
    expect(model.months).toEqual([0, 1])
    expect(model.fixedMonth).toBe(120)
    expect(model.series[0]!.points.at(-1)!.balanceCents).toBe(0)
    const both = createRemainingDebtChart(source, 'full', 'annual', 348)
    expect(both.series[1]!.points.slice(1).every((p) => p.balanceCents === 0)).toBe(true)
  })

  it('supports all 1,200 months of zero-interest repayment', () => {
    const source = schedules({ nominalAnnualRate: '0,00', initialRepaymentRate: '1,00' })
    const model = createRemainingDebtChart([source[0]!], 'full', 'monthly', 1200)
    expect(model.months).toHaveLength(1201)
    expect(model.series[0]!.points[600]!.balanceCents).toBe(
      source[0]!.schedule.rows[599]!.closingBalanceCents,
    )
    expect(model.series[0]!.points.at(-1)).toEqual({ month: 1200, balanceCents: 0 })
  })
})

describe('remaining-debt explorer chart', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('is deferred until the disclosure opens, exposes distinct bases, and follows view controls', async () => {
    renderWithProviders(explorer())
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    const chart = screen.getByRole('img', { name: /Restschuld im Zeitverlauf/ })
    expect(chart.querySelector('[data-fixed-month="120"]')).toBeInTheDocument()
    expect(chart.querySelector('[data-chart-projection]')).not.toBeInTheDocument()
    expect(chart.querySelectorAll('[data-debt-series]')).toHaveLength(2)
    expect(screen.getByText('Ohne Sondertilgung · durchgezogen, Kreis')).toBeVisible()
    expect(screen.getByText('Mit Sondertilgung · gestrichelt, Raute')).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelector('[data-chart-projection]'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelectorAll('[data-debt-series]'),
    ).toHaveLength(1)
    expect(screen.getAllByRole('table')).toHaveLength(1)
  })

  it('shows exact inspection amounts, a zero tail after payoff, and preserves the inspected month across locale changes', async () => {
    renderWithProviders(explorer())
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Darlehensmonat im Diagramm prüfen' }),
      '203',
    )
    const inspector = screen
      .getByRole('combobox', { name: 'Darlehensmonat im Diagramm prüfen' })
      .closest('div')!
    expect(within(inspector).getByText('0 € · Volltilgung')).toBeVisible()
    const baseline = schedules()[0]!.schedule.rows[202]!.closingBalanceCents
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelector('[data-debt-series="baseline"] [data-chart-month="203"]'),
    ).toHaveAttribute('data-balance-cents', String(baseline))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Darlehensmonat im Diagramm prüfen' }),
      '216',
    )
    expect(
      within(inspector).getByText(/bereits vollständig getilgt; keine weiteren Zahlungen/),
    ).toBeVisible()
    await i18n.changeLanguage('en')
    expect(screen.getByRole('combobox', { name: 'Inspect a loan month in the chart' })).toHaveValue(
      '216',
    )
    expect(screen.getByRole('img', { name: /Remaining debt over time/ })).toBeVisible()
    expect(screen.getByText('With additional repayments · dashed, diamond')).toBeVisible()
  })

  it('is independent of table pagination and updates from changed domain inputs', async () => {
    const result = workspace({ additionalRepayments: plan })
    const { rerender } = renderWithProviders(explorer(result))
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    const before = screen
      .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
      .querySelector('.debt-chart-line')!
      .getAttribute('d')
    await user.click(
      within(screen.getByRole('region', { name: 'Tilgungsplan ohne Sondertilgung' })).getByRole(
        'button',
        { name: 'Letzte Seite' },
      ),
    )
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelector('.debt-chart-line'),
    ).toHaveAttribute('d', before)
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Darlehensmonat im Diagramm prüfen' }),
      '203',
    )
    rerender(
      explorer(workspace({ nominalAnnualRate: '4,00', additionalRepayments: plan }), 'changed'),
    )
    expect(screen.getByRole('combobox', { name: 'Darlehensmonat im Diagramm prüfen' })).toHaveValue(
      '0',
    )
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelector('.debt-chart-line')!
        .getAttribute('d'),
    ).not.toBe(before)
  })

  it('states when an early payoff makes the fixed-period marker outside the chart', async () => {
    renderWithProviders(
      explorer(
        workspace({
          additionalRepayments: {
            ...plan,
            oneTimeAdditionalRepayments: [{ amount: '500000', month: '1' }],
          },
        }),
      ),
    )
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelector('[data-fixed-month]'),
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByText(/Volltilgung vor dem Ende der Zinsbindung in Monat 120/),
    ).toHaveLength(2)
    expect(
      screen
        .getByRole('combobox', { name: 'Darlehensmonat im Diagramm prüfen' })
        .querySelectorAll('option'),
    ).toHaveLength(2)
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelector('[data-chart-payoff]'),
    ).toHaveAttribute('data-chart-month', '1')
  })

  it('falls back to one baseline path for invalid plans and shows no chart for cash or unavailable baseline', async () => {
    const { rerender } = renderWithProviders(
      explorer(
        workspace({
          additionalRepayments: {
            ...plan,
            oneTimeAdditionalRepayments: [{ amount: '', month: '12' }],
          },
        }),
      ),
    )
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    expect(
      screen
        .getByRole('img', { name: /Restschuld im Zeitverlauf/ })
        .querySelectorAll('[data-debt-series]'),
    ).toHaveLength(1)
    expect(screen.getByText(/nur der ursprüngliche Verlauf als Referenz/)).toBeVisible()
    rerender(explorer(workspace({ availableEquity: '300000', downPayment: '250000' })))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    rerender(explorer(workspace({ initialRepaymentRate: '0,01' })))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
