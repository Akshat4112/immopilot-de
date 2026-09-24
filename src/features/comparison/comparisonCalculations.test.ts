import { describe, expect, it } from 'vitest'

import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
} from '../scenario-workspace'
import { createSavedScenario } from '../../storage'
import { calculateSavedScenarioComparison, hasMixedComparisonBasis } from './comparisonCalculations'

function scenario(
  name: string,
  options: {
    price?: string
    mode?: 'owner-occupier' | 'rental-investment'
    fixedYears?: string
  } = {},
) {
  const rental = options.mode === 'rental-investment'
  return createSavedScenario(
    name,
    {
      purchaseCosts: {
        ...initialPurchaseCostsDraft,
        purchasePrice: options.price ?? '250000',
        renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
        movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      },
      financing: {
        ...initialFinancingDraft,
        availableEquity: '66250',
        downPayment: '50000',
        fixedInterestYears: options.fixedYears ?? '10',
      },
      analysis: {
        ...initialScenarioAnalysisDraft,
        propertyUse: rental ? 'rental-investment' : 'owner-occupier',
        currentComparableRent: rental ? '' : '1000',
        monthlyOwnerCosts: rental ? '' : '250',
        monthlyNetColdRent: rental ? '1000' : '',
        monthlyNonRecoverableHausgeld: rental ? '150' : '',
        rentalPropertyAppreciationRate: rental ? '2' : '',
        rentalSellingCostRate: rental ? '3' : '',
        targetGrossYield: rental ? '5' : '',
        targetNetYield: rental ? '4' : '',
        maximumMonthlyPayment: '1000',
        livingAreaSquareMetres: '60',
        askingPrice: options.price ?? '250000',
        proposedOffer: '230000',
        comparablePricePerSquareMetreLow: '3800',
        comparablePricePerSquareMetreHigh: '4300',
        openingOfferLargerDiscount: '12',
        openingOfferSmallerDiscount: '8',
      },
    },
    { id: name.toLowerCase().replaceAll(' ', '-') },
  )
}

describe('saved scenario comparison calculations', () => {
  it('recalculates requested purchase, financing, rental, return, and offer metrics', () => {
    const comparison = calculateSavedScenarioComparison(
      scenario('Rental', { mode: 'rental-investment' }),
    )

    expect(comparison.values.purchasePrice).toMatchObject({
      status: 'available',
      cents: 25_000_000,
    })
    expect(comparison.values.acquisitionCosts.status).toBe('available')
    expect(comparison.values.equity.status).toBe('available')
    expect(comparison.values.loan).toMatchObject({ status: 'available', cents: 20_000_000 })
    expect(comparison.values.monthlyPayment.status).toBe('available')
    expect(comparison.values.remainingDebt.status).toBe('available')
    expect(comparison.values.grossYield).toMatchObject({
      status: 'available',
      format: 'percentage',
      numeratorCents: 1_200_000,
      denominatorCents: 25_000_000,
    })
    expect(comparison.values.netYield.status).toBe('available')
    expect(comparison.values.monthlyCashFlow.status).toBe('available')
    expect(comparison.values.projectedReturn).toMatchObject({
      status: 'available',
      basis: 'rental:120',
    })
    expect(comparison.values.grossYieldCeiling.status).toBe('available')
    expect(comparison.values.netYieldCeiling.status).toBe('available')
    expect(comparison.values.affordabilityCeiling.status).toBe('available')
    expect(comparison.values.comparableValue.status).toBe('available')
    expect(comparison.values.openingOffer).toMatchObject({
      status: 'available',
      lowCents: 22_000_000,
      highCents: 23_000_000,
    })
  })

  it('marks rental-only metrics as not applicable and incomplete metrics as missing', () => {
    const owner = calculateSavedScenarioComparison(scenario('Owner'))
    const incomplete = calculateSavedScenarioComparison(
      createSavedScenario(
        'Incomplete rental',
        {
          purchaseCosts: initialPurchaseCostsDraft,
          financing: initialFinancingDraft,
          analysis: { ...initialScenarioAnalysisDraft, propertyUse: 'rental-investment' },
        },
        { id: 'incomplete' },
      ),
    )

    expect(owner.values.grossYield.status).toBe('not-applicable')
    expect(owner.values.monthlyCashFlow.status).toBe('not-applicable')
    expect(incomplete.values.grossYield).toMatchObject({ status: 'missing' })
    expect(incomplete.values.loan.status).toBe('unavailable')
  })

  it('flags remaining debt and projected results that use different bases', () => {
    const comparisons = [
      calculateSavedScenarioComparison(scenario('Owner', { fixedYears: '10' })),
      calculateSavedScenarioComparison(
        scenario('Rental', { mode: 'rental-investment', fixedYears: '15' }),
      ),
    ]

    expect(hasMixedComparisonBasis(comparisons, 'remainingDebt')).toBe(true)
    expect(hasMixedComparisonBasis(comparisons, 'projectedReturn')).toBe(true)
  })

  it('marks remaining debt as not applicable for a cash purchase', () => {
    const cashPurchase = scenario('Cash purchase')
    cashPurchase.inputs.financing = {
      ...cashPurchase.inputs.financing,
      availableEquity: '300000',
      downPayment: '250000',
    }

    const comparison = calculateSavedScenarioComparison(cashPurchase)

    expect(comparison.dashboard.payment).toMatchObject({ status: 'available', cashPurchase: true })
    expect(comparison.values.remainingDebt.status).toBe('not-applicable')
  })

  it('uses the selected Sondertilgung schedule for debt and owner projected return', () => {
    const baseline = calculateSavedScenarioComparison(scenario('Baseline'))
    const saved = scenario('With Sondertilgung')
    saved.inputs.financing.additionalRepayments = {
      annualAdditionalRepayment: '5.000',
      annualAdditionalRepaymentMonth: '12',
      oneTimeAdditionalRepayments: [],
    }

    const comparison = calculateSavedScenarioComparison(saved)

    expect(comparison.dashboard.selectedAmortizationBasis).toBe('additional-repayments')
    expect(comparison.dashboard.fixedPeriod).toMatchObject({
      status: 'available',
      remainingDebtCents: 9_337_777,
    })
    expect(comparison.values.remainingDebt).toMatchObject({
      status: 'available',
      cents: 9_337_777,
      repaymentBasis: 'additional-repayments',
    })
    expect(comparison.values.monthlyPayment).toEqual(baseline.values.monthlyPayment)
    expect(comparison.values.projectedReturn).toMatchObject({
      status: 'available',
      repaymentBasis: 'additional-repayments',
    })
    expect(comparison.values.projectedReturn).not.toEqual(baseline.values.projectedReturn)
  })

  it('includes a due one-time repayment in rental cash flow and projected return', () => {
    const baselineSaved = scenario('Rental baseline', { mode: 'rental-investment' })
    const repaymentSaved = scenario('Rental repayment', { mode: 'rental-investment' })
    repaymentSaved.inputs.financing.additionalRepayments = {
      annualAdditionalRepayment: '',
      annualAdditionalRepaymentMonth: '12',
      oneTimeAdditionalRepayments: [{ amount: '2.500', month: '1' }],
    }

    const baseline = calculateSavedScenarioComparison(baselineSaved)
    const repayment = calculateSavedScenarioComparison(repaymentSaved)
    const baselineCashFlow = baseline.values.monthlyCashFlow
    const repaymentCashFlow = repayment.values.monthlyCashFlow

    expect(baselineCashFlow).toMatchObject({ status: 'available', format: 'euro' })
    expect(repaymentCashFlow).toMatchObject({
      status: 'available',
      format: 'euro',
      repaymentBasis: 'additional-repayments',
    })
    if (
      baselineCashFlow.status !== 'available' ||
      baselineCashFlow.format !== 'euro' ||
      repaymentCashFlow.status !== 'available' ||
      repaymentCashFlow.format !== 'euro'
    ) {
      throw new Error('Expected available rental cash-flow values')
    }
    expect(repaymentCashFlow.cents).toBe(baselineCashFlow.cents - 250_000)
    expect(repayment.values.projectedReturn).toMatchObject({
      status: 'available',
      repaymentBasis: 'additional-repayments',
    })
    expect(repayment.values.grossYield).toEqual(baseline.values.grossYield)
    expect(repayment.values.netYield).toEqual(baseline.values.netYield)
  })

  it('marks schedule-dependent comparison metrics unavailable for invalid repayments', () => {
    const saved = scenario('Invalid repayment', { mode: 'rental-investment' })
    saved.inputs.financing.additionalRepayments = {
      annualAdditionalRepayment: '',
      annualAdditionalRepaymentMonth: '12',
      oneTimeAdditionalRepayments: [{ amount: '', month: '18' }],
    }

    const comparison = calculateSavedScenarioComparison(saved)

    expect(comparison.dashboard.selectedAmortizationBasis).toBe('unavailable')
    expect(comparison.values.remainingDebt.status).toBe('unavailable')
    expect(comparison.values.monthlyCashFlow.status).toBe('unavailable')
    expect(comparison.values.projectedReturn.status).toBe('unavailable')
  })
})
