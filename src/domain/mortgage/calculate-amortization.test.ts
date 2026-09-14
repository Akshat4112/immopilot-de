import { describe, expect, it } from 'vitest'

import {
  calculateAcquisitionCosts,
  type AvailableAcquisitionCostResult,
} from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { moneyCents } from '../shared'

import type { MortgageAmortizationScheduleResult } from './amortization-types'
import { calculateAmortizationSchedule } from './calculate-amortization'
import { calculateMortgagePayment } from './calculate-payment'
import type {
  AvailableMortgagePaymentResult,
  CashPurchaseMortgagePaymentResult,
  MortgagePaymentInput,
} from './types'

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

function payment(input: Omit<MortgagePaymentInput, 'financing'>): NonCashPayment {
  const result = calculateMortgagePayment({
    ...input,
    financing: financing(),
  })

  if (result.status !== 'available' || result.cashPurchase) {
    throw new Error('Expected available financed mortgage payment')
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

function availableSchedule(
  schedulePayment: AvailableMortgagePaymentResult,
  fixedInterestMonths = 120,
  selectedMonth?: number,
): MortgageAmortizationScheduleResult {
  const result = calculateAmortizationSchedule({
    payment: schedulePayment,
    fixedInterestMonths,
    selectedMonth,
  })

  if (result.status !== 'available' || result.cashPurchase) {
    throw new Error('Expected available mortgage amortization schedule')
  }

  return result
}

describe('mortgage amortization schedule', () => {
  it('reproduces the PD-007 baseline and exact monthly identities', () => {
    const result = availableSchedule(initialPayment(), 120, 120)
    const first = result.rows[0]

    expect(first).toMatchObject({
      month: 1,
      openingBalanceCents: 20_000_000,
      contractualPaymentCents: 91_667,
      interestCents: 58_333,
      scheduledPrincipalCents: 33_334,
      additionalPrincipalCents: 0,
      regularPaymentCents: 91_667,
      totalPaymentCents: 91_667,
      closingBalanceCents: 19_966_666,
    })
    expect(result).toMatchObject({
      payoffMonth: 348,
      firstYearInterestCents: 693_521,
      firstYearScheduledPrincipalCents: 406_483,
      interestThroughFixedPeriodCents: 6_218_913,
      scheduledPrincipalThroughFixedPeriodCents: 4_781_127,
      additionalPrincipalThroughFixedPeriodCents: 0,
      remainingDebtAtFixedPeriodCents: 15_218_873,
      selectedMonth: 120,
      remainingDebtAtSelectedMonthCents: 15_218_873,
      projectedLifetimeInterestCents: 11_839_480,
      projectedLifetimeScheduledPrincipalCents: 20_000_000,
    })

    for (const row of result.rows) {
      expect(row.regularPaymentCents).toBe(row.interestCents + row.scheduledPrincipalCents)
      expect(row.closingBalanceCents).toBe(
        row.openingBalanceCents - row.scheduledPrincipalCents - row.additionalPrincipalCents,
      )
      expect(row.totalPaymentCents).toBe(
        row.interestCents + row.scheduledPrincipalCents + row.additionalPrincipalCents,
      )
      expect(row.closingBalanceCents).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns principal at selected month zero and zero after payoff', () => {
    const atStart = availableSchedule(initialPayment(), 120, 0)
    const afterPayoff = availableSchedule(initialPayment(), 400, 400)

    expect(atStart.remainingDebtAtSelectedMonthCents).toBe(20_000_000)
    expect(afterPayoff.remainingDebtAtSelectedMonthCents).toBe(0)
    expect(afterPayoff.remainingDebtAtFixedPeriodCents).toBe(0)
  })

  it('supports a zero-interest fully amortizing term schedule', () => {
    const result = availableSchedule(
      payment({
        paymentMode: 'full-repayment-term',
        nominalAnnualRate: 0,
        repaymentTermMonths: 12,
      }),
      12,
    )

    expect(result.payment.paymentMode).toBe('full-repayment-term')
    expect(result.payoffMonth).toBe(12)
    expect(result.projectedLifetimeInterestCents).toBe(0)
    expect(result.rows.every((row) => row.interestCents === 0)).toBe(true)
  })

  it('reduces the final payment instead of overpaying', () => {
    const result = availableSchedule(initialPayment(1_000, 0, 1), 12)
    const finalRow = result.rows.at(-1)

    expect(result.contractualMonthlyPaymentCents).toBe(83)
    expect(result.payoffMonth).toBe(13)
    expect(finalRow).toMatchObject({
      openingBalanceCents: 4,
      contractualPaymentCents: 83,
      interestCents: 0,
      scheduledPrincipalCents: 4,
      regularPaymentCents: 4,
      totalPaymentCents: 4,
      closingBalanceCents: 0,
    })
  })

  it('returns an empty zero-valued schedule for a cash purchase', () => {
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

    if (cashPayment.status !== 'available') {
      throw new Error('Expected available cash payment')
    }

    const result = calculateAmortizationSchedule({
      payment: cashPayment,
      selectedMonth: 120,
    })

    expect(result).toMatchObject({
      status: 'available',
      cashPurchase: true,
      rows: [],
      payoffMonth: 0,
      fixedInterestMonths: null,
      remainingDebtAtSelectedMonthCents: 0,
      remainingDebtAtFixedPeriodCents: 0,
      projectedLifetimeInterestCents: 0,
    })
  })

  it('distinguishes negative amortization from a non-amortizing loan', () => {
    const validPayment = initialPayment(100_000, 0.12, 0.02)
    const negativePayment: NonCashPayment = {
      ...validPayment,
      monthlyPaymentCents: moneyCents(999),
    }
    const stalledPayment: NonCashPayment = {
      ...validPayment,
      monthlyPaymentCents: moneyCents(1_000),
    }

    expect(
      calculateAmortizationSchedule({
        payment: negativePayment,
        fixedInterestMonths: 12,
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'NEGATIVE_AMORTIZATION',
      month: 1,
      interestCents: 1_000,
    })
    expect(
      calculateAmortizationSchedule({
        payment: stalledPayment,
        fixedInterestMonths: 12,
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'NON_AMORTIZING_LOAN',
      month: 1,
      interestCents: 1_000,
    })
  })

  it('returns an explicit result when payoff exceeds 1,200 months', () => {
    const result = calculateAmortizationSchedule({
      payment: initialPayment(100_000, 0, 0.000_12),
      fixedInterestMonths: 120,
    })

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'SCHEDULE_LIMIT_EXCEEDED',
      maximumMonths: 1_200,
      remainingDebtCents: 98_800,
      cumulativeInterestCents: 0,
      cumulativeScheduledPrincipalCents: 1_200,
    })
  })

  it('propagates an unavailable CF-004 payment result', () => {
    const incompleteAcquisition = calculateAcquisitionCosts({
      purchasePriceCents: 20_000_000,
      stateId: 'DE-BW',
    })
    const incompleteFinancing = calculateFinancing({
      mode: 'available-equity',
      acquisition: incompleteAcquisition,
      availableEquityCents: 0,
      financedAcquisitionCostShare: 0,
    })
    const unavailablePayment = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: incompleteFinancing,
      nominalAnnualRate: 0.035,
      initialRepaymentRate: 0.02,
    })

    expect(
      calculateAmortizationSchedule({
        payment: unavailablePayment,
        fixedInterestMonths: 120,
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'MORTGAGE_PAYMENT_UNAVAILABLE',
      payment: {
        reason: 'FINANCING_UNAVAILABLE',
      },
    })
  })

  it('returns stable validation errors for invalid month inputs', () => {
    const validPayment = initialPayment()

    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'REQUIRED',
        field: 'fixedInterestMonths',
      },
    })
    expect(
      calculateAmortizationSchedule({
        payment: validPayment,
        fixedInterestMonths: 120,
        selectedMonth: 1.5,
      }),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: {
        code: 'NOT_INTEGER',
        field: 'selectedMonth',
      },
    })
  })
})
