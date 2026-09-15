import { describe, expect, it } from 'vitest'

import pd010 from '../../../data/fixtures/pd010-expected-results.json'
import rentalScenario from '../../../examples/scenarios/rental-investment.json'
import { calculateAcquisitionCosts, type BudgetStatus } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { calculateAmortizationSchedule, calculateMortgagePayment } from '../mortgage'
import { calculateRentalInvestment } from '../rental-investment'
import { calculateOfferPrice } from './calculate-offer-price'

interface Scenario {
  property: { purchasePriceCents: number; stateId: string; livingAreaSquareMetres: number }
  acquisition: {
    transferTaxRate: { value: number }
    notaryRate: { value: number }
    landRegisterRate: { value: number }
    broker: { involved: boolean; buyerCommissionRate: { value: number } }
    renovationBudget: { amountCents: number; budgetStatus: BudgetStatus }
    movingSetupCosts: { amountCents: number; budgetStatus: BudgetStatus }
  }
  financing: {
    availableEquityCents: number
    downPaymentCents: number
    financedAcquisitionCostShare: number
    nominalAnnualRate: number
    initialRepaymentRate: number
    fixedInterestMonths: number
  }
  rentalInvestment: {
    monthlyNetColdRentCents: number
    vacancyRate: number
    otherAnnualRentLossCents: number
    monthlyNonRecoverableHausgeldExcludingReserveCents: number
    monthlyReserveContributionCents: number
    annualMaintenanceAllowanceOutsideHausgeldCents: number
    otherAnnualOwnerCostsCents: number
    rentGrowthRate: number
    ownerCostGrowthRate: number
    propertyAppreciationRate: number
    sellingCostRate: number
    holdingPeriodMonths: number
  }
  offerAnalysis: {
    askingPriceCents: number
    targetGrossYield: number
    targetNetYield: number
    comparablePricePerSquareMetreLowCents: number
    comparablePricePerSquareMetreHighCents: number
    openingOfferLargerDiscount: number
    openingOfferSmallerDiscount: number
  }
}

interface Expected {
  acquisition: {
    totalProjectCostCents: number
    loanAmountCents: number
    requiredEquityCents: number
  }
  mortgageBaseline: { contractualMonthlyPaymentCents: number }
  rentalInvestment: {
    annualNetColdRentCents: number
    netOperatingIncomeCents: number
    investmentCostBasisCents: number
  }
}

const scenario = rentalScenario as unknown as Scenario
const fixture = (pd010.cases as unknown as { id: string; expected: Expected }[]).find(
  (item) => item.id === 'demo-rental-investment-bw',
)?.expected

describe('PD-007 §11 offer limits against PD-010 Baden-Württemberg demo', () => {
  it('uses the merged acquisition, financing, mortgage and rental results at exact cent boundaries', () => {
    if (!fixture) throw new Error('Missing PD-010 rental demo')
    const { property, acquisition, financing, rentalInvestment, offerAnalysis } = scenario
    const acquisitionTemplate = {
      purchasePriceCents: property.purchasePriceCents,
      stateId: property.stateId,
      brokerInvolved: acquisition.broker.involved,
      rateOverrides: {
        transferTaxRate: acquisition.transferTaxRate.value,
        notaryRate: acquisition.notaryRate.value,
        landRegisterRate: acquisition.landRegisterRate.value,
        buyerBrokerRate: acquisition.broker.buyerCommissionRate.value,
      },
      renovationBudget: acquisition.renovationBudget,
      movingSetupCosts: acquisition.movingSetupCosts,
    }
    const acquisitionResult = calculateAcquisitionCosts(acquisitionTemplate)
    const financingResult = calculateFinancing({
      mode: 'selected-down-payment',
      acquisition: acquisitionResult,
      availableEquityCents: financing.availableEquityCents,
      downPaymentCents: financing.downPaymentCents,
      financedAcquisitionCostShare: financing.financedAcquisitionCostShare,
    })
    const payment = calculateMortgagePayment({
      paymentMode: 'initial-repayment-rate',
      financing: financingResult,
      nominalAnnualRate: financing.nominalAnnualRate,
      initialRepaymentRate: financing.initialRepaymentRate,
    })
    const schedule = calculateAmortizationSchedule({
      payment,
      fixedInterestMonths: financing.fixedInterestMonths,
    })
    const rental = calculateRentalInvestment({
      financing: financingResult,
      amortization: schedule,
      ...rentalInvestment,
    })
    if (rental.status !== 'available')
      throw new Error(`Rental metrics unavailable: ${rental.reason}`)
    expect(rental).toMatchObject({
      annualNetColdRentCents: fixture.rentalInvestment.annualNetColdRentCents,
      netOperatingIncomeCents: fixture.rentalInvestment.netOperatingIncomeCents,
      investmentCostBasisCents: fixture.rentalInvestment.investmentCostBasisCents,
    })
    const result = calculateOfferPrice({
      acquisitionTemplate,
      rental,
      targetGrossYield: offerAnalysis.targetGrossYield,
      targetNetYield: offerAnalysis.targetNetYield,
      affordability: {
        availableEquityCents: financing.availableEquityCents,
        maximumMonthlyPaymentCents: fixture.mortgageBaseline.contractualMonthlyPaymentCents,
        financedAcquisitionCostShare: financing.financedAcquisitionCostShare,
        nominalAnnualRate: financing.nominalAnnualRate,
        initialRepaymentRate: financing.initialRepaymentRate,
      },
      comparables: {
        askingPriceCents: offerAnalysis.askingPriceCents,
        purchaseOfferCents: property.purchasePriceCents,
        livingAreaSquareMetres: property.livingAreaSquareMetres,
        comparablePricePerSquareMetreLowCents: offerAnalysis.comparablePricePerSquareMetreLowCents,
        comparablePricePerSquareMetreHighCents:
          offerAnalysis.comparablePricePerSquareMetreHighCents,
        openingOffer: {
          referencePriceCents: offerAnalysis.askingPriceCents,
          largerDiscount: offerAnalysis.openingOfferLargerDiscount,
          smallerDiscount: offerAnalysis.openingOfferSmallerDiscount,
        },
      },
    })
    if (result.status !== 'available') throw new Error(result.reason)
    expect(result.grossYieldCeiling).toMatchObject({
      status: 'available',
      priceCeilingCents: 26_666_666,
    })
    expect(result.proportionalAcquisitionCostRate.toNumber()).toBeCloseTo(0.065, 12)
    expect(result.fixedInitialCostsCents).toBe(1_000_000)
    expect(result.comparableOffer).toMatchObject({
      status: 'available',
      comparableValueLowCents: 22_750_000,
      comparableValueHighCents: 27_300_000,
      offerDifferenceCents: -1_000_000,
      openingOffer: { status: 'available', lowCents: 22_500_000, highCents: 23_750_000 },
    })
    if (
      result.netYieldCeiling.status !== 'available' ||
      result.affordabilityCeiling.status !== 'available'
    ) {
      throw new Error('Expected both verified ceilings')
    }
    const netCeiling = result.netYieldCeiling.priceCeilingCents
    const netAt = calculateAcquisitionCosts({
      ...acquisitionTemplate,
      purchasePriceCents: netCeiling,
    })
    const netNext = calculateAcquisitionCosts({
      ...acquisitionTemplate,
      purchasePriceCents: netCeiling + 1,
    })
    if (netAt.status !== 'available' || netNext.status !== 'available')
      throw new Error('Expected acquisitions at net ceiling')
    expect(rental.netOperatingIncomeCents / netAt.totalProjectCostCents).toBeGreaterThanOrEqual(
      offerAnalysis.targetNetYield,
    )
    expect(rental.netOperatingIncomeCents / netNext.totalProjectCostCents).toBeLessThan(
      offerAnalysis.targetNetYield,
    )
    expect(Math.abs(netCeiling - Math.floor((840_000 / 0.035 - 1_000_000) / 1.065))).toBeLessThan(
      10,
    )

    const affordableCeiling = result.affordabilityCeiling.priceCeilingCents
    expect(affordableCeiling).toBeGreaterThanOrEqual(property.purchasePriceCents)
    for (const [price, shouldFit] of [
      [affordableCeiling, true],
      [affordableCeiling + 1, false],
    ] as const) {
      const atPrice = calculateAcquisitionCosts({
        ...acquisitionTemplate,
        purchasePriceCents: price,
      })
      if (atPrice.status !== 'available')
        throw new Error('Expected acquisition at affordability boundary')
      const funds = calculateFinancing({
        mode: 'available-equity',
        acquisition: atPrice,
        availableEquityCents: financing.availableEquityCents,
        financedAcquisitionCostShare: financing.financedAcquisitionCostShare,
      })
      if (funds.status !== 'available')
        throw new Error('Expected financing at affordability boundary')
      const monthly = calculateMortgagePayment({
        paymentMode: 'initial-repayment-rate',
        financing: funds,
        nominalAnnualRate: financing.nominalAnnualRate,
        initialRepaymentRate: financing.initialRepaymentRate,
      })
      const fits =
        funds.fundingStatus === 'funded' &&
        monthly.status === 'available' &&
        monthly.monthlyPaymentCents <= fixture.mortgageBaseline.contractualMonthlyPaymentCents
      expect(fits).toBe(shouldFit)
    }
  })
})
