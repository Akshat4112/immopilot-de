import type { MoneyCents } from '../shared'
import type {
  AdditionalRepaymentComparisonResult,
  AvailableAdditionalRepaymentComparisonResult,
} from './additional-repayment-types'
import type {
  AmortizationScheduleResult,
  AvailableAmortizationScheduleResult,
} from './amortization-types'

export type RefinancingEligibility =
  | { status: 'applicable'; remainingDebtCents: MoneyCents }
  | { status: 'not-applicable'; reason: 'CASH_PURCHASE' | 'PAID_OFF' }

export interface AvailableFixedPeriodResult {
  status: 'available'
  cashPurchase: boolean
  fixedInterestMonths: number | null
  remainingDebtCents: MoneyCents
  interestPaidCents: MoneyCents
  scheduledPrincipalPaidCents: MoneyCents
  additionalPrincipalPaidCents: MoneyCents
  refinancing: RefinancingEligibility
  /** Beyond the fixed period this is a constant-initial-rate projection, not a loan offer. */
  projectedPayoffMonth: number
  projectionAssumption: 'constant-initial-rate'
}

export interface FixedPeriodScheduleUnavailableResult {
  status: 'unavailable'
  reason: 'AMORTIZATION_SCHEDULE_UNAVAILABLE'
  schedule: Exclude<AmortizationScheduleResult, AvailableAmortizationScheduleResult>
}

export type FixedPeriodResult = AvailableFixedPeriodResult | FixedPeriodScheduleUnavailableResult

export interface AvailableFixedPeriodComparisonResult {
  status: 'available'
  fixedInterestMonths: number | null
  baseline: AvailableFixedPeriodResult
  withAdditionalRepayments: AvailableFixedPeriodResult
  remainingDebtReductionCents: MoneyCents
}

export interface FixedPeriodComparisonUnavailableResult {
  status: 'unavailable'
  reason: 'ADDITIONAL_REPAYMENT_COMPARISON_UNAVAILABLE'
  comparison: Exclude<
    AdditionalRepaymentComparisonResult,
    AvailableAdditionalRepaymentComparisonResult
  >
}

export interface FixedPeriodMismatchResult {
  status: 'unavailable'
  reason: 'FIXED_PERIOD_MISMATCH'
  baselineFixedInterestMonths: number | null
  additionalFixedInterestMonths: number | null
}

export type FixedPeriodComparisonResult =
  | AvailableFixedPeriodComparisonResult
  | FixedPeriodComparisonUnavailableResult
  | FixedPeriodMismatchResult
