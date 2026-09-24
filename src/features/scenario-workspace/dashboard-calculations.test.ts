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
    expect(result.baselineFixedPeriod).toBe(result.fixedPeriod)
    expect(result.refinancing).toMatchObject({
      status: 'available',
      assumptionKind: 'user-selected-stress-not-forecast',
    })
    expect(result.modeSpecific).toMatchObject({
      mode: 'owner-occupier',
      result: { status: 'not-configured' },
    })
  })

  it('uses the selected Sondertilgung debt for fixed-period and refinancing results', () => {
    const baseline = calculateScenarioDashboard(
      completePurchaseDraft(),
      fundedFinancing,
      initialScenarioAnalysisDraft,
    )
    const result = calculateScenarioDashboard(
      completePurchaseDraft(),
      {
        ...fundedFinancing,
        additionalRepayments: {
          annualAdditionalRepayment: '5.000',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments: [{ amount: '2.500', month: '12' }],
        },
      },
      initialScenarioAnalysisDraft,
    )

    expect(result.selectedAmortizationBasis).toBe('additional-repayments')
    expect(result.baselineFixedPeriod).toMatchObject({
      status: 'available',
      remainingDebtCents: 15_218_873,
    })
    expect(result.additionalRepaymentComparison.status).toBe('available')
    if (
      result.additionalRepaymentComparison.status !== 'available' ||
      result.fixedPeriod.status !== 'available' ||
      result.refinancing.status !== 'available' ||
      baseline.refinancing.status !== 'available'
    ) {
      throw new Error('Expected available selected and baseline refinancing results')
    }
    expect(result.fixedPeriod.remainingDebtCents).toBe(
      result.additionalRepaymentComparison.withAdditionalRepayments.remainingDebtAtFixedPeriodCents,
    )
    expect(result.fixedPeriod.additionalPrincipalPaidCents).toBeGreaterThan(0)
    expect(result.refinancing.remainingDebtCents).toBe(result.fixedPeriod.remainingDebtCents)
    expect(result.payment).toMatchObject({ monthlyPaymentCents: 91_667 })
    expect(result.refinancing.scenarios[1]?.futureMonthlyPaymentCents).toBeLessThan(
      baseline.refinancing.scenarios[1]?.futureMonthlyPaymentCents ?? 0,
    )
  })

  it('marks refinancing not applicable when a one-time repayment clears the loan early', () => {
    const result = calculateScenarioDashboard(
      completePurchaseDraft(),
      {
        ...fundedFinancing,
        additionalRepayments: {
          annualAdditionalRepayment: '',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments: [{ amount: '999.999', month: '1' }],
        },
      },
      initialScenarioAnalysisDraft,
    )

    expect(result.fixedPeriod).toMatchObject({
      status: 'available',
      remainingDebtCents: 0,
      refinancing: { status: 'not-applicable', reason: 'PAID_OFF' },
    })
    expect(result.refinancing).toEqual({ status: 'not-applicable', reason: 'PAID_OFF' })
  })

  it('blocks dependent refinancing when the selected Sondertilgung schedule is invalid', () => {
    const result = calculateScenarioDashboard(
      completePurchaseDraft(),
      {
        ...fundedFinancing,
        additionalRepayments: {
          annualAdditionalRepayment: '',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments: [{ amount: '', month: '18' }],
        },
      },
      initialScenarioAnalysisDraft,
    )

    expect(result.baselineFixedPeriod).toMatchObject({ status: 'available' })
    expect(result.selectedAmortizationBasis).toBe('unavailable')
    expect(result.fixedPeriod).toMatchObject({
      status: 'unavailable',
      reason: 'AMORTIZATION_SCHEDULE_UNAVAILABLE',
    })
    expect(result.refinancing).toMatchObject({
      status: 'unavailable',
      reason: 'FIXED_PERIOD_UNAVAILABLE',
    })
  })

  it('restores baseline refinancing when additional repayments are removed', () => {
    const result = calculateScenarioDashboard(
      completePurchaseDraft(),
      fundedFinancing,
      initialScenarioAnalysisDraft,
    )

    expect(result.selectedAmortizationBasis).toBe('baseline')
    expect(result.fixedPeriod).toBe(result.baselineFixedPeriod)
    expect(result.refinancing).toMatchObject({
      status: 'available',
      remainingDebtCents: 15_218_873,
    })
  })

  it('uses Sondertilgung in the owner matched-budget projection', () => {
    const financingWithAdditionalRepayments = {
      ...fundedFinancing,
      additionalRepayments: {
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [],
      },
    }
    const analysis = {
      ...initialScenarioAnalysisDraft,
      currentComparableRent: '1000',
      monthlyOwnerCosts: '250',
    }
    const baseline = calculateScenarioDashboard(completePurchaseDraft(), fundedFinancing, analysis)
    const withAdditionalRepayments = calculateScenarioDashboard(
      completePurchaseDraft(),
      financingWithAdditionalRepayments,
      analysis,
    )

    expect(baseline.modeSpecific.mode).toBe('owner-occupier')
    expect(withAdditionalRepayments.modeSpecific.mode).toBe('owner-occupier')
    if (
      baseline.modeSpecific.mode !== 'owner-occupier' ||
      baseline.modeSpecific.result.status !== 'available' ||
      withAdditionalRepayments.modeSpecific.mode !== 'owner-occupier' ||
      withAdditionalRepayments.modeSpecific.result.status !== 'available'
    ) {
      throw new Error('Expected available owner projections')
    }

    const baselineMonth12 = baseline.modeSpecific.result.rows[11]!
    const selectedMonth12 = withAdditionalRepayments.modeSpecific.result.rows[11]!
    expect(selectedMonth12.additionalRepaymentCents).toBe(500_000)
    expect(selectedMonth12.buyerHousingOutflowCents).toBe(
      baselineMonth12.buyerHousingOutflowCents + 500_000,
    )
    expect(selectedMonth12.remainingMortgageDebtCents).toBeLessThan(
      baselineMonth12.remainingMortgageDebtCents,
    )
    expect(
      withAdditionalRepayments.modeSpecific.result.atAnalysisMonth.remainingMortgageDebtCents,
    ).toBeLessThan(baseline.modeSpecific.result.atAnalysisMonth.remainingMortgageDebtCents)
  })

  it('uses overlapping repayments in rental cash flow, debt, and sale projections', () => {
    const analysis = {
      ...initialScenarioAnalysisDraft,
      propertyUse: 'rental-investment' as const,
      monthlyNetColdRent: '1000',
      monthlyNonRecoverableHausgeld: '150',
      rentalPropertyAppreciationRate: '2',
      rentalSellingCostRate: '3',
    }
    const baseline = calculateScenarioDashboard(completePurchaseDraft(), fundedFinancing, analysis)
    const withAdditionalRepayments = calculateScenarioDashboard(
      completePurchaseDraft(),
      {
        ...fundedFinancing,
        additionalRepayments: {
          annualAdditionalRepayment: '5.000',
          annualAdditionalRepaymentMonth: '12',
          oneTimeAdditionalRepayments: [{ amount: '2.500', month: '12' }],
        },
      },
      analysis,
    )

    expect(baseline.modeSpecific.mode).toBe('rental-investment')
    expect(withAdditionalRepayments.modeSpecific.mode).toBe('rental-investment')
    if (
      baseline.modeSpecific.mode !== 'rental-investment' ||
      baseline.modeSpecific.result.status !== 'available' ||
      baseline.modeSpecific.result.sale.status !== 'available' ||
      withAdditionalRepayments.modeSpecific.mode !== 'rental-investment' ||
      withAdditionalRepayments.modeSpecific.result.status !== 'available' ||
      withAdditionalRepayments.modeSpecific.result.sale.status !== 'available'
    ) {
      throw new Error('Expected available rental projections with a projected sale')
    }

    const baselineMonth12 = baseline.modeSpecific.result.rows[11]!
    const selectedMonth12 = withAdditionalRepayments.modeSpecific.result.rows[11]!
    expect(selectedMonth12.additionalRepaymentCents).toBe(750_000)
    expect(selectedMonth12.preTaxCashFlowAfterExtraCents).toBe(
      selectedMonth12.preTaxCashFlowBeforeExtraCents - 750_000,
    )
    expect(selectedMonth12.remainingDebtCents).toBeLessThan(baselineMonth12.remainingDebtCents)
    expect(
      withAdditionalRepayments.modeSpecific.result.remainingDebtAfterHoldingPeriodCents,
    ).toBeLessThan(baseline.modeSpecific.result.remainingDebtAfterHoldingPeriodCents)
    expect(withAdditionalRepayments.modeSpecific.result.sale.netSaleProceedsCents).toBeGreaterThan(
      baseline.modeSpecific.result.sale.netSaleProceedsCents,
    )
    expect(withAdditionalRepayments.modeSpecific.result.grossRentalYield.toString()).toBe(
      baseline.modeSpecific.result.grossRentalYield.toString(),
    )
    expect(withAdditionalRepayments.modeSpecific.result.netRentalYield.toString()).toBe(
      baseline.modeSpecific.result.netRentalYield.toString(),
    )
  })

  it('blocks owner and rental projections when the selected schedule is invalid', () => {
    const invalidFinancing = {
      ...fundedFinancing,
      additionalRepayments: {
        annualAdditionalRepayment: '',
        annualAdditionalRepaymentMonth: '12',
        oneTimeAdditionalRepayments: [{ amount: '', month: '18' }],
      },
    }
    const analyses = [
      {
        ...initialScenarioAnalysisDraft,
        currentComparableRent: '1000',
        monthlyOwnerCosts: '250',
      },
      {
        ...initialScenarioAnalysisDraft,
        propertyUse: 'rental-investment' as const,
        monthlyNetColdRent: '1000',
        monthlyNonRecoverableHausgeld: '150',
      },
    ]

    for (const analysis of analyses) {
      const result = calculateScenarioDashboard(completePurchaseDraft(), invalidFinancing, analysis)
      expect(result.selectedAmortizationBasis).toBe('unavailable')
      expect(result.modeSpecific.result).toMatchObject({
        status: 'unavailable',
        reason: 'AMORTIZATION_UNAVAILABLE',
      })
    }
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
