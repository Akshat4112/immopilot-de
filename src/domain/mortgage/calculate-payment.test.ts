import { describe, expect, it } from 'vitest'

import {
  calculateAcquisitionCosts,
  type AvailableAcquisitionCostResult,
} from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import type { DecimalValue } from '../shared'

import { calculateMortgagePayment } from './calculate-payment'
import type {
  AvailableMortgagePaymentResult,
  MortgagePaymentInput,
  MortgagePaymentResult,
} from './types'

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

function financing(purchasePriceCents = 25_000_000, downPaymentCents = 5_000_000) {
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

function availableResult(input: MortgagePaymentInput): AvailableMortgagePaymentResult {
  const result = calculateMortgagePayment(input)

  if (result.status !== 'available') {
    throw new Error('Expected available mortgage payment')
  }

  return result
}

function expectValidationResult(result: MortgagePaymentResult, code: string, field: string): void {
  expect(result).toMatchObject({
    status: 'unavailable',
    reason: 'VALIDATION_ERROR',
    error: { code, field },
  })
}

describe('mortgage payment calculation', () => {
  it('calculates the German initial-repayment-rate annuity from PD-007', () => {
    const result = availableResult({
      paymentMode: 'initial-repayment-rate',
      financing: financing(),
      nominalAnnualRate: 0.035,
      initialRepaymentRate: 0.02,
    })

    expect(result).toMatchObject({
      cashPurchase: false,
      paymentMode: 'initial-repayment-rate',
      principalCents: 20_000_000,
      monthlyPaymentCents: 91_667,
      contractualMonthlyPaymentCents: 91_667,
      firstMonthInterestCents: 58_333,
      firstMonthScheduledPrincipalCents: 33_334,
      repaymentTermMonths: null,
    })

    if (result.cashPurchase || result.paymentMode !== 'initial-repayment-rate') {
      throw new Error('Expected initial-repayment-rate result')
    }

    expect(result.nominalAnnualRate.toString()).toBe('0.035')
    expect(result.monthlyNominalRate.toString()).toBe(
      '0.002916666666666666666666666666666666666667',
    )
    expect(result.initialRepaymentRate.toString()).toBe('0.02')
  })

  it('calculates a zero-interest fully amortizing payment', () => {
    const result = availableResult({
      paymentMode: 'full-repayment-term',
      financing: financing(1_200, 0),
      nominalAnnualRate: 0,
      repaymentTermMonths: 12,
    })

    expect(result).toMatchObject({
      cashPurchase: false,
      paymentMode: 'full-repayment-term',
      principalCents: 1_200,
      monthlyPaymentCents: 100,
      fullyAmortizingMonthlyPaymentCents: 100,
      firstMonthInterestCents: 0,
      firstMonthScheduledPrincipalCents: 100,
      repaymentTermMonths: 12,
    })
  })

  it('keeps the positive-interest full-term mode explicit', () => {
    const result = availableResult({
      paymentMode: 'full-repayment-term',
      financing: financing(),
      nominalAnnualRate: 0.035,
      repaymentTermMonths: 360,
    })

    expect(result.cashPurchase).toBe(false)
    expect(result.paymentMode).toBe('full-repayment-term')
    expect(result.monthlyPaymentCents).toBeGreaterThan(result.firstMonthInterestCents)
    expect(result.firstMonthInterestCents + result.firstMonthScheduledPrincipalCents).toBe(
      result.monthlyPaymentCents,
    )
  })

  it('returns cash-purchase behavior without requiring rates', () => {
    const acquisitionResult = acquisition(25_000_000)
    const cashFinancing = calculateFinancing({
      mode: 'available-equity',
      acquisition: acquisitionResult,
      availableEquityCents: acquisitionResult.totalProjectCostCents,
      financedAcquisitionCostShare: 0,
    })

    if (cashFinancing.status !== 'available') {
      throw new Error('Expected available cash financing')
    }

    const result = availableResult({
      paymentMode: 'initial-repayment-rate',
      financing: cashFinancing,
    })

    expect(result).toMatchObject({
      cashPurchase: true,
      principalCents: 0,
      nominalAnnualRate: null,
      monthlyNominalRate: null,
      monthlyPaymentCents: 0,
      firstMonthInterestCents: 0,
      firstMonthScheduledPrincipalCents: 0,
    })
  })

  it('returns a typed negative-amortization result at a rounding boundary', () => {
    const result = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: financing(1, 0),
      nominalAnnualRate: 0.5,
      initialRepaymentRate: 0.000_001,
    })

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'NEGATIVE_AMORTIZATION',
      principalCents: 1,
      monthlyPaymentCents: 0,
      firstMonthInterestCents: 0,
    })
  })

  it('propagates unavailable financing', () => {
    const unavailableAcquisition = calculateAcquisitionCosts({
      purchasePriceCents: 25_000_000,
      stateId: 'DE-BW',
    })
    const unavailableFinancing = calculateFinancing({
      mode: 'available-equity',
      acquisition: unavailableAcquisition,
      availableEquityCents: 10_000_000,
      financedAcquisitionCostShare: 0,
    })
    const result = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: unavailableFinancing,
      nominalAnnualRate: 0.035,
      initialRepaymentRate: 0.02,
    })

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'FINANCING_UNAVAILABLE',
      financing: {
        reason: 'ACQUISITION_COSTS_UNAVAILABLE',
      },
    })
  })

  it('returns stable validation failures for missing and invalid mode inputs', () => {
    const financingResult = financing()

    expectValidationResult(
      calculateMortgagePayment({
        paymentMode: 'initial-repayment-rate',
        financing: financingResult,
        initialRepaymentRate: 0.02,
      }),
      'REQUIRED',
      'nominalAnnualRate',
    )
    expectValidationResult(
      calculateMortgagePayment({
        paymentMode: 'initial-repayment-rate',
        financing: financingResult,
        nominalAnnualRate: 0.035,
      }),
      'REQUIRED',
      'initialRepaymentRate',
    )
    expectValidationResult(
      calculateMortgagePayment({
        paymentMode: 'full-repayment-term',
        financing: financingResult,
        nominalAnnualRate: 0.035,
        repaymentTermMonths: 0,
      }),
      'OUT_OF_RANGE',
      'repaymentTermMonths',
    )
    expectValidationResult(
      calculateMortgagePayment({
        paymentMode: 'initial-repayment-rate',
        financing: financingResult,
        nominalAnnualRate: 1,
        initialRepaymentRate: 0.02,
      }),
      'OUT_OF_RANGE',
      'nominalAnnualRate',
    )
    expectValidationResult(
      calculateMortgagePayment({
        paymentMode: 'invalid',
        financing: financingResult,
        nominalAnnualRate: 0.035,
      } as unknown as MortgagePaymentInput),
      'OUT_OF_RANGE',
      'paymentMode',
    )
  })

  it('rejects explicit null rates instead of treating them as missing defaults', () => {
    expectValidationResult(
      calculateMortgagePayment({
        paymentMode: 'initial-repayment-rate',
        financing: financing(),
        nominalAnnualRate: null as unknown as DecimalValue,
        initialRepaymentRate: 0.02,
      }),
      'INVALID_DECIMAL',
      'nominalAnnualRate',
    )
  })
})
