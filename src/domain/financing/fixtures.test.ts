import { describe, expect, it } from 'vitest'

import pd007Json from '../../../data/fixtures/pd007-v1.json'
import pd010Json from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupierJson from '../../../examples/scenarios/owner-occupier.json'
import rentalInvestmentJson from '../../../examples/scenarios/rental-investment.json'
import {
  calculateAcquisitionCosts,
  type AcquisitionCostInput,
  type AvailableAcquisitionCostResult,
  type BudgetStatus,
} from '../acquisition-costs'

import { calculateFinancing } from './calculate-financing'
import type { AvailableFinancingResult } from './types'

interface FlatAcquisitionFixture {
  id: string
  input: {
    purchasePriceCents: number
    stateId: string
    notaryRate: number
    landRegisterRate: number
    brokerInvolved: boolean
    buyerBrokerRate: number
    renovationBudgetCents: number
    movingSetupCostsCents: number
    financedAcquisitionCostShare: number
    downPaymentCents: number
    availableEquityCents: number
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
  }
}

interface Pd010Case {
  id: string
  expected: {
    acquisition: Record<string, number>
  }
}

const pd007Cases = pd007Json.cases as unknown as FlatAcquisitionFixture[]
const pd010Cases = pd010Json.cases as unknown as Pd010Case[]
const ownerOccupier = ownerOccupierJson as unknown as Scenario
const rentalInvestment = rentalInvestmentJson as unknown as Scenario

function availableAcquisition(input: AcquisitionCostInput): AvailableAcquisitionCostResult {
  const result = calculateAcquisitionCosts(input)

  if (result.status !== 'available') {
    throw new Error('Expected available acquisition costs')
  }

  return result
}

function availableFinancing(
  acquisition: AvailableAcquisitionCostResult,
  downPaymentCents: number,
  availableEquityCents: number,
  financedAcquisitionCostShare: number,
): AvailableFinancingResult {
  const result = calculateFinancing({
    mode: 'selected-down-payment',
    acquisition,
    downPaymentCents,
    availableEquityCents,
    financedAcquisitionCostShare,
  })

  if (result.status !== 'available') {
    throw new Error('Expected available financing')
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

function expectFinancingFixture(
  result: AvailableFinancingResult,
  expected: Record<string, number>,
): void {
  expect(result.financedAcquisitionCostsCents).toBe(
    expectedValue(expected, 'financedAcquisitionCostsCents'),
  )
  expect(result.requiredEquityCents).toBe(expectedValue(expected, 'requiredEquityCents'))
  expect(result.loanAmountCents).toBe(expectedValue(expected, 'loanAmountCents'))
  expect(result.cashRemainingCents).toBe(expectedValue(expected, 'cashRemainingCents'))
  expect(result.purchasePriceFinancingRatio.toNumber()).toBeCloseTo(
    expectedValue(expected, 'loanToPurchasePriceRatio'),
    14,
  )
  const expectedGap = expected.cashGapCents

  if (expectedGap !== undefined) {
    expect(result.cashGapCents).toBe(expectedGap)
  }
}

function scenarioAcquisition(scenario: Scenario): AvailableAcquisitionCostResult {
  return availableAcquisition({
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
}

describe('PD-007 and PD-010 financing fixtures', () => {
  it.each(['acquisition-a-no-broker', 'acquisition-b-broker-and-financed-costs'])(
    'reproduces PD-007 fixture %s',
    (id) => {
      const fixture = pd007Cases.find((candidate) => candidate.id === id)

      if (!fixture) {
        throw new Error('PD-007 fixture not found: ' + id)
      }

      const input = fixture.input
      const acquisition = availableAcquisition({
        purchasePriceCents: input.purchasePriceCents,
        stateId: input.stateId,
        brokerInvolved: input.brokerInvolved,
        rateOverrides: {
          notaryRate: input.notaryRate,
          landRegisterRate: input.landRegisterRate,
          buyerBrokerRate: input.buyerBrokerRate,
        },
        renovationBudget: {
          amountCents: input.renovationBudgetCents,
          budgetStatus: input.renovationBudgetCents === 0 ? 'confirmed-zero' : 'budgeted',
        },
        movingSetupCosts: {
          amountCents: input.movingSetupCostsCents,
          budgetStatus: input.movingSetupCostsCents === 0 ? 'confirmed-zero' : 'budgeted',
        },
      })
      const result = availableFinancing(
        acquisition,
        input.downPaymentCents,
        input.availableEquityCents,
        input.financedAcquisitionCostShare,
      )

      expectFinancingFixture(result, fixture.expected)
    },
  )

  it.each([
    ['demo-owner-occupier-bw', ownerOccupier],
    ['demo-rental-investment-bw', rentalInvestment],
  ] as const)('reproduces PD-010 fixture %s', (id, scenario) => {
    const fixture = pd010Cases.find((candidate) => candidate.id === id)

    if (!fixture) {
      throw new Error('PD-010 fixture not found: ' + id)
    }

    const result = availableFinancing(
      scenarioAcquisition(scenario),
      scenario.financing.downPaymentCents,
      scenario.financing.availableEquityCents,
      scenario.financing.financedAcquisitionCostShare,
    )

    expectFinancingFixture(result, fixture.expected.acquisition)
  })
})
