import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { calculateScenarioWorkspace, useScenarioWorkspaceStore } from '../scenario-workspace'

export function useFinancingCalculator() {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage ?? i18n.language) === 'en' ? 'en' : 'de'
  const purchaseCosts = useScenarioWorkspaceStore((state) => state.purchaseCosts)
  const financingDraft = useScenarioWorkspaceStore((state) => state.financing)
  const updateFinancing = useScenarioWorkspaceStore((state) => state.updateFinancing)

  const calculations = useMemo(
    () => calculateScenarioWorkspace(purchaseCosts, financingDraft, locale),
    [financingDraft, locale, purchaseCosts],
  )

  return {
    ...calculations,
    financingDraft,
    updateFinancing,
  }
}
