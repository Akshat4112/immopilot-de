import { describe, expect, it } from 'vitest'

import pd010 from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupier from '../../../examples/scenarios/owner-occupier.json'
import { calculateAcquisitionCosts, type BudgetStatus } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { calculateAmortizationSchedule, calculateMortgagePayment } from '../mortgage'
import { calculateRentVersusBuy } from './calculate-rent-versus-buy'

interface OwnerScenario {
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
  ownerOccupier: {
    currentComparableRentCents: number
    monthlyOwnerCostsCents: number
    rentGrowthRate: number
    ownerCostGrowthRate: number
    propertyAppreciationRate: number
    alternativeReturnRate: number
    sellingCostRate: number
    analysisMonths: number
    includeAdditionalRepaymentsInMatchedBudget: boolean
  }
}

interface RentVersusBuyFixture {
  analysisMonth: number
  projectedPropertyValueCents: number
  remainingMortgageDebtCents: number
  buyerAlternativePortfolioCents: number
  buyerNetWealthCents: number
  renterNetWealthCents: number
  buyerMinusRenterCents: number
  firstBreakEvenMonth: number
  breakEvenYear: number
  year5BuyerNetWealthCents: number
  year5RenterNetWealthCents: number
  year6BuyerNetWealthCents: number
  year6RenterNetWealthCents: number
}

const scenario = ownerOccupier as unknown as OwnerScenario
const fixture = (
  pd010.cases as unknown as {
    id: string
    expected: { rentVersusBuy?: RentVersusBuyFixture }
  }[]
).find((entry) => entry.id === 'demo-owner-occupier-bw')?.expected.rentVersusBuy

describe('PD-010 matched-budget owner-occupier vectors', () => {
  it('reproduces the 120-month endpoint and first break-even boundary without a second schedule', () => {
    if (!fixture) throw new Error('Missing PD-010 owner-occupier rent-versus-buy fixture')
    const { property, acquisition, financing, ownerOccupier: options } = scenario
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
    const result = calculateRentVersusBuy({ financing: financingResult, amortization, ...options })
    if (result.status !== 'available')
      throw new Error(`Rent-versus-buy unavailable: ${result.reason}`)

    expect(result.atAnalysisMonth).toMatchObject({
      month: fixture.analysisMonth,
      projectedPropertyValueCents: fixture.projectedPropertyValueCents,
      remainingMortgageDebtCents: fixture.remainingMortgageDebtCents,
      buyerAlternativePortfolioCents: fixture.buyerAlternativePortfolioCents,
      buyerNetWealthCents: fixture.buyerNetWealthCents,
      renterNetWealthCents: fixture.renterNetWealthCents,
      buyerMinusRenterCents: fixture.buyerMinusRenterCents,
    })
    expect(result.rows[59]).toMatchObject({
      buyerNetWealthCents: fixture.year5BuyerNetWealthCents,
      renterNetWealthCents: fixture.year5RenterNetWealthCents,
    })
    expect(result.rows[71]).toMatchObject({
      buyerNetWealthCents: fixture.year6BuyerNetWealthCents,
      renterNetWealthCents: fixture.year6RenterNetWealthCents,
    })
    expect(result.breakEven).toEqual({
      status: 'reached',
      firstMonth: fixture.firstBreakEvenMonth,
      year: fixture.breakEvenYear,
    })
    expect(result.rows[fixture.firstBreakEvenMonth - 2]?.buyerMinusRenterCents).toBeLessThan(0)
    expect(
      result.rows[fixture.firstBreakEvenMonth - 1]?.buyerMinusRenterCents,
    ).toBeGreaterThanOrEqual(0)
  })
})
