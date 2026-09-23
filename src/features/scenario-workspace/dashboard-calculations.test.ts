import { describe, expect, it } from 'vitest'

import {
  calculateScenarioDashboard,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
} from './index'

function completePurchaseDraft() {
  return {
    ...initialPurchaseCostsDraft,
    purchasePrice: '250000',
    renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' as const },
    movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' as const },
  }
}

const fundedFinancing = {
  ...initialFinancingDraft,
  availableEquity: '66250',
  downPayment: '50000',
}

describe('single-property dashboard calculations', () => {
  it('derives key mortgage and refinancing results from the shared purchase and financing draft', () => {
    const result = calculateScenarioDashboard(
      completePurchaseDraft(),
      fundedFinancing,
      initialScenarioAnalysisDraft,
    )

    expect(result.financing).toMatchObject({
      status: 'available',
      fundingStatus: 'funded',
      loanAmountCents: 20_000_000,
    })
    expect(result.fixedPeriod).toMatchObject({
      status: 'available',
      remainingDebtCents: 15_218_873,
    })
    expect(result.refinancing).toMatchObject({
      status: 'available',
      assumptionKind: 'user-selected-stress-not-forecast',
    })
    expect(result.modeSpecific).toMatchObject({
      mode: 'owner-occupier',
      result: { status: 'not-configured' },
    })
  })

  it('unlocks rent-versus-buy only after the owner-occupier assumptions are explicit', () => {
    const result = calculateScenarioDashboard(completePurchaseDraft(), fundedFinancing, {
      ...initialScenarioAnalysisDraft,
      currentComparableRent: '1000',
      monthlyOwnerCosts: '250',
    })

    expect(result.modeSpecific.mode).toBe('owner-occupier')
    if (result.modeSpecific.mode !== 'owner-occupier') throw new Error('Expected owner scenario')
    expect(result.modeSpecific.result).toMatchObject({
      status: 'available',
      comparisonBasis: 'matched-budget-liquidation',
      analysisMonths: 120,
    })
  })

  it('uses the selected locale when parsing analysis money inputs', () => {
    const germanResult = calculateScenarioDashboard(completePurchaseDraft(), fundedFinancing, {
      ...initialScenarioAnalysisDraft,
      currentComparableRent: '1.200,50',
      monthlyOwnerCosts: '250',
    })
    const englishResult = calculateScenarioDashboard(
      completePurchaseDraft(),
      fundedFinancing,
      {
        ...initialScenarioAnalysisDraft,
        currentComparableRent: '1,200.50',
        monthlyOwnerCosts: '250',
      },
      'en',
    )

    expect(englishResult.modeSpecific).toEqual(germanResult.modeSpecific)
  })

  it('derives rental, projected-sale and offer metrics from explicit investment assumptions', () => {
    const result = calculateScenarioDashboard(completePurchaseDraft(), fundedFinancing, {
      ...initialScenarioAnalysisDraft,
      propertyUse: 'rental-investment',
      monthlyNetColdRent: '1000',
      monthlyNonRecoverableHausgeld: '150',
      rentalPropertyAppreciationRate: '2',
      rentalSellingCostRate: '3',
      targetGrossYield: '5',
      targetNetYield: '4',
      maximumMonthlyPayment: '1000',
      livingAreaSquareMetres: '60',
      askingPrice: '250000',
      proposedOffer: '230000',
      comparablePricePerSquareMetreLow: '3800',
      comparablePricePerSquareMetreHigh: '4300',
      openingOfferLargerDiscount: '12',
      openingOfferSmallerDiscount: '8',
    })

    expect(result.modeSpecific.mode).toBe('rental-investment')
    if (result.modeSpecific.mode !== 'rental-investment')
      throw new Error('Expected rental scenario')
    expect(result.modeSpecific.result).toMatchObject({
      status: 'available',
      sale: { status: 'available' },
    })
    expect(result.offerPrice).toMatchObject({
      status: 'available',
      grossYieldCeiling: { status: 'available' },
      netYieldCeiling: { status: 'available' },
      affordabilityCeiling: { status: 'available' },
      comparableOffer: { status: 'available', openingOffer: { status: 'available' } },
    })
  })
})
