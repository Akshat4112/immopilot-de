import { describe, expect, it } from 'vitest'

import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  type FinancingDraft,
} from '../scenario-workspace'
import { createAmortizationPeriods } from './amortizationPeriods'
import { createPaymentCompositionChart } from './paymentCompositionChart'
import { createRemainingDebtChart } from './remainingDebtChart'

const annualPlan = {
  annualAdditionalRepayment: '5000',
  annualAdditionalRepaymentMonth: '12',
  oneTimeAdditionalRepayments: [],
}

const fixtures: { name: string; financing: Partial<FinancingDraft>; payoff: number }[] = [
  {
    name: '348/203-month comparison',
    financing: { additionalRepayments: annualPlan },
    payoff: 203,
  },
  {
    name: '1,200-month zero-interest loan',
    financing: { nominalAnnualRate: '0', initialRepaymentRate: '1' },
    payoff: 1200,
  },
  {
    name: 'capped month-1 payoff',
    financing: {
      additionalRepayments: {
        ...annualPlan,
        oneTimeAdditionalRepayments: [{ amount: '500000', month: '1' }],
      },
    },
    payoff: 1,
  },
  {
    name: 'payments at months 120 and 121',
    financing: {
      additionalRepayments: {
        ...annualPlan,
        oneTimeAdditionalRepayments: [
          { amount: '1000', month: '120' },
          { amount: '2000', month: '121' },
        ],
      },
    },
    payoff: 198,
  },
]

describe('complete explorer accounting contract', () => {
  it.each(fixtures)(
    'reconciles every table period and both chart models for $name',
    ({ financing, payoff }) => {
      const result = calculateScenarioWorkspace(
        {
          ...initialPurchaseCostsDraft,
          purchasePrice: '250000',
          renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
          movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
        },
        { ...initialFinancingDraft, availableEquity: '66250', downPayment: '50000', ...financing },
      )
      const baseline = result.amortization
      const selected = result.selectedAmortization
      if (
        baseline.status !== 'available' ||
        baseline.cashPurchase ||
        selected.status !== 'available' ||
        selected.cashPurchase
      )
        throw new Error('Unavailable fixture')
      expect(selected.payoffMonth).toBe(payoff)
      const schedules = [
        { id: 'baseline' as const, schedule: baseline },
        { id: 'additional-repayments' as const, schedule: selected },
      ]
      const before = JSON.stringify(schedules)
      for (const horizon of ['fixed', 'full'] as const)
        for (const detail of ['annual', 'monthly'] as const) {
          const end =
            horizon === 'fixed'
              ? baseline.fixedInterestMonths
              : Math.max(baseline.payoffMonth, selected.payoffMonth)
          const payments = createPaymentCompositionChart(schedules, horizon, detail, end)
          const debt = createRemainingDebtChart(schedules, horizon, detail, end)
          expect(debt.months[0]).toBe(0)
          expect(debt.months.at(-1)).toBe(end)
          for (const [index, { schedule }] of schedules.entries()) {
            const periods = createAmortizationPeriods(schedule, horizon, detail)
            const raw = schedule.rows.filter((row) => row.month <= end)
            expect(periods[0]!.firstMonth).toBe(1)
            expect(periods.at(-1)!.lastMonth).toBe(Math.min(schedule.payoffMonth, end))
            expect(payments.series[index]!.periods.size).toBe(periods.length)
            let previousMonth = 0
            for (const period of periods) {
              expect(period.firstMonth).toBe(previousMonth + 1)
              const months = raw.filter(
                (row) => row.month >= period.firstMonth && row.month <= period.lastMonth,
              )
              expect(months).toHaveLength(period.lastMonth - period.firstMonth + 1)
              expect(period.openingBalanceCents).toBe(months[0]!.openingBalanceCents)
              expect(period.closingBalanceCents).toBe(months.at(-1)!.closingBalanceCents)
              for (const field of [
                'interestCents',
                'scheduledPrincipalCents',
                'additionalPrincipalCents',
                'regularPaymentCents',
                'totalPaymentCents',
              ] as const) {
                // Independent oracle: add actual monthly cents, never formatted euros or debt stocks.
                expect(period[field]).toBe(months.reduce((total, row) => total + row[field], 0))
              }
              expect(
                period.openingBalanceCents -
                  period.scheduledPrincipalCents -
                  period.additionalPrincipalCents,
              ).toBe(period.closingBalanceCents)
              expect(period.interestCents + period.scheduledPrincipalCents).toBe(
                period.regularPaymentCents,
              )
              expect(period.regularPaymentCents + period.additionalPrincipalCents).toBe(
                period.totalPaymentCents,
              )
              expect(payments.series[index]!.periods.get(period.firstMonth)).toEqual(period)
              previousMonth = period.lastMonth
            }
            for (const point of debt.series[index]!.points) {
              expect(point.balanceCents).toBe(
                point.month === 0
                  ? schedule.principalCents
                  : point.month > schedule.payoffMonth
                    ? 0
                    : schedule.rows[point.month - 1]!.closingBalanceCents,
              )
            }
            expect(
              [...payments.series[index]!.periods.values()].every(
                (period) => period.lastMonth <= schedule.payoffMonth,
              ),
            ).toBe(true)
          }
        }
      expect(JSON.stringify(schedules)).toBe(before)
    },
  )
})
