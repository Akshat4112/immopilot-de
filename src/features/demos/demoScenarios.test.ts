import { describe, expect, it } from 'vitest'

import { calculateScenarioDashboard } from '../scenario-workspace'
import { createDemoWorkspace } from './demoScenarios'

describe('PF-007.1 canonical demo workspace adapters', () => {
  it('loads the published owner-occupier example through the validated draft schema', () => {
    const inputs = createDemoWorkspace('owner-occupier')
    expect(inputs.purchaseCosts).toMatchObject({
      purchasePrice: '250000',
      stateId: 'DE-BW',
      brokerInvolved: false,
      rateOverrides: {},
      renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    })
    expect(inputs.financing).toMatchObject({
      availableEquity: '66250',
      downPayment: '50000',
      nominalAnnualRate: '3,5',
      initialRepaymentRate: '2',
      fixedInterestYears: '10',
    })
    expect(inputs.analysis).toMatchObject({
      propertyUse: 'owner-occupier',
      currentComparableRent: '1000',
      monthlyOwnerCosts: '250',
      ownerCostGrowthRate: '0',
      livingAreaSquareMetres: '65',
    })

    const output = calculateScenarioDashboard(
      inputs.purchaseCosts,
      inputs.financing,
      inputs.analysis,
    )
    expect(output.acquisition).toMatchObject({
      status: 'available',
      totalProjectCostCents: 26_625_000,
    })
    expect(output.financing).toMatchObject({
      status: 'available',
      loanAmountCents: 20_000_000,
    })
    expect(output.payment).toMatchObject({ status: 'available', monthlyPaymentCents: 91_667 })
    expect(output.amortization).toMatchObject({
      status: 'available',
      remainingDebtAtFixedPeriodCents: 15_218_873,
    })
    expect(output.modeSpecific).toMatchObject({
      mode: 'owner-occupier',
      result: { status: 'available' },
    })
  })

  it('loads the canonical rental scenario with confirmed budgets and negative-cash-flow inputs', () => {
    const inputs = createDemoWorkspace('rental-investment')
    expect(inputs.purchaseCosts).toMatchObject({
      purchasePrice: '240000',
      renovationBudget: { amountCents: 1_000_000, budgetStatus: 'budgeted' },
      movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    })
    expect(inputs.analysis).toMatchObject({
      propertyUse: 'rental-investment',
      monthlyNetColdRent: '1000',
      monthlyNonRecoverableHausgeld: '150',
      annualMaintenanceAllowance: '1200',
      vacancyRate: '5',
      rentalRentGrowthRate: '0',
      rentalOwnerCostGrowthRate: '0',
      targetGrossYield: '4,5',
      targetNetYield: '3,5',
    })

    const output = calculateScenarioDashboard(
      inputs.purchaseCosts,
      inputs.financing,
      inputs.analysis,
    )
    expect(output.acquisition).toMatchObject({
      status: 'available',
      totalProjectCostCents: 26_560_000,
    })
    expect(output.financing).toMatchObject({
      status: 'available',
      loanAmountCents: 19_200_000,
    })
    expect(output.payment).toMatchObject({ status: 'available', monthlyPaymentCents: 88_000 })
    expect(output.amortization).toMatchObject({
      status: 'available',
      remainingDebtAtFixedPeriodCents: 14_610_159,
    })
    expect(output.modeSpecific).toMatchObject({
      mode: 'rental-investment',
      result: { status: 'available' },
    })
  })

  it('returns isolated inputs without mutating either published fixture', () => {
    const first = createDemoWorkspace('owner-occupier')
    first.purchaseCosts.purchasePrice = '1'
    first.financing.additionalRepayments.annualAdditionalRepaymentMonth = '6'

    const second = createDemoWorkspace('owner-occupier')
    expect(second.purchaseCosts.purchasePrice).toBe('250000')
    expect(second.financing.additionalRepayments.annualAdditionalRepaymentMonth).toBe('12')
  })
})
