import { describe, expect, it } from 'vitest'

import pd007 from '../../../data/fixtures/pd007-v1.json'
import pd010 from '../../../data/fixtures/pd010-expected-results.json'
import rentalScenario from '../../../examples/scenarios/rental-investment.json'
import { calculateAcquisitionCosts, type BudgetStatus } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { calculateAmortizationSchedule, calculateMortgagePayment } from '../mortgage'
import { calculateRentalInvestment } from './calculate-rental-investment'

interface Scenario {
  property: { purchasePriceCents: number; stateId: string }
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
}

interface Expected {
  annualNetColdRentCents: number
  effectiveAnnualRentCents: number
  annualOwnerCostsCents: number
  netOperatingIncomeCents: number
  investmentCostBasisCents: number
  grossRentalYield: number
  netRentalYield: number
  monthlyMortgagePaymentCents: number
  monthlyPreTaxCashFlowBeforeExtraCents: number
  annualPreTaxCashFlowBeforeExtraCents: number
  annualPreTaxCashFlowAfterExtraCents: number
  cashOnCashReturn: number
  debtReductionAfterHoldingPeriodCents: number
  remainingDebtAfterHoldingPeriodCents: number
  projectedSalePriceCents: number
  sellingCostsCents: number
  netSaleProceedsCents: number
  cumulativeCashFlowCents: number
  estimatedProfitBeforeTaxCents: number
}

const scenario = rentalScenario as unknown as Scenario
const expected = (
  pd010.cases as unknown as { id: string; expected: { rentalInvestment?: Expected } }[]
).find((item) => item.id === 'demo-rental-investment-bw')?.expected.rentalInvestment
const pd007Expected = (
  pd007.cases as unknown as { id: string; expected: Partial<Expected> }[]
).find((item) => item.id === 'rental-investment')?.expected

describe('PD-007 / PD-010 Baden-Württemberg rental vectors', () => {
  it('reproduces operating income, financing, 120-month debt and sale to the cent', () => {
    if (!expected || !pd007Expected) throw new Error('Missing rental-investment fixtures')
    const { acquisition, financing, property, rentalInvestment } = scenario
    const acquisitionResult = calculateAcquisitionCosts({
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
    })
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
    const amortization = calculateAmortizationSchedule({
      payment,
      fixedInterestMonths: financing.fixedInterestMonths,
    })
    const result = calculateRentalInvestment({
      financing: financingResult,
      amortization,
      ...rentalInvestment,
    })
    if (result.status !== 'available')
      throw new Error(`Rental investment unavailable: ${result.reason}`)

    expect(result).toMatchObject({
      annualNetColdRentCents: expected.annualNetColdRentCents,
      effectiveAnnualRentCents: expected.effectiveAnnualRentCents,
      annualOwnerCostsCents: expected.annualOwnerCostsCents,
      netOperatingIncomeCents: expected.netOperatingIncomeCents,
      investmentCostBasisCents: expected.investmentCostBasisCents,
      firstYearPreTaxCashFlowBeforeExtraCents: expected.annualPreTaxCashFlowBeforeExtraCents,
      firstYearPreTaxCashFlowAfterExtraCents: expected.annualPreTaxCashFlowAfterExtraCents,
      remainingDebtAfterHoldingPeriodCents: expected.remainingDebtAfterHoldingPeriodCents,
      debtReductionAfterHoldingPeriodCents: expected.debtReductionAfterHoldingPeriodCents,
      cumulativeCashFlowAfterHoldingPeriodCents: expected.cumulativeCashFlowCents,
    })
    expect(result.firstMonth).toMatchObject({
      regularMortgagePaymentCents: expected.monthlyMortgagePaymentCents,
      preTaxCashFlowBeforeExtraCents: expected.monthlyPreTaxCashFlowBeforeExtraCents,
    })
    expect(result.grossRentalYield.toNumber()).toBeCloseTo(expected.grossRentalYield, 12)
    expect(result.netRentalYield.toNumber()).toBeCloseTo(expected.netRentalYield, 12)
    expect(result.cashOnCash.status).toBe('available')
    if (result.cashOnCash.status === 'available') {
      expect(result.cashOnCash.annualBeforeExtraReturn.toNumber()).toBeCloseTo(
        expected.cashOnCashReturn,
        12,
      )
      expect(result.cashOnCash.denominatorCents).toBe(
        financingResult.status === 'available' ? financingResult.requiredEquityCents : -1,
      )
    }
    expect(result.sale).toMatchObject({
      status: 'available',
      projectedSalePriceCents: expected.projectedSalePriceCents,
      sellingCostsCents: expected.sellingCostsCents,
      netSaleProceedsCents: expected.netSaleProceedsCents,
      cumulativeCashFlowCents: expected.cumulativeCashFlowCents,
      estimatedProfitBeforeTaxCents: expected.estimatedProfitBeforeTaxCents,
    })
    expect(result.annualNetColdRentCents).toBe(pd007Expected.annualNetColdRentCents)
    expect(
      result.sale.status === 'available' ? result.sale.estimatedProfitBeforeTaxCents : null,
    ).toBe(pd007Expected.estimatedProfitBeforeTaxCents)
    if (result.sale.status === 'available') {
      expect(result.sale.netSaleProceedsCents).toBe(
        result.sale.projectedSalePriceCents -
          result.sale.sellingCostsCents -
          result.sale.remainingDebtCents,
      )
      expect(result.sale.estimatedProfitBeforeTaxCents).toBe(
        result.sale.netSaleProceedsCents +
          result.sale.cumulativeCashFlowCents -
          (financingResult.status === 'available' ? financingResult.requiredEquityCents : 0),
      )
    }
  })
})
