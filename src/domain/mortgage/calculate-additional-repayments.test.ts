import { describe, expect, it } from 'vitest'

import {
  calculateAcquisitionCosts,
  type AvailableAcquisitionCostResult,
} from '../acquisition-costs'
import { calculateFinancing } from '../financing'

import { calculateAdditionalRepaymentComparison } from './calculate-additional-repayments'
import { calculateAmortizationSchedule } from './calculate-amortization'
import { calculateMortgagePayment } from './calculate-payment'
import type { AdditionalRepaymentPlan } from './additional-repayment-types'
import type { AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult } from './types'

type NonCashPayment = Exclude<AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult>

function acquisition(purchasePriceCents: number): AvailableAcquisitionCostResult {
  const result = calculateAcquisitionCosts({
    purchasePriceCents,
    stateId: 'DE-BW',
    renovationBudget: {
      amountCents: 0,
      budgetStatus: 'confirmed-zero',
    },
    movingSetupCosts: {
      amountCents: 0,
      budgetStatus: 'confirmed-zero',
    },
  })

  if (result.status !== 'available') {
    throw new Error('Expected available acquisition costs')
  }

  return result
}

function financing(purchasePriceCents = 20_000_000, downPaymentCents = 0) {
  const acquisitionResult = acquisition(purchasePriceCents)
  const result = calculateFinancing({
    mode: 'selected-down-payment',
    acquisition: acquisitionResult,
    downPaymentCents,
    availableEquityCents: downPaymentCents + acquisitionResult.transactionAcquisitionCostsCents,
    financedAcquisitionCostShare: 0,
  })

  if (result.status !== 'available') {
    throw new Error('Expected available financing')
  }

  return result
}

function initialPayment(
  principalCents = 20_000_000,
  nominalAnnualRate = 0.035,
  initialRepaymentRate = 0.02,
): NonCashPayment {
  const result = calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing: financing(principalCents),
    nominalAnnualRate,
    initialRepaymentRate,
  })

  if (result.status !== 'available' || result.cashPurchase) {
    throw new Error('Expected available financed mortgage payment')
  }

  return result
}

describe('Sondertilgung schedules and comparisons', () => {
  it('combines recurring and one-time repayments after the regular payment', () => {
    const result = calculateAmortizationSchedule({
      payment: initialPayment(),
      fixedInterestMonths: 120,
      additionalRepayments: {
        annualAdditionalRepaymentCents: 500_000,
        annualAdditionalRepaymentMonth: 12,
        oneTimeAdditionalRepayments: [{ month: 12, amountCents: 100_000 }],
      },
    })

    if (result.status !== 'available' || result.cashPurchase) {
      throw new Error('Expected available Sondertilgung schedule')
    }

    const month12 = result.rows[11]

    expect(month12?.additionalPrincipalCents).toBe(600_000)
    expect(month12?.regularPaymentCents).toBe(
      (month12?.interestCents ?? 0) + (month12?.scheduledPrincipalCents ?? 0),
    )
    expect(month12?.closingBalanceCents).toBe(
      (month12?.openingBalanceCents ?? 0) - (month12?.scheduledPrincipalCents ?? 0) - 600_000,
    )
    expect(result.firstYearAdditionalPrincipalCents).toBe(600_000)
  })

  it('caps additional principal at the post-regular-payment balance', () => {
    const result = calculateAmortizationSchedule({
      payment: initialPayment(1_000, 0, 1),
      fixedInterestMonths: 12,
      additionalRepayments: {
        oneTimeAdditionalRepayments: [
          { month: 1, amountCents: 5_000 },
          { month: 10, amountCents: 1_000 },
        ],
      },
    })

    if (result.status !== 'available' || result.cashPurchase) {
      throw new Error('Expected available capped-repayment schedule')
    }

    expect(result.payoffMonth).toBe(1)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      contractualPaymentCents: 83,
      regularPaymentCents: 83,
      scheduledPrincipalCents: 83,
      additionalPrincipalCents: 917,
      totalPaymentCents: 1_000,
      closingBalanceCents: 0,
    })
    expect(result.projectedLifetimeAdditionalPrincipalCents).toBe(917)
  })

  it('keeps the contractual payment unchanged and advances payoff', () => {
    const result = calculateAdditionalRepaymentComparison({
      payment: initialPayment(),
      fixedInterestMonths: 120,
      additionalRepayments: {
        annualAdditionalRepaymentCents: 500_000,
        annualAdditionalRepaymentMonth: 12,
      },
    })

    if (result.status !== 'available') {
      throw new Error('Expected available Sondertilgung comparison')
    }

    expect(
      result.withAdditionalRepayments.rows.every((row) => row.contractualPaymentCents === 91_667),
    ).toBe(true)
    expect(result.withAdditionalRepayments.payoffMonth).toBeLessThan(result.baseline.payoffMonth)
    expect(result.interestSavedThroughFixedPeriodCents).toBeGreaterThan(0)
    expect(result.remainingDebtReductionAtFixedPeriodCents).toBeGreaterThan(0)
    expect(result.projectedLifetimeInterestSavedCents).toBeGreaterThan(0)
    expect(result.timeSavedMonths).toBeGreaterThan(0)
  })

  it('returns a zero comparison for a cash purchase', () => {
    const acquisitionResult = acquisition(20_000_000)
    const cashFinancing = calculateFinancing({
      mode: 'available-equity',
      acquisition: acquisitionResult,
      availableEquityCents: acquisitionResult.totalProjectCostCents,
      financedAcquisitionCostShare: 0,
    })

    if (cashFinancing.status !== 'available') {
      throw new Error('Expected available cash financing')
    }

    const cashPayment = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: cashFinancing,
    })
    const result = calculateAdditionalRepaymentComparison({
      payment: cashPayment,
      additionalRepayments: {
        annualAdditionalRepaymentCents: 500_000,
      },
    })

    expect(result).toMatchObject({
      status: 'available',
      cashPurchase: true,
      interestSavedThroughFixedPeriodCents: 0,
      remainingDebtReductionAtFixedPeriodCents: 0,
      projectedLifetimeInterestSavedCents: 0,
      timeSavedMonths: 0,
      baseline: {
        rows: [],
        payoffMonth: 0,
      },
      withAdditionalRepayments: {
        rows: [],
        payoffMonth: 0,
      },
    })
  })

  it('ignores even malformed retained repayment values for a cash purchase', () => {
    const acquisitionResult = acquisition(20_000_000)
    const cashFinancing = calculateFinancing({
      mode: 'available-equity',
      acquisition: acquisitionResult,
      availableEquityCents: acquisitionResult.totalProjectCostCents,
      financedAcquisitionCostShare: 0,
    })
    const cashPayment = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: cashFinancing,
    })

    expect(
      calculateAdditionalRepaymentComparison({
        payment: cashPayment,
        additionalRepayments: {
          annualAdditionalRepaymentCents: -1,
          annualAdditionalRepaymentMonth: 13,
          oneTimeAdditionalRepayments: [{ month: 1_201, amountCents: -1 }],
        },
      }),
    ).toMatchObject({
      status: 'available',
      cashPurchase: true,
      baseline: { rows: [], payoffMonth: 0 },
      withAdditionalRepayments: { rows: [], payoffMonth: 0 },
    })
  })

  it('rejects invalid recurring and one-time repayment inputs', () => {
    const validPayment = initialPayment()

    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
        fixedInterestMonths: 120,
        additionalRepayments: {
          annualAdditionalRepaymentCents: -1,
        },
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'OUT_OF_RANGE',
        field: 'annualAdditionalRepaymentCents',
      },
    })
    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
        fixedInterestMonths: 120,
        additionalRepayments: {
          annualAdditionalRepaymentMonth: 13,
        },
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'OUT_OF_RANGE',
        field: 'annualAdditionalRepaymentMonth',
      },
    })
    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
        fixedInterestMonths: 120,
        additionalRepayments: {
          oneTimeAdditionalRepayments: [
            { month: 24, amountCents: 100_000 },
            { month: 24, amountCents: 200_000 },
          ],
        },
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'OUT_OF_RANGE',
        field: 'oneTimeAdditionalRepayments[1].month',
      },
    })
    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
        fixedInterestMonths: 120,
        additionalRepayments: {
          oneTimeAdditionalRepayments: [{ month: 0, amountCents: -1 }],
        },
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        field: 'oneTimeAdditionalRepayments[0].month',
      },
    })
    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
        fixedInterestMonths: 120,
        additionalRepayments: {
          oneTimeAdditionalRepayments: [{ month: 1_201, amountCents: 100_000 }],
        },
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'OUT_OF_RANGE',
        field: 'oneTimeAdditionalRepayments[0].month',
      },
    })
  })

  it.each([null, 42])('rejects malformed repayment plan %p', (additionalRepayments) => {
    expect(
      calculateAmortizationSchedule({
        payment: initialPayment(),
        fixedInterestMonths: 120,
        additionalRepayments: additionalRepayments as unknown as AdditionalRepaymentPlan,
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'INVALID_TYPE',
        field: 'additionalRepayments',
      },
    })
  })

  it('wraps unavailable baseline and additional schedules explicitly', () => {
    const invalidPayment = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: financing(),
      nominalAnnualRate: 0.035,
    })
    const baselineFailure = calculateAdditionalRepaymentComparison({
      payment: invalidPayment,
      fixedInterestMonths: 120,
      additionalRepayments: {},
    })
    const additionalFailure = calculateAdditionalRepaymentComparison({
      payment: initialPayment(),
      fixedInterestMonths: 120,
      additionalRepayments: {
        oneTimeAdditionalRepayments: [{ month: 12, amountCents: -1 }],
      },
    })

    expect(baselineFailure).toMatchObject({
      status: 'unavailable',
      reason: 'BASELINE_SCHEDULE_UNAVAILABLE',
      schedule: {
        reason: 'MORTGAGE_PAYMENT_UNAVAILABLE',
      },
    })
    expect(additionalFailure).toMatchObject({
      status: 'unavailable',
      reason: 'ADDITIONAL_REPAYMENT_SCHEDULE_UNAVAILABLE',
      schedule: {
        reason: 'VALIDATION_ERROR',
      },
    })
  })
})
