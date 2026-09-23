import type { BudgetStatus, GermanStateId } from '../domain/acquisition-costs'
import type { FinancingMode } from '../domain/financing'

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

export type PropertyUseDraft = 'owner-occupier' | 'rental-investment'

export interface ScenarioAnalysisDraft {
  propertyUse: PropertyUseDraft
  refinancingInitialRepaymentRate: string
  refinancingLowerRate: string
  refinancingBaseRate: string
  refinancingHigherRate: string
  currentComparableRent: string
  monthlyOwnerCosts: string
  ownerAnalysisYears: string
  ownerRentGrowthRate: string
  ownerCostGrowthRate: string
  propertyAppreciationRate: string
  alternativeReturnRate: string
  ownerSellingCostRate: string
  monthlyNetColdRent: string
  vacancyRate: string
  otherAnnualRentLoss: string
  monthlyNonRecoverableHausgeld: string
  monthlyReserveContribution: string
  annualMaintenanceAllowance: string
  otherAnnualOwnerCosts: string
  rentalRentGrowthRate: string
  rentalOwnerCostGrowthRate: string
  rentalHoldingYears: string
  rentalPropertyAppreciationRate: string
  rentalSellingCostRate: string
  maximumMonthlyPayment: string
  targetGrossYield: string
  targetNetYield: string
  livingAreaSquareMetres: string
  askingPrice: string
  proposedOffer: string
  comparablePricePerSquareMetreLow: string
  comparablePricePerSquareMetreHigh: string
  openingOfferLargerDiscount: string
  openingOfferSmallerDiscount: string
}

export interface ScenarioWorkspaceSnapshot {
  purchaseCosts: PurchaseCostsDraft
  financing: FinancingDraft
  analysis: ScenarioAnalysisDraft
}

export const initialPurchaseCostsDraft: PurchaseCostsDraft = {
  purchasePrice: '',
  stateId: 'DE-BW',
  brokerInvolved: false,
  rateOverrides: {},
  renovationBudget: { amountCents: 0, budgetStatus: 'not-budgeted' },
  movingSetupCosts: { amountCents: 0, budgetStatus: 'not-budgeted' },
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

/** These values are visible starting assumptions, not forecasts or recommendations. */
export const initialScenarioAnalysisDraft: ScenarioAnalysisDraft = {
  propertyUse: 'owner-occupier',
  refinancingInitialRepaymentRate: '2,00',
  refinancingLowerRate: '2,00',
  refinancingBaseRate: '4,00',
  refinancingHigherRate: '6,00',
  currentComparableRent: '',
  monthlyOwnerCosts: '',
  ownerAnalysisYears: '10',
  ownerRentGrowthRate: '2,00',
  ownerCostGrowthRate: '2,00',
  propertyAppreciationRate: '2,00',
  alternativeReturnRate: '5,00',
  ownerSellingCostRate: '3,00',
  monthlyNetColdRent: '',
  vacancyRate: '3,00',
  otherAnnualRentLoss: '0',
  monthlyNonRecoverableHausgeld: '',
  monthlyReserveContribution: '0',
  annualMaintenanceAllowance: '0',
  otherAnnualOwnerCosts: '0',
  rentalRentGrowthRate: '2,00',
  rentalOwnerCostGrowthRate: '2,00',
  rentalHoldingYears: '10',
  rentalPropertyAppreciationRate: '',
  rentalSellingCostRate: '',
  maximumMonthlyPayment: '',
  targetGrossYield: '',
  targetNetYield: '',
  livingAreaSquareMetres: '',
  askingPrice: '',
  proposedOffer: '',
  comparablePricePerSquareMetreLow: '',
  comparablePricePerSquareMetreHigh: '',
  openingOfferLargerDiscount: '',
  openingOfferSmallerDiscount: '',
}
