import { describe, expect, it } from 'vitest'

import type { PostPurchaseBudgetInput } from './types'
import { calculateAcquisitionCosts } from './calculate-acquisition-costs'

const confirmedZero = {
  amountCents: 0,
  budgetStatus: 'confirmed-zero',
} as const

describe('German acquisition-cost calculation', () => {
  it('calculates the PD-007 no-broker example and preserves default origins', () => {
    const result = calculateAcquisitionCosts({
      purchasePriceCents: 25_000_000,
      stateId: 'DE-BW',
      brokerInvolved: false,
      renovationBudget: {
        amountCents: 2_000_000,
        budgetStatus: 'budgeted',
      },
      movingSetupCosts: {
        amountCents: 300_000,
        budgetStatus: 'budgeted',
      },
    })

    expect(result).toMatchObject({
      status: 'available',
      transferTaxCents: 1_250_000,
      notaryCostsCents: 250_000,
      landRegisterCostsCents: 125_000,
      buyerBrokerCommissionCents: 0,
      transactionAcquisitionCostsCents: 1_625_000,
      postPurchaseBudgetCents: 2_300_000,
      allAdditionalInitialOutlayCents: 3_925_000,
      totalProjectCostCents: 28_925_000,
    })
    expect(result.appliedAssumptions.transferTaxRate.origin).toBe('state-lookup')
    expect(result.appliedAssumptions.notaryRate.origin).toBe('assumption-default')
    expect(result.appliedAssumptions.renovationBudget.origin).toBe('user-override')
  })

  it('calculates broker costs and applies editable rate overrides', () => {
    const result = calculateAcquisitionCosts({
      purchasePriceCents: 30_000_000,
      stateId: 'DE-NW',
      brokerInvolved: true,
      rateOverrides: {
        notaryRate: '0.01',
        landRegisterRate: '0.005',
        buyerBrokerRate: '0.0357',
      },
      renovationBudget: {
        amountCents: 1_000_000,
        budgetStatus: 'budgeted',
      },
      movingSetupCosts: {
        amountCents: 200_000,
        budgetStatus: 'budgeted',
      },
    })

    expect(result).toMatchObject({
      status: 'available',
      transferTaxCents: 1_950_000,
      notaryCostsCents: 300_000,
      landRegisterCostsCents: 150_000,
      buyerBrokerCommissionCents: 1_071_000,
      transactionAcquisitionCostsCents: 3_471_000,
      postPurchaseBudgetCents: 1_200_000,
      totalProjectCostCents: 34_671_000,
    })
    expect(result.appliedAssumptions.buyerBrokerRate.origin).toBe('user-override')
  })

  it('rounds every proportional component independently using half-up', () => {
    const result = calculateAcquisitionCosts({
      purchasePriceCents: 10_100,
      stateId: 'DE-BY',
      brokerInvolved: true,
      rateOverrides: {
        transferTaxRate: '0.005',
        notaryRate: '0.005',
        landRegisterRate: '0.005',
        buyerBrokerRate: '0.005',
      },
      renovationBudget: confirmedZero,
      movingSetupCosts: confirmedZero,
    })

    expect(result).toMatchObject({
      status: 'available',
      transferTaxCents: 51,
      notaryCostsCents: 51,
      landRegisterCostsCents: 51,
      buyerBrokerCommissionCents: 51,
      transactionAcquisitionCostsCents: 204,
      totalProjectCostCents: 10_304,
    })
  })

  it('distinguishes unconfirmed budgets from valid confirmed-zero amounts', () => {
    const unavailable = calculateAcquisitionCosts({
      purchasePriceCents: 25_000_000,
      stateId: 'DE-BW',
    })

    expect(unavailable).toMatchObject({
      status: 'unavailable',
      reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED',
      unconfirmedBudgetFields: ['renovationBudget', 'movingSetupCosts'],
      postPurchaseBudgetCents: null,
      totalProjectCostCents: null,
    })

    const available = calculateAcquisitionCosts({
      purchasePriceCents: 25_000_000,
      stateId: 'DE-BW',
      renovationBudget: confirmedZero,
      movingSetupCosts: confirmedZero,
    })

    expect(available).toMatchObject({
      status: 'available',
      postPurchaseBudgetCents: 0,
      totalProjectCostCents: 26_625_000,
    })
  })

  it('does not charge broker commission when no broker is involved', () => {
    const result = calculateAcquisitionCosts({
      purchasePriceCents: 100_000,
      stateId: 'DE-BY',
      brokerInvolved: false,
      rateOverrides: {
        buyerBrokerRate: 1,
      },
      renovationBudget: confirmedZero,
      movingSetupCosts: confirmedZero,
    })

    expect(result.buyerBrokerCommissionCents).toBe(0)
  })

  it('rejects malformed core inputs with stable validation errors', () => {
    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 0,
        stateId: 'DE-BW',
      }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_RANGE', field: 'purchasePriceCents' }))

    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 10_000,
        stateId: 'DE-XX',
      }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_RANGE', field: 'stateId' }))

    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 10_000,
        stateId: 'DE-BW',
        brokerInvolved: 'yes' as unknown as boolean,
      }),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_TYPE', field: 'brokerInvolved' }))

    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 10_000,
        stateId: 'DE-BW',
        rateOverrides: { notaryRate: 1.01 },
      }),
    ).toThrowError(expect.objectContaining({ code: 'OUT_OF_RANGE', field: 'notaryRate' }))
  })

  it('validates semantic budget states instead of silently coercing them', () => {
    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 10_000,
        stateId: 'DE-BW',
        renovationBudget: {
          amountCents: 1,
          budgetStatus: 'confirmed-zero',
        },
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE', field: 'renovationBudget.amountCents' }),
    )

    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 10_000,
        stateId: 'DE-BW',
        renovationBudget: {
          amountCents: 0,
          budgetStatus: 'budgeted',
        },
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'OUT_OF_RANGE', field: 'renovationBudget.amountCents' }),
    )

    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: 10_000,
        stateId: 'DE-BW',
        renovationBudget: null as unknown as PostPurchaseBudgetInput,
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'INVALID_TYPE', field: 'renovationBudget' }),
    )
  })

  it('detects overflow when composing the all-in project cost', () => {
    expect(() =>
      calculateAcquisitionCosts({
        purchasePriceCents: Number.MAX_SAFE_INTEGER,
        stateId: 'DE-BW',
        renovationBudget: confirmedZero,
        movingSetupCosts: confirmedZero,
      }),
    ).toThrowError(expect.objectContaining({ code: 'ARITHMETIC_OVERFLOW' }))
  })
})
