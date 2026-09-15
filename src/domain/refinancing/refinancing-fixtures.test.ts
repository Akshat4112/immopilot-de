import { describe, expect, it } from 'vitest'

import pd007 from '../../../data/fixtures/pd007-v1.json'
import pd010 from '../../../data/fixtures/pd010-expected-results.json'
import ownerOccupier from '../../../examples/scenarios/owner-occupier.json'
import { calculateAcquisitionCosts, type BudgetStatus } from '../acquisition-costs'
import { calculateFinancing } from '../financing'
import { calculateAdditionalRepaymentComparison } from '../mortgage/calculate-additional-repayments'
import { calculateFixedPeriodComparison } from '../mortgage/calculate-fixed-period'
import { calculateMortgagePayment } from '../mortgage/calculate-payment'

import { calculateRefinancingStress } from './calculate-refinancing'
import type { InitialRepaymentRefinancingScenario } from './types'

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
    refinancingScenarios: readonly {
      id: string
      nominalAnnualRate: number
      initialRepaymentRate: number
    }[]
  }
}

interface ExpectedRefinancingScenario {
  id?: string
  nominalAnnualRate: number
  initialRepaymentRate?: number
  futureMonthlyPaymentCents: number
  monthlyPaymentChangeCents: number
}

interface Pd010Case {
  id: string
  expected: {
    acquisition: { loanAmountCents: number }
    mortgageBaseline: {
      contractualMonthlyPaymentCents: number
      remainingDebtAtFixedPeriodCents: number
    }
    sondertilgungComparison: {
      inputOverrides: {
        annualAdditionalRepaymentCents: number
        annualAdditionalRepaymentMonth: number
      }
      withAdditionalRepayment: { remainingDebtAtFixedPeriodCents: number }
    }
    refinancingBaseline: readonly ExpectedRefinancingScenario[]
    refinancingAfterSondertilgung: readonly ExpectedRefinancingScenario[]
  }
}

interface Pd007Case {
  id: string
  input: {
    remainingDebtCents: number
    currentMonthlyPaymentCents: number
    initialRepaymentRate: number
  }
  expectedScenarios: readonly ExpectedRefinancingScenario[]
}

const scenario = ownerOccupier as unknown as OwnerScenario
const pd010Cases = pd010.cases as unknown as Pd010Case[]
const pd007Cases = pd007.cases as unknown as Pd007Case[]

function ownerPayment() {
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

function refinancingInputs(): readonly InitialRepaymentRefinancingScenario[] {
  return scenario.financing.refinancingScenarios.map((future) => ({
    id: future.id,
    paymentMode: 'initial-repayment-rate',
    futureNominalAnnualRate: future.nominalAnnualRate,
    futureInitialRepaymentRate: future.initialRepaymentRate,
  }))
}

describe('PD-007 and PD-010 refinancing fixtures', () => {
  it('reproduces baseline and Sondertilgung stress vectors from the actual CF-007 balances', () => {
    const expectedOwner = pd010Cases.find((item) => item.id === 'demo-owner-occupier-bw')
    const pd007Stress = pd007Cases.find((item) => item.id === 'refinancing-stress')

    if (!expectedOwner || !pd007Stress) {
      throw new Error('Required PD-007 / PD-010 refinancing fixtures are missing')
    }

    const payment = ownerPayment()

    if (payment.status !== 'available' || payment.cashPurchase) {
      throw new Error('Expected available financed owner-occupier payment')
    }

    const comparison = calculateAdditionalRepaymentComparison({
      payment,
      fixedInterestMonths: scenario.financing.fixedInterestMonths,
      additionalRepayments: expectedOwner.expected.sondertilgungComparison.inputOverrides,
    })
    const fixed = calculateFixedPeriodComparison(comparison)

    if (fixed.status !== 'available') {
      throw new Error('Expected available fixed-period results')
    }

    const currentPayment = payment.monthlyPaymentCents
    const futureScenarios = refinancingInputs()
    const baseline = calculateRefinancingStress({
      fixedPeriod: fixed.baseline,
      currentContractualMonthlyPaymentCents: currentPayment,
      scenarios: futureScenarios,
    })
    const afterExtra = calculateRefinancingStress({
      fixedPeriod: fixed.withAdditionalRepayments,
      currentContractualMonthlyPaymentCents: currentPayment,
      scenarios: futureScenarios,
    })

    if (baseline.status !== 'available' || afterExtra.status !== 'available') {
      throw new Error('Expected available baseline and Sondertilgung stress results')
    }

    expect(currentPayment).toBe(
      expectedOwner.expected.mortgageBaseline.contractualMonthlyPaymentCents,
    )
    expect(baseline.remainingDebtCents).toBe(
      expectedOwner.expected.mortgageBaseline.remainingDebtAtFixedPeriodCents,
    )
    expect(afterExtra.remainingDebtCents).toBe(
      expectedOwner.expected.sondertilgungComparison.withAdditionalRepayment
        .remainingDebtAtFixedPeriodCents,
    )
    expect(baseline.remainingDebtCents).toBe(pd007Stress.input.remainingDebtCents)
    expect(currentPayment).toBe(pd007Stress.input.currentMonthlyPaymentCents)

    expectedOwner.expected.refinancingBaseline.forEach((expected, index) => {
      const actual = baseline.scenarios[index]
      const pd007Expected = pd007Stress.expectedScenarios[index]

      expect(actual).toMatchObject({
        id: expected.id,
        futureMonthlyPaymentCents: expected.futureMonthlyPaymentCents,
        monthlyPaymentChangeCents: expected.monthlyPaymentChangeCents,
      })
      expect(actual?.futureMonthlyPaymentCents).toBe(pd007Expected?.futureMonthlyPaymentCents)
      expect(actual?.monthlyPaymentChangeCents).toBe(pd007Expected?.monthlyPaymentChangeCents)
    })

    expectedOwner.expected.refinancingAfterSondertilgung.forEach((expected, index) => {
      expect(afterExtra.scenarios[index]).toMatchObject({
        id: expected.id,
        futureMonthlyPaymentCents: expected.futureMonthlyPaymentCents,
        monthlyPaymentChangeCents: expected.monthlyPaymentChangeCents,
      })
    })
  })
})
