import type { DecimalValue, FinancialValidationErrorCode, MoneyCents, Rate } from '../shared'
import type { FinancingResult, AvailableFinancingResult } from '../financing'
import type {
  AmortizationScheduleResult,
  AvailableAmortizationScheduleResult,
} from '../mortgage/amortization-types'

export interface RentVersusBuyInput {
  financing: FinancingResult
  amortization: AmortizationScheduleResult
  analysisMonths: number
  currentComparableRentCents: number
  monthlyOwnerCostsCents: number
  rentGrowthRate: DecimalValue
  ownerCostGrowthRate: DecimalValue
  propertyAppreciationRate: DecimalValue
  alternativeReturnRate: DecimalValue
  sellingCostRate?: DecimalValue
  /** Required explicit equal-resource choice when Sondertilgung is present. */
  includeAdditionalRepaymentsInMatchedBudget: boolean
}

export interface RentVersusBuyMonth {
  month: number
  projectedPropertyValueCents: MoneyCents
  hypotheticalSellingCostsCents: MoneyCents
  remainingMortgageDebtCents: MoneyCents
  monthlyRentCents: MoneyCents
  monthlyOwnerCostsCents: MoneyCents
  regularMortgagePaymentCents: MoneyCents
  additionalRepaymentCents: MoneyCents
  buyerHousingOutflowCents: MoneyCents
  renterHousingOutflowCents: MoneyCents
  commonBudgetCents: MoneyCents
  buyerInvestmentContributionCents: MoneyCents
  renterInvestmentContributionCents: MoneyCents
  buyerAlternativePortfolioCents: MoneyCents
  renterAlternativePortfolioCents: MoneyCents
  buyerNetWealthCents: MoneyCents
  renterNetWealthCents: MoneyCents
  buyerMinusRenterCents: MoneyCents
}

export type RentVersusBuyBreakEven =
  | { status: 'reached'; firstMonth: number; year: number }
  | { status: 'not-reached-within-horizon'; analysisMonths: number }

export interface AvailableRentVersusBuyResult {
  status: 'available'
  comparisonBasis: 'matched-budget-liquidation'
  analysisMonths: number
  requiredEquityCents: MoneyCents
  appliedSellingCostRate: Rate
  includeAdditionalRepaymentsInMatchedBudget: boolean
  mortgageProjectionAssumption:
    'cash-purchase' | 'within-fixed-period' | 'constant-initial-rate-beyond-fixed-period'
  rows: readonly RentVersusBuyMonth[]
  atAnalysisMonth: RentVersusBuyMonth
  breakEven: RentVersusBuyBreakEven
}

export interface FinancingUnavailableRentVersusBuyResult {
  status: 'unavailable'
  reason: 'FINANCING_UNAVAILABLE'
  financing: Exclude<FinancingResult, AvailableFinancingResult>
}

export interface AmortizationUnavailableRentVersusBuyResult {
  status: 'unavailable'
  reason: 'AMORTIZATION_UNAVAILABLE'
  amortization: Exclude<AmortizationScheduleResult, AvailableAmortizationScheduleResult>
}

export interface UnderfundedRentVersusBuyResult {
  status: 'unavailable'
  reason: 'UNDERFUNDED_SCENARIO'
  cashGapCents: MoneyCents
}

export interface FinancingScheduleMismatchRentVersusBuyResult {
  status: 'unavailable'
  reason: 'FINANCING_SCHEDULE_MISMATCH'
  financingLoanCents: MoneyCents
  schedulePrincipalCents: MoneyCents
}

export interface UnmatchedAdditionalRepaymentsRentVersusBuyResult {
  status: 'unavailable'
  reason: 'UNMATCHED_ADDITIONAL_REPAYMENTS'
}

export interface IncompleteScheduleRentVersusBuyResult {
  status: 'unavailable'
  reason: 'INCOMPLETE_MORTGAGE_SCHEDULE'
  month: number
}

export interface ValidationUnavailableRentVersusBuyResult {
  status: 'unavailable'
  reason: 'VALIDATION_ERROR'
  error: {
    code: FinancialValidationErrorCode
    field: string
    message: string
    value: unknown
  }
}

export type RentVersusBuyResult =
  | AvailableRentVersusBuyResult
  | FinancingUnavailableRentVersusBuyResult
  | AmortizationUnavailableRentVersusBuyResult
  | UnderfundedRentVersusBuyResult
  | FinancingScheduleMismatchRentVersusBuyResult
  | UnmatchedAdditionalRepaymentsRentVersusBuyResult
  | IncompleteScheduleRentVersusBuyResult
  | ValidationUnavailableRentVersusBuyResult
