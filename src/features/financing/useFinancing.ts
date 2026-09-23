import { useMemo } from 'react'

import { calculateScenarioWorkspace, useScenarioWorkspaceStore } from '../scenario-workspace'

export function useFinancingCalculator() {
  const purchaseCosts = useScenarioWorkspaceStore((state) => state.purchaseCosts)
  const financingDraft = useScenarioWorkspaceStore((state) => state.financing)
  const updateFinancing = useScenarioWorkspaceStore((state) => state.updateFinancing)

  const calculations = useMemo(
    () => calculateScenarioWorkspace(purchaseCosts, financingDraft),
    [financingDraft, purchaseCosts],
  )

  return {
    ...calculations,
    financingDraft,
    updateFinancing,
  }
}
