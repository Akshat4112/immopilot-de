import { describe, expect, it } from 'vitest'

import fixtureSetJson from '../../../data/fixtures/pd007-v1.json'

import { moneyCents, multiplyMoney } from './money'
import { addRates, initialRepaymentRate, nominalAnnualRate, proportionRate } from './rates'
import { safeDivide } from './rounding'

interface NumericFixtureCase {
  id: string
  input: Record<string, number>
  expected: Record<string, number>
}

interface FixtureSet {
  fixtureSetVersion: string
  calculationSpecificationVersion: string
  moneyUnit: string
  rateUnit: string
  roundingMode: string
  cases: Array<Record<string, unknown>>
}

const fixtureSet = fixtureSetJson as unknown as FixtureSet

function numericFixture(id: string): NumericFixtureCase {
  const fixture = fixtureSet.cases.find((candidate) => candidate.id === id)

  if (!fixture) {
    throw new Error(`PD-007 fixture not found: ${id}`)
  }

  return fixture as unknown as NumericFixtureCase
}

describe('PD-007 primitive fixture compatibility', () => {
  it('uses the declared Version 1 money, rate and rounding units', () => {
    expect(fixtureSet).toMatchObject({
      fixtureSetVersion: '1.0.0',
      calculationSpecificationVersion: '1.0.0',
      moneyUnit: 'cent',
      rateUnit: 'decimal',
      roundingMode: 'half-up',
    })
  })

  it('reproduces acquisition-cost line and financed-share boundaries', () => {
    const fixture = numericFixture('acquisition-b-broker-and-financed-costs')
    const purchasePrice = moneyCents(fixture.input.purchasePriceCents)
    const brokerRate = proportionRate(fixture.input.buyerBrokerRate)
    const brokerCommission = multiplyMoney(purchasePrice, brokerRate)

    expect(brokerCommission).toBe(fixture.expected.buyerBrokerCommissionCents)

    const transactionCosts = moneyCents(fixture.expected.transactionAcquisitionCostsCents)
    const financedShare = proportionRate(fixture.input.financedAcquisitionCostShare)

    expect(multiplyMoney(transactionCosts, financedShare)).toBe(
      fixture.expected.financedAcquisitionCostsCents,
    )
  })

  it('reproduces the mortgage contractual annuity boundary', () => {
    const fixture = numericFixture('mortgage-base')
    const principal = moneyCents(fixture.input.principalCents)
    const combinedAnnualRate = addRates([
      nominalAnnualRate(fixture.input.nominalAnnualRate),
      initialRepaymentRate(fixture.input.initialRepaymentRate),
    ])
    const monthlyRate = safeDivide(combinedAnnualRate, 12)

    expect(multiplyMoney(principal, monthlyRate)).toBe(
      fixture.expected.contractualMonthlyPaymentCents,
    )
  })
})
