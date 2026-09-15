import { describe, expect, it } from 'vitest'

import { calculateAcquisitionCosts } from '../acquisition-costs'
import { calculateFinancing } from '../financing'

import { calculateAdditionalRepaymentComparison } from './calculate-additional-repayments'
import { calculateAmortizationSchedule } from './calculate-amortization'
import { calculateFixedPeriod, calculateFixedPeriodComparison } from './calculate-fixed-period'
import { calculateMortgagePayment } from './calculate-payment'

function payment(principalCents = 20_000_000, repaymentRate = 0.02, cashPurchase = false) {
  const acquisition = calculateAcquisitionCosts({
    purchasePriceCents: principalCents,
    stateId: 'DE-BW',
    renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
  })
  const financing = calculateFinancing({
    mode: 'selected-down-payment',
    acquisition,
    downPaymentCents: cashPurchase ? principalCents : 0,
    availableEquityCents: principalCents * 2,
    financedAcquisitionCostShare: 0,
  })
  return calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing,
    nominalAnnualRate: principalCents === 20_000_000 ? 0.035 : 0,
    initialRepaymentRate: repaymentRate,
  })
}

describe('fixed-interest-period result', () => {
  it('summarizes the PD-007 baseline at the end of month 120', () => {
    const schedule = calculateAmortizationSchedule({
      payment: payment(),
      fixedInterestMonths: 120,
    })
    const result = calculateFixedPeriod(schedule)

    expect(result).toMatchObject({
      status: 'available',
      cashPurchase: false,
      fixedInterestMonths: 120,
      remainingDebtCents: 15_218_873,
      interestPaidCents: 6_218_913,
      scheduledPrincipalPaidCents: 4_781_127,
      additionalPrincipalPaidCents: 0,
      refinancing: { status: 'applicable', remainingDebtCents: 15_218_873 },
      projectedPayoffMonth: 348,
      projectionAssumption: 'constant-initial-rate',
    })
  })

  it('includes month K Sondertilgung and excludes a payment in K + 1', () => {
    const loanPayment = payment(1_200, 0.5)
    const atBoundary = calculateAmortizationSchedule({
      payment: loanPayment,
      fixedInterestMonths: 12,
      additionalRepayments: {
        oneTimeAdditionalRepayments: [{ month: 12, amountCents: 600 }],
      },
    })
    const afterBoundary = calculateAmortizationSchedule({
      payment: loanPayment,
      fixedInterestMonths: 12,
      additionalRepayments: {
        oneTimeAdditionalRepayments: [{ month: 13, amountCents: 600 }],
      },
    })

    expect(calculateFixedPeriod(atBoundary)).toMatchObject({
      status: 'available',
      remainingDebtCents: 0,
      additionalPrincipalPaidCents: 600,
      refinancing: { status: 'not-applicable', reason: 'PAID_OFF' },
      projectedPayoffMonth: 12,
    })
    expect(calculateFixedPeriod(afterBoundary)).toMatchObject({
      status: 'available',
      remainingDebtCents: 600,
      additionalPrincipalPaidCents: 0,
      refinancing: { status: 'applicable', remainingDebtCents: 600 },
    })
  })

  it('returns zero debt and no refinancing if paid before the period ends', () => {
    const schedule = calculateAmortizationSchedule({
      payment: payment(1_200, 0.5),
      fixedInterestMonths: 12,
      additionalRepayments: {
        oneTimeAdditionalRepayments: [{ month: 6, amountCents: 900 }],
      },
    })

    expect(calculateFixedPeriod(schedule)).toMatchObject({
      status: 'available',
      remainingDebtCents: 0,
      scheduledPrincipalPaidCents: 300,
      additionalPrincipalPaidCents: 900,
      projectedPayoffMonth: 6,
      refinancing: { status: 'not-applicable', reason: 'PAID_OFF' },
    })
  })

  it('marks a cash purchase as not applicable without inventing a fixed period', () => {
    const schedule = calculateAmortizationSchedule({ payment: payment(1_200, 0.5, true) })

    expect(calculateFixedPeriod(schedule)).toMatchObject({
      status: 'available',
      cashPurchase: true,
      fixedInterestMonths: null,
      remainingDebtCents: 0,
      interestPaidCents: 0,
      scheduledPrincipalPaidCents: 0,
      additionalPrincipalPaidCents: 0,
      projectedPayoffMonth: 0,
      refinancing: { status: 'not-applicable', reason: 'CASH_PURCHASE' },
    })
  })

  it('propagates an unavailable schedule without fabricating a debt balance', () => {
    const schedule = calculateAmortizationSchedule({
      payment: payment(),
      fixedInterestMonths: 0,
    })

    expect(calculateFixedPeriod(schedule)).toMatchObject({
      status: 'unavailable',
      reason: 'AMORTIZATION_SCHEDULE_UNAVAILABLE',
      schedule: {
        status: 'unavailable',
        reason: 'VALIDATION_ERROR',
        error: { field: 'fixedInterestMonths' },
      },
    })
  })
})

describe('fixed-interest-period comparison', () => {
  it('reports the PD-007 debt reduction at the same 120-month endpoint', () => {
    const comparison = calculateAdditionalRepaymentComparison({
      payment: payment(),
      fixedInterestMonths: 120,
      additionalRepayments: { annualAdditionalRepaymentCents: 500_000 },
    })

    expect(calculateFixedPeriodComparison(comparison)).toMatchObject({
      status: 'available',
      fixedInterestMonths: 120,
      baseline: { remainingDebtCents: 15_218_873 },
      withAdditionalRepayments: {
        remainingDebtCents: 9_337_777,
        additionalPrincipalPaidCents: 5_000_000,
      },
      remainingDebtReductionCents: 5_881_096,
    })
  })

  it('propagates an unavailable comparison', () => {
    const comparison = calculateAdditionalRepaymentComparison({
      payment: payment(),
      fixedInterestMonths: 0,
      additionalRepayments: { annualAdditionalRepaymentCents: 500_000 },
    })

    expect(calculateFixedPeriodComparison(comparison)).toMatchObject({
      status: 'unavailable',
      reason: 'ADDITIONAL_REPAYMENT_COMPARISON_UNAVAILABLE',
      comparison: { reason: 'BASELINE_SCHEDULE_UNAVAILABLE' },
    })
  })

  it('refuses to compare distinct fixed-period endpoints', () => {
    const comparison = calculateAdditionalRepaymentComparison({
      payment: payment(),
      fixedInterestMonths: 12,
      additionalRepayments: { annualAdditionalRepaymentCents: 500_000 },
    })

    if (comparison.status !== 'available') {
      throw new Error('Expected available comparison')
    }

    const otherSchedule = calculateAmortizationSchedule({
      payment: payment(),
      fixedInterestMonths: 24,
      additionalRepayments: { annualAdditionalRepaymentCents: 500_000 },
    })

    if (otherSchedule.status !== 'available') {
      throw new Error('Expected available additional repayment schedule')
    }

    expect(
      calculateFixedPeriodComparison({ ...comparison, withAdditionalRepayments: otherSchedule }),
    ).toEqual({
      status: 'unavailable',
      reason: 'FIXED_PERIOD_MISMATCH',
      baselineFixedInterestMonths: 12,
      additionalFixedInterestMonths: 24,
    })
  })
})
