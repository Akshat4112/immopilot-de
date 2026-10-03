import { describe, expect, it } from 'vitest'

import type { MortgageAmortizationScheduleResult } from '../../domain/mortgage/amortization-types'
import { moneyCents, sumMoney } from '../../domain/shared/money'
import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  type FinancingDraft,
} from '../scenario-workspace'
import { createAmortizationPeriods } from './amortizationPeriods'

function schedule(financing: Partial<FinancingDraft> = {}) {
  const result = calculateScenarioWorkspace(
    {
      ...initialPurchaseCostsDraft,
      purchasePrice: '250000',
      renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    },
    { ...initialFinancingDraft, availableEquity: '66250', downPayment: '50000', ...financing },
  ).selectedAmortization
  if (result.status !== 'available' || result.cashPurchase) throw new Error('Fixture unavailable')
  return result
}

const plan = {
  annualAdditionalRepayment: '5000',
  annualAdditionalRepaymentMonth: '12',
  oneTimeAdditionalRepayments: [],
}

describe('amortization presentation periods', () => {
  it('aggregates the first loan year exactly and retains endpoint debt', () => {
    const source = schedule()
    const [first] = createAmortizationPeriods(source, 'fixed', 'annual')
    expect(first).toMatchObject({
      firstMonth: 1,
      lastMonth: 12,
      loanYear: 1,
      openingBalanceCents: 20_000_000,
      regularPaymentCents: 1_100_004,
      interestCents: source.firstYearInterestCents,
      scheduledPrincipalCents: source.firstYearScheduledPrincipalCents,
      additionalPrincipalCents: 0,
      totalPaymentCents: 1_100_004,
      closingBalanceCents: source.rows[11]!.closingBalanceCents,
    })
  })

  it('reconciles full annual cash flows to the domain lifetime controls in both schedules', () => {
    for (const source of [schedule(), schedule({ additionalRepayments: plan })]) {
      const periods = createAmortizationPeriods(source, 'full', 'annual')
      expect(sumMoney(periods.map((row) => row.interestCents))).toBe(
        source.projectedLifetimeInterestCents,
      )
      expect(sumMoney(periods.map((row) => row.scheduledPrincipalCents))).toBe(
        source.projectedLifetimeScheduledPrincipalCents,
      )
      expect(sumMoney(periods.map((row) => row.additionalPrincipalCents))).toBe(
        source.projectedLifetimeAdditionalPrincipalCents,
      )
      expect(sumMoney(periods.map((row) => row.totalPaymentCents))).toBe(
        source.principalCents + source.projectedLifetimeInterestCents,
      )
      for (const [index, row] of periods.entries()) {
        expect(
          row.openingBalanceCents - row.scheduledPrincipalCents - row.additionalPrincipalCents,
        ).toBe(row.closingBalanceCents)
        expect(row.regularPaymentCents + row.additionalPrincipalCents).toBe(row.totalPaymentCents)
        if (index > 0) expect(row.openingBalanceCents).toBe(periods[index - 1]!.closingBalanceCents)
      }
    }
  })

  it('ends the 203-month selected schedule with the actual eleven-month partial loan year', () => {
    const source = schedule({ additionalRepayments: plan })
    const periods = createAmortizationPeriods(source, 'full', 'annual')
    expect(periods).toHaveLength(17)
    expect(periods.at(-1)).toMatchObject({
      loanYear: 17,
      firstMonth: 193,
      lastMonth: 203,
      closingBalanceCents: 0,
    })
    expect(periods.at(-1)?.regularPaymentCents).toBeLessThan(
      11 * source.contractualMonthlyPaymentCents,
    )
  })

  it('cuts the fixed-interest view at its exact month before annual aggregation', () => {
    const source: MortgageAmortizationScheduleResult = { ...schedule(), fixedInterestMonths: 14 }
    const fixed = createAmortizationPeriods(source, 'fixed', 'annual')
    const full = createAmortizationPeriods(source, 'full', 'annual')
    expect(fixed).toHaveLength(2)
    expect(fixed[1]).toMatchObject({
      loanYear: 2,
      firstMonth: 13,
      lastMonth: 14,
      regularPaymentCents: 183_334,
      closingBalanceCents: source.rows[13]!.closingBalanceCents,
    })
    expect(full[1]).toMatchObject({ firstMonth: 13, lastMonth: 24, regularPaymentCents: 1_100_004 })
  })

  it('does not manufacture payments when the loan pays off before Zinsbindung', () => {
    const source = schedule({
      additionalRepayments: {
        ...plan,
        oneTimeAdditionalRepayments: [{ amount: '500000', month: '1' }],
      },
    })
    for (const horizon of ['fixed', 'full'] as const) {
      const rows = createAmortizationPeriods(source, horizon, 'annual')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        firstMonth: 1,
        lastMonth: 1,
        openingBalanceCents: 20_000_000,
        additionalPrincipalCents: 19_966_666,
        closingBalanceCents: 0,
      })
    }
  })

  it('preserves every cent of monthly rows including capped payoff payments', () => {
    const source = schedule({ additionalRepayments: plan })
    const rows = createAmortizationPeriods(source, 'full', 'monthly')
    expect(rows).toHaveLength(203)
    for (const [index, row] of rows.entries()) {
      const { firstMonth, lastMonth, loanYear, ...amounts } = row
      expect(firstMonth).toBe(index + 1)
      expect(lastMonth).toBe(firstMonth)
      expect(loanYear).toBe(Math.ceil(firstMonth / 12))
      for (const [key, value] of Object.entries(amounts))
        expect(value).toBe(source.rows[index]![key as keyof typeof amounts])
    }
  })

  it('retains the exact 120/121 cutoff and leaves the source untouched', () => {
    const source = schedule()
    const before = JSON.stringify(source)
    expect(createAmortizationPeriods(source, 'fixed', 'monthly').at(-1)?.lastMonth).toBe(120)
    expect(createAmortizationPeriods(source, 'full', 'monthly')[120]!.firstMonth).toBe(121)
    expect(JSON.stringify(source)).toBe(before)
  })

  it('supports the full 1,200-month zero-interest schedule without rounding its debt stocks', () => {
    const source = schedule({ nominalAnnualRate: '0,00', initialRepaymentRate: '1,00' })
    const rows = createAmortizationPeriods(source, 'full', 'annual')
    expect(rows).toHaveLength(100)
    expect(rows.at(-1)).toMatchObject({
      loanYear: 100,
      firstMonth: 1189,
      lastMonth: 1200,
      closingBalanceCents: 0,
    })
    expect(sumMoney(rows.map((row) => row.interestCents))).toBe(0)
    expect(sumMoney(rows.map((row) => row.totalPaymentCents))).toBe(source.principalCents)
  })

  it('fails explicitly if an aggregation exceeds the safe-money range', () => {
    const source = schedule()
    const row = { ...source.rows[0]!, regularPaymentCents: moneyCents(Number.MAX_SAFE_INTEGER) }
    const invalid = { ...source, rows: [row, { ...row, month: 2 }] }
    expect(() => createAmortizationPeriods(invalid, 'full', 'annual')).toThrow(/safe integer range/)
  })
})
