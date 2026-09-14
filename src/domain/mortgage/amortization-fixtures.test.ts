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

import type { MortgageAmortizationScheduleResult } from './amortization-types'
import { calculateAmortizationSchedule } from './calculate-amortization'
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

interface ScheduleFixture {
  id: string
  expected: Record<string, number>
}

interface Pd010Fixture {
  id: string
  expected: {
    mortgageBaseline: Record<string, number>
  }
}

const ownerOccupier = ownerOccupierJson as unknown as Scenario
const rentalInvestment = rentalInvestmentJson as unknown as Scenario
const pd007Cases = pd007Json.cases as unknown as ScheduleFixture[]
const pd010Cases = pd010Json.cases as unknown as Pd010Fixture[]

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
    financedAcquisitionCostShare:
      scenario.financing.financedAcquisitionCostShare,
  })

  if (result.status !== 'available') {
    throw new Error('Expected available financing')
  }

  return result
}

function scenarioSchedule(scenario: Scenario): MortgageAmortizationScheduleResult {
  const payment = calculateMortgagePayment({
    paymentMode: 'initial-repayment-rate',
    financing: scenarioFinancing(scenario),
    nominalAnnualRate: scenario.financing.nominalAnnualRate,
    initialRepaymentRate: scenario.financing.initialRepaymentRate,
  })

  const schedule = calculateAmortizationSchedule({
    payment,
    fixedInterestMonths: scenario.financing.fixedInterestMonths,
    selectedMonth: scenario.financing.fixedInterestMonths,
  })

  if (schedule.status !== 'available' || schedule.cashPurchase) {
    throw new Error('Expected available mortgage amortization schedule')
  }

  return schedule
}

function expectedValue(expected: Record<string, number>, key: string): number {
  const value = expected[key]

  if (value === undefined) {
    throw new Error('Expected fixture value not found: ' + key)
  }

  return value
}

function expectScheduleFixture(
  result: MortgageAmortizationScheduleResult,
  expected: Record<string, number>,
): void {
  const first = result.rows[0]

  expect(result.contractualMonthlyPaymentCents).toBe(
    expectedValue(expected, 'contractualMonthlyPaymentCents'),
  )
  expect(first?.interestCents).toBe(
    expectedValue(expected, 'month1InterestCents'),
  )
  expect(first?.scheduledPrincipalCents).toBe(
    expectedValue(expected, 'month1ScheduledPrincipalCents'),
  )
  expect(first?.closingBalanceCents).toBe(
    expectedValue(expected, 'month1ClosingBalanceCents'),
  )
  expect(result.interestThroughFixedPeriodCents).toBe(
    expectedValue(expected, 'interestThroughFixedPeriodCents'),
  )
  expect(result.scheduledPrincipalThroughFixedPeriodCents).toBe(
    expectedValue(expected, 'scheduledPrincipalThroughFixedPeriodCents'),
  )
  expect(result.remainingDebtAtFixedPeriodCents).toBe(
    expectedValue(expected, 'remainingDebtAtFixedPeriodCents'),
  )
  expect(result.payoffMonth).toBe(
    expectedValue(expected, 'projectedPayoffMonth'),
  )
  expect(result.projectedLifetimeInterestCents).toBe(
    expectedValue(expected, 'projectedLifetimeInterestCents'),
  )
}

describe('PD-007 and PD-010 amortization fixtures', () => {
  it('reproduces the complete PD-007 mortgage schedule vector', () => {
    const fixture = pd007Cases.find(
      (candidate) => candidate.id === 'mortgage-base',
    )

    if (!fixture) {
      throw new Error('PD-007 mortgage schedule fixture not found')
    }

    expectScheduleFixture(scenarioSchedule(ownerOccupier), fixture.expected)
  })

  it.each([
    ['demo-owner-occupier-bw', ownerOccupier],
    ['demo-rental-investment-bw', rentalInvestment],
  ] as const)('reproduces PD-010 schedule fixture %s', (id, scenario) => {
    const fixture = pd010Cases.find((candidate) => candidate.id === id)

    if (!fixture) {
      throw new Error('PD-010 mortgage schedule fixture not found: ' + id)
    }

    const result = scenarioSchedule(scenario)

    expectScheduleFixture(result, fixture.expected.mortgageBaseline)
    expect(result.firstYearInterestCents).toBe(
      expectedValue(
        fixture.expected.mortgageBaseline,
        'firstYearInterestCents',
      ),
    )
    expect(result.firstYearScheduledPrincipalCents).toBe(
      expectedValue(
        fixture.expected.mortgageBaseline,
        'firstYearScheduledPrincipalCents',
      ),
    )
    expect(result.additionalPrincipalThroughFixedPeriodCents).toBe(
      expectedValue(
        fixture.expected.mortgageBaseline,
        'additionalPrincipalThroughFixedPeriodCents',
      ),
    )
  })
})
