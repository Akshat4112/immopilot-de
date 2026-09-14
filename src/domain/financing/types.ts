import type { AcquisitionCostResult, AvailableAcquisitionCostResult } from '../acquisition-costs'
import type { DecimalValue, FinancialValidationErrorCode, MoneyCents, Rate } from '../shared'

export const financingModes = ['selected-down-payment', 'available-equity'] as const
export const financingClassifications = [
  'below-100-percent',
  '100-percent',
  'above-100-percent',
] as const

export type FinancingMode = (typeof financingModes)[number]
export type FinancingClassification = (typeof financingClassifications)[number]
export type FundingStatus = 'funded' | 'underfunded'

interface FinancingInputBase {
  acquisition: AcquisitionCostResult
  availableEquityCents: number
  financedAcquisitionCostShare: DecimalValue
}

export interface SelectedDownPaymentFinancingInput extends FinancingInputBase {
  mode: 'selected-down-payment'
  downPaymentCents: number
}

export interface AvailableEquityFinancingInput extends FinancingInputBase {
  mode: 'available-equity'
}

export type FinancingInput =
  | SelectedDownPaymentFinancingInput
  | AvailableEquityFinancingInput

export interface AvailableFinancingResult {
  status: 'available'
  mode: FinancingMode
  fundingStatus: FundingStatus
  financingClassification: FinancingClassification
  acquisition: AvailableAcquisitionCostResult
  purchasePriceCents: MoneyCents
  transactionAcquisitionCostsCents: MoneyCents
  postPurchaseBudgetCents: MoneyCents
  totalProjectCostCents: MoneyCents
  availableEquityCents: MoneyCents
  financedAcquisitionCostShare: Rate
  financedAcquisitionCostsCents: MoneyCents
  cashFundedTransactionCostsCents: MoneyCents
  downPaymentCents: MoneyCents
  requiredEquityCents: MoneyCents
  loanAmountCents: MoneyCents
  cashGapCents: MoneyCents
  cashRemainingCents: MoneyCents
  purchasePriceFinancingRatio: Rate
  sourceOfFundsBalanced: true
}

export interface AcquisitionUnavailableFinancingResult {
  status: 'unavailable'
  reason: 'ACQUISITION_COSTS_UNAVAILABLE'
  acquisition: Exclude<AcquisitionCostResult, AvailableAcquisitionCostResult>
}

export interface ValidationUnavailableFinancingResult {
  status: 'unavailable'
  reason: 'VALIDATION_ERROR'
  error: {
    code: FinancialValidationErrorCode
    field: string
    message: string
    value: unknown
  }
}

export type FinancingResult =
  | AvailableFinancingResult
  | AcquisitionUnavailableFinancingResult
  | ValidationUnavailableFinancingResult
