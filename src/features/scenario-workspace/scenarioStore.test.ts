import { beforeEach, describe, expect, it } from 'vitest'

import {
  calculateScenarioWorkspace,
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  useScenarioWorkspaceStore,
} from './index'

function completePurchaseDraft() {
  return {
    ...initialPurchaseCostsDraft,
    purchasePrice: '250000',
    renovationBudget: {
      amountCents: 0,
      budgetStatus: 'confirmed-zero' as const,
    },
    movingSetupCosts: {
      amountCents: 0,
      budgetStatus: 'confirmed-zero' as const,
    },
  }
}

describe('scenario workspace', () => {
  beforeEach(() => {
    useScenarioWorkspaceStore.getState().reset()
  })

  it('keeps raw purchase and financing inputs in memory without storing calculated results', () => {
    const purchaseCosts = completePurchaseDraft()

    useScenarioWorkspaceStore.getState().setPurchaseCosts(purchaseCosts)
    useScenarioWorkspaceStore
      .getState()
      .updateFinancing({ availableEquity: '66.250', downPayment: '50.000' })

    expect(useScenarioWorkspaceStore.getState()).toMatchObject({
      purchaseCosts,
      financing: {
        availableEquity: '66.250',
        downPayment: '50.000',
      },
    })
    expect(useScenarioWorkspaceStore.getState()).not.toHaveProperty('results')
  })

  it('replaces the complete input workspace without retaining a reference to saved data', () => {
    const workspace = {
      purchaseCosts: completePurchaseDraft(),
      financing: {
        ...initialFinancingDraft,
        downPayment: '50.000',
      },
      analysis: {
        ...useScenarioWorkspaceStore.getState().analysis,
        currentComparableRent: '1.200',
      },
    }

    useScenarioWorkspaceStore.getState().replaceWorkspace(workspace)
    workspace.purchaseCosts.purchasePrice = '999999'

    expect(useScenarioWorkspaceStore.getState()).toMatchObject({
      purchaseCosts: { purchasePrice: '250000' },
      financing: { downPayment: '50.000' },
      analysis: { currentComparableRent: '1.200' },
    })
    expect(useScenarioWorkspaceStore.getState()).not.toHaveProperty('results')
  })

  it('resets annual additional repayment inputs to their Version 1 defaults', () => {
    useScenarioWorkspaceStore.getState().updateFinancing({
      additionalRepayments: {
        annualAdditionalRepayment: '5.000',
        annualAdditionalRepaymentMonth: '6',
        oneTimeAdditionalRepayments: [],
      },
    })

    useScenarioWorkspaceStore.getState().reset()

    expect(useScenarioWorkspaceStore.getState().financing.additionalRepayments).toEqual({
      annualAdditionalRepayment: '',
      annualAdditionalRepaymentMonth: '12',
      oneTimeAdditionalRepayments: [],
    })
  })

  it('composes the acquisition, financing, payment and amortization modules for a funded loan', () => {
    const result = calculateScenarioWorkspace(completePurchaseDraft(), {
      ...initialFinancingDraft,
      availableEquity: '66.250',
      downPayment: '50.000',
    })

    expect(result.acquisition).toMatchObject({
      status: 'available',
      transactionAcquisitionCostsCents: 1_625_000,
      totalProjectCostCents: 26_625_000,
    })
    expect(result.financing).toMatchObject({
      status: 'available',
      fundingStatus: 'funded',
      requiredEquityCents: 6_625_000,
      loanAmountCents: 20_000_000,
      cashGapCents: 0,
    })
    expect(result.payment).toMatchObject({
      status: 'available',
      cashPurchase: false,
      monthlyPaymentCents: 91_667,
      firstMonthInterestCents: 58_333,
      firstMonthScheduledPrincipalCents: 33_334,
    })
    expect(result.amortization).toMatchObject({
      status: 'available',
      cashPurchase: false,
      fixedInterestMonths: 120,
      remainingDebtAtFixedPeriodCents: 15_218_873,
    })
  })

  it('keeps unavailable purchase-budget results visible to downstream calculations', () => {
    const result = calculateScenarioWorkspace(
      {
        ...initialPurchaseCostsDraft,
        purchasePrice: '250000',
      },
      initialFinancingDraft,
    )

    expect(result.acquisition).toMatchObject({
      status: 'unavailable',
      reason: 'POST_PURCHASE_BUDGET_NOT_CONFIRMED',
    })
    expect(result.financing).toMatchObject({
      status: 'unavailable',
      reason: 'ACQUISITION_COSTS_UNAVAILABLE',
    })
    expect(result.payment).toMatchObject({
      status: 'unavailable',
      reason: 'FINANCING_UNAVAILABLE',
    })
  })

  it('handles a cash purchase with an empty amortization schedule', () => {
    const result = calculateScenarioWorkspace(completePurchaseDraft(), {
      ...initialFinancingDraft,
      mode: 'available-equity',
      availableEquity: '266250',
    })

    expect(result.financing).toMatchObject({
      status: 'available',
      fundingStatus: 'funded',
      loanAmountCents: 0,
    })
    expect(result.payment).toMatchObject({
      status: 'available',
      cashPurchase: true,
      monthlyPaymentCents: 0,
    })
    expect(result.amortization).toMatchObject({
      status: 'available',
      cashPurchase: true,
      rows: [],
      remainingDebtAtFixedPeriodCents: 0,
    })
  })
})
