import {
  initialFinancingDraft,
  initialPurchaseCostsDraft,
  initialScenarioAnalysisDraft,
  type ScenarioWorkspaceSnapshot,
} from '../config/scenarioDrafts'
import { capturePropertyReport, type ReportOptions } from '../features/reports/reportSnapshot'

export function reportInputs(): ScenarioWorkspaceSnapshot {
  return {
    purchaseCosts: {
      ...initialPurchaseCostsDraft,
      purchasePrice: '250000',
      renovationBudget: { amountCents: 0, budgetStatus: 'confirmed-zero' },
      movingSetupCosts: { amountCents: 0, budgetStatus: 'confirmed-zero' },
    },
    financing: {
      ...structuredClone(initialFinancingDraft),
      availableEquity: '66250',
      downPayment: '50000',
    },
    analysis: {
      ...initialScenarioAnalysisDraft,
      currentComparableRent: '1000',
      monthlyOwnerCosts: '250',
      maximumMonthlyPayment: '1000',
      askingPrice: '250000',
      proposedOffer: '230000',
      livingAreaSquareMetres: '60',
      comparablePricePerSquareMetreLow: '3800',
      comparablePricePerSquareMetreHigh: '4300',
      openingOfferLargerDiscount: '12',
      openingOfferSmallerDiscount: '8',
    },
  }
}

export function capturedReport(
  inputs = reportInputs(),
  options: ReportOptions = { language: 'en' },
) {
  const result = capturePropertyReport(
    { inputs, inputLocale: 'de-DE' },
    { generatedAt: '2026-10-25T10:15:00Z', ...options },
  )
  if (result.status !== 'captured') throw new Error(`Fixture blocked: ${result.issue}`)
  return result.snapshot
}
