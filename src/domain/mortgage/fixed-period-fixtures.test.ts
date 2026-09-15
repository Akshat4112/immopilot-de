import { describe, expect, it } from 'vitest'

import pd007 from '../../../data/fixtures/pd007-v1.json'
import pd010 from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupier from '../../../examples/scenarios/owner-occupier.json'
import { calculateAcquisitionCosts, type BudgetStatus } from '../acquisition-costs'
import { calculateFinancing } from '../financing'

import { calculateAdditionalRepaymentComparison } from './calculate-additional-repayments'
import { calculateFixedPeriodComparison } from './calculate-fixed-period'
import { calculateMortgagePayment } from './calculate-payment'

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
}

interface Pd007Case {
  id: string
  expected: { remainingDebtAtFixedPeriodCents: number }
}

interface Pd010Case {
  id: string
  expected: {
    acquisition: { loanAmountCents: number }
    mortgageBaseline: {
      remainingDebtAtFixedPeriodCents: number
      interestThroughFixedPeriodCents: number
      scheduledPrincipalThroughFixedPeriodCents: number
      additionalPrincipalThroughFixedPeriodCents: number
      projectedPayoffMonth: number
    }
    sondertilgungComparison: {
      inputOverrides: {
        annualAdditionalRepaymentCents: number
        annualAdditionalRepaymentMonth: number
      }
      withAdditionalRepayment: {
        remainingDebtAtFixedPeriodCents: number
        interestThroughFixedPeriodCents: number
        scheduledPrincipalThroughFixedPeriodCents: number
        additionalPrincipalThroughFixedPeriodCents: number
        projectedPayoffMonth: number
      }
    }
  }
}

const scenario = ownerOccupier as unknown as OwnerScenario
const pd007Cases = pd007.cases as unknown as Pd007Case[]
const pd010Cases = pd010.cases as unknown as Pd010Case[]

function ownerOccupierPayment() {
  const { property, acquisition, financing } = scenario
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

  return calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing: financingResult,
    nominalAnnualRate: financing.nominalAnnualRate,
    initialRepaymentRate: financing.initialRepaymentRate,
  })
}

describe('PD-007 / PD-010 fixed-period vectors', () => {
  it('matches the independently specified owner-occupier baseline and Sondertilgung results', () => {
    const pd007Baseline = pd007Cases.find((item) => item.id === 'mortgage-base')
    const pd007Extra = pd007Cases.find((item) => item.id === 'annual-additional-repayment')
    const pd010Owner = pd010Cases.find((item) => item.id === 'demo-owner-occupier-bw')

    if (!pd007Baseline || !pd007Extra || !pd010Owner) {
      throw new Error('Expected PD-007 / PD-010 fixed-period fixtures')
    }

    const expected = pd010Owner.expected
    const comparison = calculateAdditionalRepaymentComparison({
      payment: ownerOccupierPayment(),
      fixedInterestMonths: scenario.financing.fixedInterestMonths,
      additionalRepayments: expected.sondertilgungComparison.inputOverrides,
    })
    const result = calculateFixedPeriodComparison(comparison)

    if (result.status !== 'available') {
      throw new Error('Expected available fixed-period comparison')
    }

    expect(result.baseline).toMatchObject({
      remainingDebtCents: expected.mortgageBaseline.remainingDebtAtFixedPeriodCents,
      interestPaidCents: expected.mortgageBaseline.interestThroughFixedPeriodCents,
      scheduledPrincipalPaidCents:
        expected.mortgageBaseline.scheduledPrincipalThroughFixedPeriodCents,
      additionalPrincipalPaidCents:
        expected.mortgageBaseline.additionalPrincipalThroughFixedPeriodCents,
      projectedPayoffMonth: expected.mortgageBaseline.projectedPayoffMonth,
    })
    expect(result.withAdditionalRepayments).toMatchObject({
      remainingDebtCents:
        expected.sondertilgungComparison.withAdditionalRepayment.remainingDebtAtFixedPeriodCents,
      interestPaidCents:
        expected.sondertilgungComparison.withAdditionalRepayment.interestThroughFixedPeriodCents,
      scheduledPrincipalPaidCents:
        expected.sondertilgungComparison.withAdditionalRepayment
          .scheduledPrincipalThroughFixedPeriodCents,
      additionalPrincipalPaidCents:
        expected.sondertilgungComparison.withAdditionalRepayment
          .additionalPrincipalThroughFixedPeriodCents,
      projectedPayoffMonth:
        expected.sondertilgungComparison.withAdditionalRepayment.projectedPayoffMonth,
    })
    expect(result.baseline.remainingDebtCents).toBe(
      pd007Baseline.expected.remainingDebtAtFixedPeriodCents,
    )
    expect(result.withAdditionalRepayments.remainingDebtCents).toBe(
      pd007Extra.expected.remainingDebtAtFixedPeriodCents,
    )
    expect(result.remainingDebtReductionCents).toBe(
      expected.mortgageBaseline.remainingDebtAtFixedPeriodCents -
        expected.sondertilgungComparison.withAdditionalRepayment.remainingDebtAtFixedPeriodCents,
    )
    expect(result.baseline.scheduledPrincipalPaidCents + result.baseline.remainingDebtCents).toBe(
      expected.acquisition.loanAmountCents,
    )
    expect(
      result.withAdditionalRepayments.scheduledPrincipalPaidCents +
        result.withAdditionalRepayments.additionalPrincipalPaidCents +
        result.withAdditionalRepayments.remainingDebtCents,
    ).toBe(expected.acquisition.loanAmountCents)
  })
})
