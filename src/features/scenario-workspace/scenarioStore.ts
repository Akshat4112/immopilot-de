import { create } from 'zustand'

import type { BudgetStatus } from '../../domain/acquisition-costs'
import type { FinancingMode } from '../../domain/financing'
import type { GermanStateId } from '../../domain/acquisition-costs'

export interface PurchaseCostRateOverridesDraft {
  transferTaxRate?: string
  notaryRate?: string
  landRegisterRate?: string
  buyerBrokerRate?: string
}

export interface PostPurchaseBudgetDraft {
  amountCents: number
  budgetStatus: BudgetStatus
}

export interface PurchaseCostsDraft {
  purchasePrice: string
  stateId: GermanStateId
  brokerInvolved: boolean
  rateOverrides?: PurchaseCostRateOverridesDraft
  renovationBudget?: PostPurchaseBudgetDraft
  movingSetupCosts?: PostPurchaseBudgetDraft
}

export interface FinancingDraft {
  mode: FinancingMode
  availableEquity: string
  downPayment: string
  financedAcquisitionCostShare: string
  nominalAnnualRate: string
  initialRepaymentRate: string
  fixedInterestYears: string
}

export interface ScenarioWorkspaceState {
  purchaseCosts: PurchaseCostsDraft
  financing: FinancingDraft
  setPurchaseCosts: (purchaseCosts: PurchaseCostsDraft) => void
  updateFinancing: (financing: Partial<FinancingDraft>) => void
  reset: () => void
}

export const initialPurchaseCostsDraft: PurchaseCostsDraft = {
  purchasePrice: '',
  stateId: 'DE-BW',
  brokerInvolved: false,
  rateOverrides: {},
  renovationBudget: {
    amountCents: 0,
    budgetStatus: 'not-budgeted',
  },
  movingSetupCosts: {
    amountCents: 0,
    budgetStatus: 'not-budgeted',
  },
}

export const initialFinancingDraft: FinancingDraft = {
  mode: 'selected-down-payment',
  availableEquity: '',
  downPayment: '',
  financedAcquisitionCostShare: '0',
  nominalAnnualRate: '3,50',
  initialRepaymentRate: '2,00',
  fixedInterestYears: '10',
}

export const useScenarioWorkspaceStore = create<ScenarioWorkspaceState>((set) => ({
  purchaseCosts: initialPurchaseCostsDraft,
  financing: initialFinancingDraft,
  setPurchaseCosts: (purchaseCosts) => set({ purchaseCosts }),
  updateFinancing: (financing) =>
    set((state) => ({
      financing: {
        ...state.financing,
        ...financing,
      },
    })),
  reset: () =>
    set({
      purchaseCosts: initialPurchaseCostsDraft,
      financing: initialFinancingDraft,
    }),
}))
