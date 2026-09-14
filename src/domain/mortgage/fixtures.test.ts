import { describe, expect, it } from 'vitest'

import pd007Json from '../../../data/fixtures/pd007-v1.json'
import pd010Json from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupierJson from '../../../examples/scenarios/owner-occupier.json'
import rentalInvestmentJson from '../../../examples/scenarios/rental-investment.json'
import {
  calculateAcquisitionCosts,
  type AvailableAcquisitionCostResult,
  type BudgetStatus,
} from '../acquisition-costs'
import { calculateFinancing, type AvailableFinancingResult } from '../financing'

import { calculateMortgagePayment } from './calculate-payment'
import type { InitialRepaymentMortgagePaymentResult } from './types'

interface MortgageFixture {
  id: string
  input: {
    principalCents: number
    nominalAnnualRate: number
    initialRepaymentRate: number
  }
  expected: Record<string, number>
}

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
  }
}

interface Pd010Case {
  id: string
  expected: {
    mortgageBaseline: Record<string, number>
  }
}

const pd007Cases = pd007Json.cases as unknown as MortgageFixture[]
const pd010Cases = pd010Json.cases as unknown as Pd010Case[]
const ownerOccupier = ownerOccupierJson as unknown as Scenario
const rentalInvestment = rentalInvestmentJson as unknown as Scenario

function scenarioAcquisition(scenario: Scenario): AvailableAcquisitionCostResult {
  const result = calculateAcquisitionCosts({
    purchasePriceCents: scenario.property.purchasePriceCents,
    stateId: scenario.property.stateId,
    brokerInvolved: scenario.acquisition.broker.involved,
    rateOverrides: {
      transferTaxRate: scenario.acquisition.transferTaxRate.value,
      notaryRate: scenario.acquisition.notaryRate.value,
      landRegisterRate: scenario.acquisition.landRegisterRate.value,
      buyerBrokerRate: scenario.acquisition.broker.buyerCommissionRate.value,
    },
    renovationBudget: scenario.acquisition.renovationBudget,
    movingSetupCosts: scenario.acquisition.movingSetupCosts,
  })

  if (result.status !== 'available') {
    throw new Error('Expected available acquisition costs')
  }

  return result
}

function scenarioFinancing(scenario: Scenario): AvailableFinancingResult {
  const result = calculateFinancing({
    mode: 'selected-down-payment',
    acquisition: scenarioAcquisition(scenario),
    availableEquityCents: scenario.financing.availableEquityCents,
    downPaymentCents: scenario.financing.downPaymentCents,
    financedAcquisitionCostShare: scenario.financing.financedAcquisitionCostShare,
  })

  if (result.status !== 'available') {
    throw new Error('Expected available financing')
  }

  return result
}

function scenarioMortgage(scenario: Scenario): InitialRepaymentMortgagePaymentResult {
  const result = calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing: scenarioFinancing(scenario),
    nominalAnnualRate: scenario.financing.nominalAnnualRate,
    initialRepaymentRate: scenario.financing.initialRepaymentRate,
  })

  if (
    result.status !== 'available' ||
    result.cashPurchase ||
    result.paymentMode !== 'initial-repayment-rate'
  ) {
    throw new Error('Expected available initial-repayment mortgage')
  }

  return result
}

function expectedValue(expected: Record<string, number>, key: string): number {
  const value = expected[key]

  if (value === undefined) {
    throw new Error('Expected fixture value not found: ' + key)
  }

  return value
}

function expectPaymentFixture(
  result: InitialRepaymentMortgagePaymentResult,
  expected: Record<string, number>,
): void {
  expect(result.monthlyPaymentCents).toBe(expectedValue(expected, 'contractualMonthlyPaymentCents'))
  expect(result.firstMonthInterestCents).toBe(expectedValue(expected, 'month1InterestCents'))
  expect(result.firstMonthScheduledPrincipalCents).toBe(
    expectedValue(expected, 'month1ScheduledPrincipalCents'),
  )
}

describe('PD-007 and PD-010 mortgage payment fixtures', () => {
  it('reproduces the PD-007 mortgage-base vector through CF-002 and CF-003', () => {
    const fixture = pd007Cases.find((candidate) => candidate.id === 'mortgage-base')

    if (!fixture) {
      throw new Error('PD-007 mortgage fixture not found')
    }

    const result = scenarioMortgage(ownerOccupier)

    expect(result.principalCents).toBe(fixture.input.principalCents)
    expect(result.nominalAnnualRate.toNumber()).toBe(fixture.input.nominalAnnualRate)
    expect(result.initialRepaymentRate.toNumber()).toBe(fixture.input.initialRepaymentRate)
    expectPaymentFixture(result, fixture.expected)
  })

  it.each([
    ['demo-owner-occupier-bw', ownerOccupier],
    ['demo-rental-investment-bw', rentalInvestment],
  ] as const)('reproduces PD-010 fixture %s', (id, scenario) => {
    const fixture = pd010Cases.find((candidate) => candidate.id === id)

    if (!fixture) {
      throw new Error('PD-010 fixture not found: ' + id)
    }

    expectPaymentFixture(scenarioMortgage(scenario), fixture.expected.mortgageBaseline)
  })
})
