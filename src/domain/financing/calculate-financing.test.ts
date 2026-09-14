import { describe, expect, it } from 'vitest'

import {
  calculateAcquisitionCosts,
  type AcquisitionCostResult,
  type AvailableAcquisitionCostResult,
} from '../acquisition-costs'
import type { DecimalValue } from '../shared'

import { calculateFinancing } from './calculate-financing'
import type { AvailableFinancingResult, FinancingInput, FinancingResult } from './types'

function acquisitionWithConfirmedZero(
  purchasePriceCents = 25_000_000,
): AvailableAcquisitionCostResult {
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

function availableResult(input: FinancingInput): AvailableFinancingResult {
  const result = calculateFinancing(input)

  if (result.status !== 'available') {
    throw new Error('Expected available financing result')
  }

  return result
}

function expectValidationResult(result: FinancingResult, code: string, field: string): void {
  expect(result).toMatchObject({
    status: 'unavailable',
    reason: 'VALIDATION_ERROR',
    error: { code, field },
  })
}

describe('financing and required-equity calculation', () => {
  it('implements selected-down-payment mode from PD-007', () => {
    const acquisition = calculateAcquisitionCosts({
      purchasePriceCents: 25_000_000,
      stateId: 'DE-BW',
      renovationBudget: {
        amountCents: 2_000_000,
        budgetStatus: 'budgeted',
      },
      movingSetupCosts: {
        amountCents: 300_000,
        budgetStatus: 'budgeted',
      },
    })

    if (acquisition.status !== 'available') {
      throw new Error('Expected available acquisition costs')
    }

    const result = availableResult({
      mode: 'selected-down-payment',
      acquisition,
      downPaymentCents: 5_000_000,
      availableEquityCents: 10_000_000,
      financedAcquisitionCostShare: 0,
    })

    expect(result).toMatchObject({
      fundingStatus: 'funded',
      financingClassification: 'below-100-percent',
      financedAcquisitionCostsCents: 0,
      cashFundedTransactionCostsCents: 1_625_000,
      downPaymentCents: 5_000_000,
      requiredEquityCents: 8_925_000,
      loanAmountCents: 20_000_000,
      cashGapCents: 0,
      cashRemainingCents: 1_075_000,
      sourceOfFundsBalanced: true,
    })
    expect(result.purchasePriceFinancingRatio.toString()).toBe('0.8')
  })

  it('rounds the financed acquisition-cost share before funding allocation', () => {
    const result = availableResult({
      mode: 'selected-down-payment',
      acquisition: acquisitionWithConfirmedZero(10_000),
      downPaymentCents: 0,
      availableEquityCents: 1_000,
      financedAcquisitionCostShare: '0.005',
    })

    expect(result.transactionAcquisitionCostsCents).toBe(650)
    expect(result.financedAcquisitionCostsCents).toBe(3)
    expect(result.cashFundedTransactionCostsCents).toBe(647)
  })

  it('implements funded available-equity quick mode', () => {
    const result = availableResult({
      mode: 'available-equity',
      acquisition: acquisitionWithConfirmedZero(),
      availableEquityCents: 6_625_000,
      financedAcquisitionCostShare: 0,
    })

    expect(result).toMatchObject({
      fundingStatus: 'funded',
      financingClassification: 'below-100-percent',
      downPaymentCents: 5_000_000,
      requiredEquityCents: 6_625_000,
      loanAmountCents: 20_000_000,
      cashGapCents: 0,
      cashRemainingCents: 0,
    })
  })

  it('labels a quick-mode cash-cost gap as underfunded', () => {
    const result = availableResult({
      mode: 'available-equity',
      acquisition: acquisitionWithConfirmedZero(),
      availableEquityCents: 1_000_000,
      financedAcquisitionCostShare: 0,
    })

    expect(result).toMatchObject({
      fundingStatus: 'underfunded',
      financingClassification: '100-percent',
      downPaymentCents: 0,
      requiredEquityCents: 1_625_000,
      loanAmountCents: 25_000_000,
      cashGapCents: 625_000,
      cashRemainingCents: 0,
    })
  })

  it('caps quick-mode down payment at the purchase price and retains excess cash', () => {
    const result = availableResult({
      mode: 'available-equity',
      acquisition: acquisitionWithConfirmedZero(),
      availableEquityCents: 30_000_000,
      financedAcquisitionCostShare: 0,
    })

    expect(result).toMatchObject({
      downPaymentCents: 25_000_000,
      requiredEquityCents: 26_625_000,
      loanAmountCents: 0,
      cashRemainingCents: 3_375_000,
      financingClassification: 'below-100-percent',
    })
  })

  it('classifies 100% and above-100% purchase-price financing', () => {
    const acquisition = acquisitionWithConfirmedZero()
    const oneHundred = availableResult({
      mode: 'selected-down-payment',
      acquisition,
      downPaymentCents: 0,
      availableEquityCents: 1_625_000,
      financedAcquisitionCostShare: 0,
    })
    const aboveOneHundred = availableResult({
      mode: 'selected-down-payment',
      acquisition,
      downPaymentCents: 0,
      availableEquityCents: 0,
      financedAcquisitionCostShare: 1,
    })

    expect(oneHundred.financingClassification).toBe('100-percent')
    expect(oneHundred.purchasePriceFinancingRatio.toString()).toBe('1')
    expect(aboveOneHundred.financingClassification).toBe('above-100-percent')
    expect(aboveOneHundred.loanAmountCents).toBe(26_625_000)
    expect(aboveOneHundred.purchasePriceFinancingRatio.toString()).toBe('1.065')
  })

  it('propagates an unavailable acquisition result', () => {
    const acquisition: AcquisitionCostResult = calculateAcquisitionCosts({
      purchasePriceCents: 25_000_000,
      stateId: 'DE-BW',
    })
    const result = calculateFinancing({
      mode: 'available-equity',
      acquisition,
      availableEquityCents: 10_000_000,
      financedAcquisitionCostShare: 0,
    })

    expect(result).toMatchObject({
      status: 'unavailable',
      reason: 'ACQUISITION_COSTS_UNAVAILABLE',
      acquisition: {
        reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED',
      },
    })
  })

  it('returns stable validation failures for malformed financing inputs', () => {
    const acquisition = acquisitionWithConfirmedZero()

    expectValidationResult(
      calculateFinancing({
        mode: 'selected-down-payment',
        acquisition,
        downPaymentCents: 25_000_001,
        availableEquityCents: 30_000_000,
        financedAcquisitionCostShare: 0,
      }),
      'OUT_OF_RANGE',
      'downPaymentCents',
    )
    expectValidationResult(
      calculateFinancing({
        mode: 'available-equity',
        acquisition,
        availableEquityCents: -1,
        financedAcquisitionCostShare: 0,
      }),
      'OUT_OF_RANGE',
      'availableEquityCents',
    )
    expectValidationResult(
      calculateFinancing({
        mode: 'available-equity',
        acquisition,
        availableEquityCents: 0,
        financedAcquisitionCostShare: 1.01,
      }),
      'OUT_OF_RANGE',
      'financedAcquisitionCostShare',
    )
    expectValidationResult(
      calculateFinancing({
        mode: 'invalid' as FinancingInput['mode'],
        acquisition,
        availableEquityCents: 0,
        financedAcquisitionCostShare: 0,
      } as FinancingInput),
      'OUT_OF_RANGE',
      'mode',
    )
    expectValidationResult(
      calculateFinancing({
        mode: 'available-equity',
        acquisition,
        availableEquityCents: 0,
        financedAcquisitionCostShare: null as unknown as DecimalValue,
      }),
      'INVALID_DECIMAL',
      'financedAcquisitionCostShare',
    )
  })

  it('preserves the source-of-funds identity in every available result', () => {
    const result = availableResult({
      mode: 'selected-down-payment',
      acquisition: acquisitionWithConfirmedZero(),
      downPaymentCents: 2_500_000,
      availableEquityCents: 5_000_000,
      financedAcquisitionCostShare: 0.25,
    })

    expect(result.loanAmountCents + result.requiredEquityCents).toBe(result.totalProjectCostCents)
  })
})
