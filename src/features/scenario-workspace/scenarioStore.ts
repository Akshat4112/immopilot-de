import { create } from 'zustand'

import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
  sortOneTimeAdditionalRepaymentDrafts,
  type FinancingDraft,
  type PurchaseCostsDraft,
  type ScenarioAnalysisDraft,
  type ScenarioWorkspaceSnapshot,
} from '../../config/scenarioDrafts'

export {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
  sortOneTimeAdditionalRepaymentDrafts,
  type AdditionalRepaymentsDraft,
  type FinancingDraft,
  type OneTimeAdditionalRepaymentDraft,
  type PostPurchaseBudgetDraft,
  type PropertyUseDraft,
  type PurchaseCostRateOverridesDraft,
  type PurchaseCostsDraft,
  type ScenarioAnalysisDraft,
  type ScenarioWorkspaceSnapshot,
} from '../../config/scenarioDrafts'

export interface ScenarioWorkspaceState extends ScenarioWorkspaceSnapshot {
  setPurchaseCosts: (purchaseCosts: PurchaseCostsDraft) => void
  updateFinancing: (financing: Partial<FinancingDraft>) => void
  updateAnalysis: (analysis: Partial<ScenarioAnalysisDraft>) => void
  replaceWorkspace: (workspace: ScenarioWorkspaceSnapshot) => void
  reset: () => void
}

/** Calculated values never live in this store; routes derive them through the domain API. */
export const useScenarioWorkspaceStore = create<ScenarioWorkspaceState>((set) => ({
  purchaseCosts: initialPurchaseCostsDraft,
  financing: initialFinancingDraft,
  analysis: initialScenarioAnalysisDraft,
  setPurchaseCosts: (purchaseCosts) => set({ purchaseCosts }),
  updateFinancing: (financing) =>
    set((state) => ({ financing: { ...state.financing, ...financing } })),
  updateAnalysis: (analysis) => set((state) => ({ analysis: { ...state.analysis, ...analysis } })),
  replaceWorkspace: (workspace) =>
    set(() => {
      const financing = structuredClone(workspace.financing)
      financing.additionalRepayments.oneTimeAdditionalRepayments =
        sortOneTimeAdditionalRepaymentDrafts(
          financing.additionalRepayments.oneTimeAdditionalRepayments,
        )
      return {
        purchaseCosts: structuredClone(workspace.purchaseCosts),
        financing,
        analysis: structuredClone(workspace.analysis),
      }
    }),
  reset: () =>
    set({
      purchaseCosts: structuredClone(initialPurchaseCostsDraft),
      financing: structuredClone(initialFinancingDraft),
      analysis: structuredClone(initialScenarioAnalysisDraft),
    }),
}))
