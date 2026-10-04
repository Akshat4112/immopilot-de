import { I18nextProvider } from 'react-i18next'
import { beforeEach, describe, expect, it } from 'vitest'

import { moneyCents, sumMoney } from '../../domain/shared/money'
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
import { createPaymentCompositionChart } from './paymentCompositionChart'

const plan = {
  annualAdditionalRepayment: '5000',
  annualAdditionalRepaymentMonth: '12',
  oneTimeAdditionalRepayments: [],
}
function workspace(financing: Partial<FinancingDraft> = { additionalRepayments: plan }) {
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
function schedules(financing?: Partial<FinancingDraft>) {
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
function chart() {
  return screen.getByRole('region', { name: 'Zusammensetzung der Zahlungen' })
}
function details(basis = 'Ohne Sondertilgung') {
  return within(chart()).getByRole('region', { name: basis })
}

describe('payment-composition presentation model', () => {
  it('uses the actual first-year cash flows and reconciles both components to the total', () => {
    const source = schedules()
    const before = JSON.stringify(source)
    const model = createPaymentCompositionChart(source, 'fixed', 'annual', 120)
    expect(model.columns).toHaveLength(10)
    expect(model.columns[0]).toEqual({ firstMonth: 1, lastMonth: 12, loanYear: 1 })
    for (const [index, series] of model.series.entries()) {
      const schedule = source[index]!.schedule
      const period = series.periods.get(1)!
      expect(period.interestCents).toBe(schedule.firstYearInterestCents)
      expect(period.scheduledPrincipalCents).toBe(schedule.firstYearScheduledPrincipalCents)
      expect(period.additionalPrincipalCents).toBe(schedule.firstYearAdditionalPrincipalCents)
      expect(period.regularPaymentCents).toBe(1_100_004)
      expect(period.totalPaymentCents).toBe(index === 0 ? 1_100_004 : 1_600_004)
      expect(period.interestCents + period.scheduledPrincipalCents).toBe(period.regularPaymentCents)
      expect(period.regularPaymentCents + period.additionalPrincipalCents).toBe(
        period.totalPaymentCents,
      )
    }
    expect(JSON.stringify(source)).toBe(before)
  })

  it('aligns partial payoff years without manufacturing payments after month 203', () => {
    const source = schedules()
    const model = createPaymentCompositionChart(source, 'full', 'annual', 348)
    expect(model.columns).toHaveLength(29)
    expect(model.series.map((s) => s.periods.size)).toEqual([29, 17])
    expect(model.series[0]!.periods.get(193)).toMatchObject({ firstMonth: 193, lastMonth: 204 })
    expect(model.series[1]!.periods.get(193)).toMatchObject({
      firstMonth: 193,
      lastMonth: 203,
      closingBalanceCents: 0,
    })
    expect(model.series[1]!.periods.has(205)).toBe(false)
    for (const [index, series] of model.series.entries()) {
      const periods = [...series.periods.values()]
      const schedule = source[index]!.schedule
      expect(sumMoney(periods.map((p) => p.interestCents))).toBe(
        schedule.projectedLifetimeInterestCents,
      )
      expect(sumMoney(periods.map((p) => p.scheduledPrincipalCents))).toBe(
        schedule.projectedLifetimeScheduledPrincipalCents,
      )
      expect(sumMoney(periods.map((p) => p.additionalPrincipalCents))).toBe(
        schedule.projectedLifetimeAdditionalPrincipalCents,
      )
      expect(sumMoney(periods.map((p) => p.totalPaymentCents))).toBe(
        schedule.principalCents + schedule.projectedLifetimeInterestCents,
      )
    }
  })

  it('preserves every monthly component and the capped final regular payment', () => {
    const source = schedules()
    const model = createPaymentCompositionChart(source, 'full', 'monthly', 348)
    expect(model.columns).toHaveLength(348)
    for (const [index, series] of model.series.entries()) {
      for (const row of source[index]!.schedule.rows) {
        const period = series.periods.get(row.month)!
        for (const component of [
          'interestCents',
          'scheduledPrincipalCents',
          'additionalPrincipalCents',
          'regularPaymentCents',
          'totalPaymentCents',
        ] as const)
          expect(period[component]).toBe(row[component])
      }
    }
    expect(model.series[1]!.periods.get(203)!.regularPaymentCents).toBeLessThan(
      source[1]!.schedule.contractualMonthlyPaymentCents,
    )
    expect(model.series[1]!.periods.has(204)).toBe(false)
  })

  it('cuts at fixed month 14 before aggregation and keeps a mixed full-year bucket intact', () => {
    const source = schedules().map((s) => ({
      ...s,
      schedule: { ...s.schedule, fixedInterestMonths: 14 },
    }))
    const fixed = createPaymentCompositionChart(source, 'fixed', 'annual', 14)
    const full = createPaymentCompositionChart(source, 'full', 'annual', 348)
    expect(fixed.columns.at(-1)).toEqual({ firstMonth: 13, lastMonth: 14, loanYear: 2 })
    expect(fixed.series[0]!.periods.get(13)).toMatchObject({
      lastMonth: 14,
      regularPaymentCents: 183_334,
    })
    expect(full.series[0]!.periods.get(13)).toMatchObject({
      lastMonth: 24,
      regularPaymentCents: 1_100_004,
    })
    expect(full.fixedMonth).toBe(14)
  })

  it('excludes a month-121 one-time repayment from fixed totals and retains coincident events', () => {
    const source = schedules({
      additionalRepayments: {
        ...plan,
        oneTimeAdditionalRepayments: [
          { amount: '3000', month: '12' },
          { amount: '10000', month: '121' },
        ],
      },
    })
    const fixed = createPaymentCompositionChart(source, 'fixed', 'annual', 120)
    const full = createPaymentCompositionChart(source, 'full', 'monthly', 348)
    expect(fixed.series[1]!.periods.get(1)!.additionalPrincipalCents).toBe(800_000)
    expect(
      sumMoney([...fixed.series[1]!.periods.values()].map((p) => p.additionalPrincipalCents)),
    ).toBe(5_300_000)
    expect(full.series[1]!.periods.get(121)!.additionalPrincipalCents).toBe(1_000_000)
    expect(fixed.series[1]!.periods.has(121)).toBe(false)
  })

  it('uses capped actual month-1 principal rather than the requested additional amount', () => {
    const source = schedules({
      additionalRepayments: {
        ...plan,
        oneTimeAdditionalRepayments: [{ amount: '500000', month: '1' }],
      },
    })
    const fixed = createPaymentCompositionChart([source[1]!], 'fixed', 'annual', 120)
    expect(fixed.endMonth).toBe(1)
    expect(fixed.columns).toEqual([{ firstMonth: 1, lastMonth: 1, loanYear: 1 }])
    expect(fixed.series[0]!.periods.get(1)).toMatchObject({
      additionalPrincipalCents: 19_966_666,
      totalPaymentCents: 20_058_333,
      lastMonth: 1,
    })
    const full = createPaymentCompositionChart([source[1]!], 'full', 'annual', 348)
    expect(full.columns).toHaveLength(29)
    expect(full.series[0]!.periods.size).toBe(1)
  })

  it('keeps all 1,200 zero-interest payments and exposes safe-money aggregation overflow', () => {
    const source = schedules({ nominalAnnualRate: '0,00', initialRepaymentRate: '1,00' })
    const model = createPaymentCompositionChart([source[0]!], 'full', 'monthly', 1200)
    expect(model.columns).toHaveLength(1200)
    expect([...model.series[0]!.periods.values()].every((p) => p.interestCents === 0)).toBe(true)
    expect(sumMoney([...model.series[0]!.periods.values()].map((p) => p.totalPaymentCents))).toBe(
      20_000_000,
    )
    const row = {
      ...source[0]!.schedule.rows[0]!,
      regularPaymentCents: moneyCents(Number.MAX_SAFE_INTEGER),
    }
    const overflow = [
      {
        ...source[0]!,
        schedule: { ...source[0]!.schedule, payoffMonth: 2, rows: [row, { ...row, month: 2 }] },
      },
    ]
    expect(() => createPaymentCompositionChart(overflow, 'fixed', 'annual', 120)).toThrow(
      /safe integer range/,
    )
    expect(
      createPaymentCompositionChart(overflow, 'fixed', 'monthly', 120).series[0]!.periods.size,
    ).toBe(2)
  })
})

describe('payment-composition explorer chart', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de')
  })

  it('defers drawing, distinguishes three components and bases, and follows shared controls', async () => {
    renderWithProviders(explorer())
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    const graph = within(chart()).getByRole('img')
    expect(graph).toHaveAccessibleName(/Zusammensetzung der Zahlungen/)
    expect(graph.querySelectorAll('[data-payment-series]')).toHaveLength(20)
    expect(graph.querySelector('[data-payment-projection]')).not.toBeInTheDocument()
    expect(within(chart()).getByText('Zinsen · einfarbig')).toBeVisible()
    expect(within(chart()).getByText('Reguläre Tilgung · Streifen')).toBeVisible()
    expect(within(chart()).getByText('Sondertilgung · Punkte')).toBeVisible()
    const selected = graph.querySelector(
      '[data-payment-series="additional-repayments"][data-first-month="1"]',
    )!
    expect(selected).toHaveAttribute('data-total-cents', '1600004')
    expect(selected.querySelector('[data-component="additionalPrincipal"]')).toHaveAttribute(
      'fill',
      expect.stringMatching(/^url\(#/),
    )
    const heights = [...selected.querySelectorAll('[data-component]')].reduce(
      (sum, r) => sum + Number(r.getAttribute('height')),
      0,
    )
    expect(heights).toBeCloseTo(
      Number(selected.querySelector('.payment-bar-outline')!.getAttribute('height')),
      10,
    )
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    expect(within(chart()).getByRole('img').querySelectorAll('[data-payment-series]')).toHaveLength(
      46,
    )
    expect(
      within(chart()).getByRole('img').querySelector('[data-payment-projection]'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Mit Sondertilgung' }))
    expect(
      within(chart()).getByRole('img').querySelectorAll('[data-payment-series="baseline"]'),
    ).toHaveLength(0)
    expect(within(chart()).getByRole('img').querySelectorAll('[data-payment-series]')).toHaveLength(
      17,
    )
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    expect(within(chart()).getByRole('combobox').querySelectorAll('option')).toHaveLength(348)
    expect(within(chart()).getByRole('img').querySelectorAll('[data-payment-series]')).toHaveLength(
      203,
    )
  })

  it('inspects exact partial periods and amounts, preserving selection across locale changes', async () => {
    renderWithProviders(explorer())
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    const selector = within(chart()).getByRole('combobox', {
      name: 'Zahlungszeitraum im Diagramm prüfen',
    })
    await user.selectOptions(selector, '193')
    expect(within(details()).getByText(/Monate 193–204/)).toBeVisible()
    expect(
      within(details('Mit Sondertilgung')).getByText(
        /Monate 193–203 · Teiljahr · Projektion · Volltilgung/,
      ),
    ).toBeVisible()
    const expected = createPaymentCompositionChart(
      schedules(),
      'full',
      'annual',
      348,
    ).series[1]!.periods.get(193)!
    for (const [label, value] of [
      ['Zinsen', expected.interestCents],
      ['Reguläre Tilgung', expected.scheduledPrincipalCents],
      ['Sondertilgung', expected.additionalPrincipalCents],
      ['Reguläre Zahlungen (Summe)', expected.regularPaymentCents],
      ['Gesamtzahlung', expected.totalPaymentCents],
    ] as const)
      expect(
        within(within(details('Mit Sondertilgung')).getByText(label).closest('div')!).getByText(
          formatEuroFromCents(value, 'de').replaceAll('\u00a0', ' '),
        ),
      ).toBeVisible()
    await i18n.changeLanguage('en')
    const english = screen.getByRole('region', { name: 'Payment composition' })
    expect(
      within(english).getByRole('combobox', { name: 'Inspect a payment period in the chart' }),
    ).toHaveValue('193')
    expect(within(english).getByRole('img')).toHaveAccessibleName(/Payment composition/)
    expect(within(english).getByText('Scheduled principal · stripes')).toBeVisible()
  })

  it('retains all chart periods across table pages and resets inspection on input changes', async () => {
    const { rerender } = renderWithProviders(explorer())
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    await user.selectOptions(within(chart()).getByRole('combobox'), '193')
    const before = within(chart()).getByRole('img').innerHTML
    await user.click(
      within(screen.getByRole('region', { name: 'Tilgungsplan ohne Sondertilgung' })).getByRole(
        'button',
        { name: 'Letzte Seite' },
      ),
    )
    expect(within(chart()).getByRole('img').innerHTML).toBe(before)
    expect(within(chart()).getByRole('combobox')).toHaveValue('193')
    rerender(
      explorer(workspace({ nominalAnnualRate: '4,00', additionalRepayments: plan }), 'changed'),
    )
    expect(within(chart()).getByRole('combobox')).toHaveValue('1')
    expect(within(chart()).getByRole('img').innerHTML).not.toBe(before)
  })

  it('labels mixed annual boundaries and places a partial fixed-period marker at the chart end', async () => {
    const result = workspace()
    if (
      result.amortization.status !== 'available' ||
      result.amortization.cashPurchase ||
      result.selectedAmortization.status !== 'available' ||
      result.selectedAmortization.cashPurchase
    )
      throw new Error('Fixture unavailable')
    renderWithProviders(
      explorer({
        ...result,
        amortization: { ...result.amortization, fixedInterestMonths: 14 },
        selectedAmortization: { ...result.selectedAmortization, fixedInterestMonths: 14 },
      }),
    )
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    const marker = within(chart()).getByRole('img').querySelector('[data-payment-fixed-month]')!
    expect(marker).toHaveAttribute('data-payment-fixed-month', '14')
    expect(marker).toHaveAttribute('x1', '688')
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    await user.selectOptions(within(chart()).getByRole('combobox'), '13')
    expect(
      within(chart()).getByText(/sein Balken behält die vollständige Jahressumme/),
    ).toBeVisible()
    expect(
      within(details()).getByText(/Zahlungen innerhalb und nach der Zinsbindung/),
    ).toBeVisible()
  })

  it('leaves the post-payoff area empty and explains a boundary beyond early payoff', async () => {
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
    expect(within(chart()).getByRole('img').querySelectorAll('[data-payment-series]')).toHaveLength(
      1,
    )
    expect(
      within(chart()).getByRole('img').querySelector('[data-payment-fixed-month]'),
    ).not.toBeInTheDocument()
    expect(
      within(chart()).getByText(/Volltilgung vor dem Ende der Zinsbindung in Monat 120/),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Vollständige Rückzahlung (Projektion)' }))
    await user.selectOptions(within(chart()).getByRole('combobox'), '205')
    expect(
      within(details('Mit Sondertilgung')).getByText(/bereits vollständig getilgt/),
    ).toBeVisible()
    expect(within(details('Mit Sondertilgung')).queryByRole('definition')).not.toBeInTheDocument()
    expect(within(chart()).getByRole('img').querySelectorAll('[data-payment-series]')).toHaveLength(
      1,
    )
    expect(
      within(chart()).getByRole('img').querySelector('[data-payment-projection]'),
    ).not.toBeInTheDocument()
  })

  it('preserves baseline reference warnings for invalid plans and omits charts for cash/unavailable loans', async () => {
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
      within(chart())
        .getByRole('img')
        .querySelectorAll('[data-payment-series="additional-repayments"]'),
    ).toHaveLength(0)
    expect(screen.getByText(/nur der ursprüngliche Verlauf als Referenz/)).toBeVisible()
    rerender(explorer(workspace({ availableEquity: '300000', downPayment: '250000' })))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    rerender(explorer(workspace({ initialRepaymentRate: '0,01' })))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('offers monthly recovery when annual aggregation exceeds the supported money range', async () => {
    const result = workspace()
    if (result.amortization.status !== 'available' || result.amortization.cashPurchase)
      throw new Error('Fixture unavailable')
    const first = {
      ...result.amortization.rows[0]!,
      regularPaymentCents: moneyCents(Number.MAX_SAFE_INTEGER),
    }
    const baseline = {
      ...result.amortization,
      payoffMonth: 2,
      rows: [first, { ...first, month: 2, closingBalanceCents: moneyCents(0) }],
    }
    renderWithProviders(
      <I18nextProvider i18n={i18n}>
        <AmortizationBreakdown
          baseline={baseline}
          selected={baseline}
          selectedBasis="baseline"
          inputKey="overflow"
        />
      </I18nextProvider>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByText('Detaillierten Tilgungsplan öffnen'))
    expect(within(chart()).queryByRole('img')).not.toBeInTheDocument()
    expect(within(chart()).getByText(/jährlichen Summen überschreiten/)).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'Monatlich' }))
    expect(within(chart()).getByRole('img').querySelectorAll('[data-payment-series]')).toHaveLength(
      2,
    )
  })
})
