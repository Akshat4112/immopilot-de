import { describe, expect, it } from 'vitest'

import { calculateAcquisitionCosts, type AcquisitionCostInput } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { calculateMortgagePayment } from '../mortgage'
import type { RentalInvestmentResult } from '../rental-investment'
import type { OfferPriceInput } from './types'
import { calculateOfferPrice } from './calculate-offer-price'

const noFeeTemplate: AcquisitionCostInput = {
  purchasePriceCents: 1_000,
  stateId: 'DE-BW',
  brokerInvolved: false,
  rateOverrides: { transferTaxRate: 0, notaryRate: 0, landRegisterRate: 0 },
  renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
  movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
}

function mockRental(
  price = 1_000,
  projectCost = 1_000,
  annualRent = 500,
  noi = 300,
): RentalInvestmentResult {
  return {
    status: 'available',
    annualNetColdRentCents: annualRent,
    netOperatingIncomeCents: noi,
    grossYieldBasis: { denominatorCents: price },
    investmentCostBasisCents: projectCost,
  } as unknown as RentalInvestmentResult
}

function base(overrides: Partial<OfferPriceInput> = {}): OfferPriceInput {
  return {
    acquisitionTemplate: noFeeTemplate,
    rental: mockRental(),
    targetGrossYield: 0.1,
    targetNetYield: 0.15,
    affordability: {
      availableEquityCents: 200,
      maximumMonthlyPaymentCents: 50,
      financedAcquisitionCostShare: 0,
      nominalAnnualRate: 0,
      initialRepaymentRate: 0.12,
    },
    comparables: {
      askingPriceCents: 10_000,
      purchaseOfferCents: 8_000,
      livingAreaSquareMetres: 40.5,
      comparablePricePerSquareMetreLowCents: 3_500,
      comparablePricePerSquareMetreHighCents: 4_000,
      openingOffer: { referencePriceCents: 10_000, largerDiscount: 0.1, smallerDiscount: 0.05 },
    },
    ...overrides,
  }
}

describe('PD-007 §11 offer-price boundaries', () => {
  it('returns exact gross and net ceilings plus the highest payment-rounded cent', () => {
    const result = calculateOfferPrice(base())
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.grossYieldCeiling).toEqual({
      status: 'available',
      priceCeilingCents: 5_000,
      verifiedAgainstRoundedAcquisitionCosts: false,
      nextCentFails: true,
    })
    expect(result.netYieldCeiling).toMatchObject({
      status: 'available',
      priceCeilingCents: 2_000,
      nextCentFails: true,
    })
    expect(result.affordabilityCeiling).toMatchObject({
      status: 'available',
      priceCeilingCents: 5_249,
      cashCostConstraint: 'unbounded',
      loanCapacityCents: 5_000,
      nextCentFails: true,
    })
    // The analytical payment-based limit is 5,200 cents. Actual CF-004 monthly
    // half-up rounding permits 49 further purchase-price cents, then jumps by 1 cent.
    expect(result.comparableOffer).toMatchObject({
      status: 'available',
      comparableValueLowCents: 141_750,
      comparableValueHighCents: 162_000,
      offerDifferenceCents: -2_000,
      openingOffer: { status: 'available', lowCents: 9_000, highCents: 9_500 },
    })
    if (result.comparableOffer.status === 'available') {
      expect(result.comparableOffer.offerDifferenceRate.toNumber()).toBe(-0.2)
    }
  })

  it('uses independently rounded transfer, notary, register and broker fees at the net-yield boundary', () => {
    const acquisitionTemplate: AcquisitionCostInput = {
      ...noFeeTemplate,
      purchasePriceCents: 1_001,
      brokerInvolved: true,
      rateOverrides: {
        transferTaxRate: 0.05,
        notaryRate: 0.015,
        landRegisterRate: 0.005,
        buyerBrokerRate: 0.0357,
      },
      renovationBudget: { amountCents: 20, budgetStatus: 'budgeted' },
    }
    const template = calculateAcquisitionCosts(acquisitionTemplate)
    if (template.status !== 'available') throw new Error('Expected confirmed acquisition')
    const target = 0.15
    const noi = 300
    const result = calculateOfferPrice(
      base({
        acquisitionTemplate,
        rental: mockRental(1_001, template.totalProjectCostCents, 500, noi),
        targetNetYield: target,
        targetGrossYield: undefined,
        affordability: undefined,
        comparables: undefined,
      }),
    )
    if (result.status !== 'available' || result.netYieldCeiling.status !== 'available') {
      throw new Error('Expected net-yield ceiling')
    }
    expect(result.proportionalAcquisitionCostRate.toNumber()).toBeCloseTo(0.1057, 12)
    const ceiling = result.netYieldCeiling.priceCeilingCents
    const atCeiling = calculateAcquisitionCosts({
      ...acquisitionTemplate,
      purchasePriceCents: ceiling,
    })
    const nextCent = calculateAcquisitionCosts({
      ...acquisitionTemplate,
      purchasePriceCents: ceiling + 1,
    })
    if (atCeiling.status !== 'available' || nextCent.status !== 'available')
      throw new Error('Expected acquisition at price boundary')
    expect(noi / atCeiling.totalProjectCostCents).toBeGreaterThanOrEqual(target)
    expect(noi / nextCent.totalProjectCostCents).toBeLessThan(target)
    expect(atCeiling.transactionAcquisitionCostsCents).toBe(
      atCeiling.transferTaxCents +
        atCeiling.notaryCostsCents +
        atCeiling.landRegisterCostsCents +
        atCeiling.buyerBrokerCommissionCents,
    )
    expect(Math.abs(ceiling - Math.floor((noi / target - 20) / 1.1057))).toBeLessThan(10)
  })

  it('verifies equity-only funding and the contractual monthly payment at the affordability ceiling', () => {
    const acquisitionTemplate: AcquisitionCostInput = {
      ...noFeeTemplate,
      rateOverrides: { transferTaxRate: 0.05, notaryRate: 0.01, landRegisterRate: 0.005 },
    }
    const input = base({
      acquisitionTemplate,
      rental: undefined,
      targetGrossYield: undefined,
      targetNetYield: undefined,
      affordability: {
        availableEquityCents: 200,
        maximumMonthlyPaymentCents: 50,
        financedAcquisitionCostShare: 0,
        nominalAnnualRate: 0,
        initialRepaymentRate: 0.12,
      },
    })
    const result = calculateOfferPrice(input)
    if (result.status !== 'available' || result.affordabilityCeiling.status !== 'available')
      throw new Error('Expected affordability ceiling')
    expect(result.affordabilityCeiling.cashCostConstraint).toBe('bounded')
    const ceiling = result.affordabilityCeiling.priceCeilingCents
    const feasible = (price: number) => {
      const acquisition = calculateAcquisitionCosts({
        ...acquisitionTemplate,
        purchasePriceCents: price,
      })
      if (acquisition.status !== 'available') return false
      const financing = calculateFinancing({
        mode: 'available-equity',
        acquisition,
        availableEquityCents: 200,
        financedAcquisitionCostShare: 0,
      })
      if (financing.status !== 'available' || financing.fundingStatus !== 'funded') return false
      const payment = calculateMortgagePayment({
        paymentMode: 'initial-repayment-rate',
        financing,
        nominalAnnualRate: 0,
        initialRepaymentRate: 0.12,
      })
      return payment.status === 'available' && payment.monthlyPaymentCents <= 50
    }
    expect(feasible(ceiling)).toBe(true)
    expect(feasible(ceiling + 1)).toBe(false)
    expect(ceiling).toBeGreaterThan(1_000)
  })

  it('never invents discounts or a sale price when comparables are absent', () => {
    const result = calculateOfferPrice(
      base({
        comparables: undefined,
        targetGrossYield: undefined,
        targetNetYield: undefined,
        affordability: undefined,
      }),
    )
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.comparableOffer).toEqual({ status: 'not-requested' })
    expect(result.grossYieldCeiling).toEqual({ status: 'not-requested' })
    const withComparables = calculateOfferPrice(
      base({
        comparables: {
          askingPriceCents: 1_000,
          purchaseOfferCents: 900,
          livingAreaSquareMetres: 1,
          comparablePricePerSquareMetreLowCents: 1_000,
          comparablePricePerSquareMetreHighCents: 2_000,
        },
      }),
    )
    if (withComparables.status !== 'available') throw new Error(withComparables.reason)
    expect(withComparables.comparableOffer).toMatchObject({
      openingOffer: { status: 'not-requested' },
    })
  })

  it('keeps affordability available when a requested rental calculation is missing or mismatched', () => {
    const missing = calculateOfferPrice(base({ rental: undefined }))
    if (missing.status !== 'available') throw new Error(missing.reason)
    expect(missing.grossYieldCeiling).toEqual({
      status: 'unavailable',
      reason: 'RENTAL_METRICS_MISSING',
    })
    expect(missing.netYieldCeiling).toEqual({
      status: 'unavailable',
      reason: 'RENTAL_METRICS_MISSING',
    })
    expect(missing.affordabilityCeiling.status).toBe('available')
    const mismatch = calculateOfferPrice(base({ rental: mockRental(1_001, 1_001) }))
    if (mismatch.status !== 'available') throw new Error(mismatch.reason)
    expect(mismatch.netYieldCeiling).toEqual({
      status: 'unavailable',
      reason: 'RENTAL_SCENARIO_MISMATCH',
    })
    const unavailable = calculateOfferPrice(
      base({
        rental: {
          status: 'unavailable',
          reason: 'VALIDATION_ERROR',
        } as RentalInvestmentResult,
      }),
    )
    if (unavailable.status !== 'available') throw new Error(unavailable.reason)
    expect(unavailable.grossYieldCeiling).toEqual({
      status: 'unavailable',
      reason: 'RENTAL_METRICS_UNAVAILABLE',
    })
  })

  it('returns typed no-positive-price, negative-target and fixed-cost-underfunding outcomes', () => {
    const zeroGross = calculateOfferPrice(base({ rental: mockRental(1_000, 1_000, 0, 300) }))
    if (zeroGross.status !== 'available') throw new Error(zeroGross.reason)
    expect(zeroGross.grossYieldCeiling).toMatchObject({ status: 'available', priceCeilingCents: 0 })
    const negativeNet = calculateOfferPrice(base({ rental: mockRental(1_000, 1_000, 500, -30) }))
    if (negativeNet.status !== 'available') throw new Error(negativeNet.reason)
    expect(negativeNet.netYieldCeiling).toEqual({
      status: 'unavailable',
      reason: 'NEGATIVE_ANALYTICAL_CEILING',
    })
    const underfunded = calculateOfferPrice(
      base({
        acquisitionTemplate: {
          ...noFeeTemplate,
          renovationBudget: { amountCents: 1_000, budgetStatus: 'budgeted' },
        },
        rental: undefined,
        targetGrossYield: undefined,
        targetNetYield: undefined,
      }),
    )
    if (underfunded.status !== 'available') throw new Error(underfunded.reason)
    expect(underfunded.affordabilityCeiling).toEqual({
      status: 'unavailable',
      reason: 'UNDERFUNDED_FIXED_COSTS',
    })
  })

  it.each([
    [{ targetGrossYield: 0 }, 'targetGrossYield', 'OUT_OF_RANGE'],
    [{ targetNetYield: -0.01 }, 'targetNetYield', 'OUT_OF_RANGE'],
    [
      { affordability: { ...base().affordability!, maximumMonthlyPaymentCents: -1 } },
      'maximumMonthlyPaymentCents',
      'OUT_OF_RANGE',
    ],
    [
      { affordability: { ...base().affordability!, financedAcquisitionCostShare: 1.1 } },
      'financedAcquisitionCostShare',
      'OUT_OF_RANGE',
    ],
    [
      { affordability: { ...base().affordability!, initialRepaymentRate: 0 } },
      'initialRepaymentRate',
      'OUT_OF_RANGE',
    ],
    [
      { comparables: { ...base().comparables!, askingPriceCents: 0 } },
      'askingPriceCents',
      'OUT_OF_RANGE',
    ],
    [
      { comparables: { ...base().comparables!, livingAreaSquareMetres: 0 } },
      'livingAreaSquareMetres',
      'OUT_OF_RANGE',
    ],
    [
      { comparables: { ...base().comparables!, comparablePricePerSquareMetreLowCents: 5_000 } },
      'comparablePricePerSquareMetreLowCents',
      'OUT_OF_RANGE',
    ],
    [
      {
        comparables: {
          ...base().comparables!,
          openingOffer: { referencePriceCents: 1_000, largerDiscount: 1, smallerDiscount: 0.1 },
        },
      },
      'largerDiscount',
      'OUT_OF_RANGE',
    ],
  ] as const)('returns field-specific validation for %o', (overrides, field, code) => {
    expect(calculateOfferPrice(base(overrides as Partial<OfferPriceInput>))).toMatchObject({
      status: 'unavailable',
      reason: 'VALIDATION_ERROR',
      error: { field, code },
    })
  })

  it('rejects unconfirmed acquisition budgets rather than treating unknown renovation as zero', () => {
    expect(
      calculateOfferPrice(
        base({
          acquisitionTemplate: {
            ...noFeeTemplate,
            renovationBudget: { amountCents: 0, budgetStatus: 'not-budgeted' },
          },
        }),
      ),
    ).toMatchObject({
      status: 'unavailable',
      reason: 'ACQUISITION_TEMPLATE_UNAVAILABLE',
      acquisition: { reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED' },
    })
  })
})
