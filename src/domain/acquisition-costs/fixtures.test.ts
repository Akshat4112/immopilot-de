import { describe, expect, it } from 'vitest'

import pd007Json from '../../../data/fixtures/pd007-v1.json'
import pd010Json from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupierJson from '../../../examples/scenarios/owner-occupier.json'
import rentalInvestmentJson from '../../../examples/scenarios/rental-investment.json'

import { calculateAcquisitionCosts } from './calculate-acquisition-costs'
import type { AcquisitionCostInput, AvailableAcquisitionCostResult, BudgetStatus } from './types'

interface Pd007AcquisitionCase {
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
}

interface Pd010Case {
  id: string
  expected: {
    acquisition: Record<string, number>
  }
}

const pd007Cases = pd007Json.cases as unknown as Pd007AcquisitionCase[]
const pd010Cases = pd010Json.cases as unknown as Pd010Case[]
const ownerOccupier = ownerOccupierJson as unknown as Scenario
const rentalInvestment = rentalInvestmentJson as unknown as Scenario

function availableResult(input: AcquisitionCostInput): AvailableAcquisitionCostResult {
  const result = calculateAcquisitionCosts(input)

  if (result.status !== 'available') {
    throw new Error('Expected an available acquisition-cost result')
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

function scenarioInput(scenario: Scenario): AcquisitionCostInput {
  return {
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
  }
}

function expectAcquisitionFixture(
  result: AvailableAcquisitionCostResult,
  expected: Record<string, number>,
): void {
  expect(result.transferTaxCents).toBe(expectedValue(expected, 'transferTaxCents'))
  expect(result.notaryCostsCents).toBe(expectedValue(expected, 'notaryCostsCents'))
  expect(result.landRegisterCostsCents).toBe(expectedValue(expected, 'landRegisterCostsCents'))
  expect(result.buyerBrokerCommissionCents).toBe(
    expectedValue(expected, 'buyerBrokerCommissionCents'),
  )
  expect(result.transactionAcquisitionCostsCents).toBe(
    expectedValue(expected, 'transactionAcquisitionCostsCents'),
  )
  expect(result.postPurchaseBudgetCents).toBe(expectedValue(expected, 'postPurchaseBudgetCents'))
  expect(result.totalProjectCostCents).toBe(expectedValue(expected, 'totalProjectCostCents'))
}

describe('PD-007 and PD-010 acquisition fixtures', () => {
  it.each(['acquisition-a-no-broker', 'acquisition-b-broker-and-financed-costs'])(
    'reproduces PD-007 fixture %s',
    (id) => {
      const fixture = pd007Cases.find((candidate) => candidate.id === id)

      if (!fixture) {
        throw new Error('PD-007 fixture not found: ' + id)
      }

      const input = fixture.input
      const result = availableResult({
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

      expectAcquisitionFixture(result, fixture.expected)
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

    expectAcquisitionFixture(availableResult(scenarioInput(scenario)), fixture.expected.acquisition)
  })
})
