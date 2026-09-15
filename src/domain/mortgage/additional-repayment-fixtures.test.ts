import { describe, expect, it } from 'vitest'

import pd007Json from '../../../data/fixtures/pd007-v1.json'
import pd010Json from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupierJson from '../../../examples/scenarios/owner-occupier.json'
import { calculateAcquisitionCosts, type BudgetStatus } from '../acquisition-costs'
import { calculateFinancing } from '../financing'

import { calculateAdditionalRepaymentComparison } from './calculate-additional-repayments'
import { calculateMortgagePayment } from './calculate-payment'

interface Scenario {
  property: {
    purchasePriceCents: number
    stateId: string
  }
  acquisition: {
    transferTaxRate: { value: number }
    notaryRate: { value: number }
    landRegisterRate: { value: number }
    broker: {
      involved: boolean
      buyerCommissionRate: { value: number }
    }
    renovationBudget: {
      amountCents: number
      budgetStatus: BudgetStatus
    }
    movingSetupCosts: {
      amountCents: number
      budgetStatus: BudgetStatus
    }
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

interface Pd007Fixture {
  id: string
  input: {
    annualAdditionalRepaymentCents: number
    annualAdditionalRepaymentMonth: number
  }
  expected: Record<string, number>
}

interface Pd010Fixture {
  id: string
  expected: {
    sondertilgungComparison: {
      inputOverrides: {
        annualAdditionalRepaymentCents: number
        annualAdditionalRepaymentMonth: number
      }
      withAdditionalRepayment: Record<string, number>
      interestSavedThroughFixedPeriodCents: number
      projectedLifetimeInterestSavedCents: number
      timeSavedMonths: number
    }
  }
}

const ownerOccupier = ownerOccupierJson as unknown as Scenario
const pd007Cases = pd007Json.cases as unknown as Pd007Fixture[]
const pd010Cases = pd010Json.cases as unknown as Pd010Fixture[]

function ownerOccupierPayment() {
  const acquisition = calculateAcquisitionCosts({
    purchasePriceCents: ownerOccupier.property.purchasePriceCents,
    stateId: ownerOccupier.property.stateId,
    brokerInvolved: ownerOccupier.acquisition.broker.involved,
    rateOverrides: {
      transferTaxRate: ownerOccupier.acquisition.transferTaxRate.value,
      notaryRate: ownerOccupier.acquisition.notaryRate.value,
      landRegisterRate: ownerOccupier.acquisition.landRegisterRate.value,
      buyerBrokerRate: ownerOccupier.acquisition.broker.buyerCommissionRate.value,
    },
    renovationBudget: ownerOccupier.acquisition.renovationBudget,
    movingSetupCosts: ownerOccupier.acquisition.movingSetupCosts,
  })
  const financing = calculateFinancing({
    mode: 'selected-down-payment',
    acquisition,
    availableEquityCents: ownerOccupier.financing.availableEquityCents,
    downPaymentCents: ownerOccupier.financing.downPaymentCents,
    financedAcquisitionCostShare: ownerOccupier.financing.financedAcquisitionCostShare,
  })
  const payment = calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing,
    nominalAnnualRate: ownerOccupier.financing.nominalAnnualRate,
    initialRepaymentRate: ownerOccupier.financing.initialRepaymentRate,
  })

  if (payment.status !== 'available' || payment.cashPurchase) {
    throw new Error('Expected available owner-occupier mortgage payment')
  }

  return payment
}

function expectedValue(expected: Record<string, number>, key: string): number {
  const value = expected[key]

  if (value === undefined) {
    throw new Error('Expected fixture value not found: ' + key)
  }

  return value
}

function expectSondertilgungSchedule(
  actual: {
    interestThroughFixedPeriodCents: number
    scheduledPrincipalThroughFixedPeriodCents: number
    additionalPrincipalThroughFixedPeriodCents: number
    remainingDebtAtFixedPeriodCents: number
    payoffMonth: number
    projectedLifetimeInterestCents: number
  },
  expected: Record<string, number>,
): void {
  expect(actual.interestThroughFixedPeriodCents).toBe(
    expectedValue(expected, 'interestThroughFixedPeriodCents'),
  )
  expect(actual.remainingDebtAtFixedPeriodCents).toBe(
    expectedValue(expected, 'remainingDebtAtFixedPeriodCents'),
  )
  expect(actual.additionalPrincipalThroughFixedPeriodCents).toBe(
    expectedValue(expected, 'additionalPrincipalThroughFixedPeriodCents'),
  )
  expect(actual.payoffMonth).toBe(expectedValue(expected, 'projectedPayoffMonth'))
  expect(actual.projectedLifetimeInterestCents).toBe(
    expectedValue(expected, 'projectedLifetimeInterestCents'),
  )

  if (expected.scheduledPrincipalThroughFixedPeriodCents !== undefined) {
    expect(actual.scheduledPrincipalThroughFixedPeriodCents).toBe(
      expected.scheduledPrincipalThroughFixedPeriodCents,
    )
  }
}

describe('PD-007 and PD-010 Sondertilgung fixtures', () => {
  it('reproduces the PD-007 annual €5,000 repayment vector', () => {
    const fixture = pd007Cases.find((candidate) => candidate.id === 'annual-additional-repayment')

    if (!fixture) {
      throw new Error('PD-007 annual additional-repayment fixture not found')
    }

    const result = calculateAdditionalRepaymentComparison({
      payment: ownerOccupierPayment(),
      fixedInterestMonths: ownerOccupier.financing.fixedInterestMonths,
      additionalRepayments: fixture.input,
    })

    if (result.status !== 'available') {
      throw new Error('Expected available PD-007 comparison')
    }

    expectSondertilgungSchedule(result.withAdditionalRepayments, fixture.expected)
    expect(result.interestSavedThroughFixedPeriodCents).toBe(
      expectedValue(fixture.expected, 'interestSavedThroughFixedPeriodCents'),
    )
    expect(result.projectedLifetimeInterestSavedCents).toBe(
      expectedValue(fixture.expected, 'projectedLifetimeInterestSavedCents'),
    )
    expect(result.timeSavedMonths).toBe(expectedValue(fixture.expected, 'timeSavedMonths'))
  })

  it('reproduces the complete PD-010 owner-occupier comparison', () => {
    const fixture = pd010Cases.find((candidate) => candidate.id === 'demo-owner-occupier-bw')

    if (!fixture) {
      throw new Error('PD-010 owner-occupier fixture not found')
    }

    const expected = fixture.expected.sondertilgungComparison
    const result = calculateAdditionalRepaymentComparison({
      payment: ownerOccupierPayment(),
      fixedInterestMonths: ownerOccupier.financing.fixedInterestMonths,
      additionalRepayments: expected.inputOverrides,
    })

    if (result.status !== 'available') {
      throw new Error('Expected available PD-010 comparison')
    }

    expectSondertilgungSchedule(result.withAdditionalRepayments, expected.withAdditionalRepayment)
    expect(result).toMatchObject({
      interestSavedThroughFixedPeriodCents: expected.interestSavedThroughFixedPeriodCents,
      projectedLifetimeInterestSavedCents: expected.projectedLifetimeInterestSavedCents,
      timeSavedMonths: expected.timeSavedMonths,
    })
  })
})
