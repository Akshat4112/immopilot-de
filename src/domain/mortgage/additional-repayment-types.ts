import type {
  AmortizationScheduleInput,
  AmortizationScheduleResult,
  AvailableAmortizationScheduleResult,
} from './amortization-types'
import type { MoneyCents } from '../shared'

export interface OneTimeAdditionalRepayment {
  month: number
  amountCents: number
}

export interface AdditionalRepaymentPlan {
  annualAdditionalRepaymentCents?: number
  annualAdditionalRepaymentMonth?: number
  oneTimeAdditionalRepayments?: readonly OneTimeAdditionalRepayment[]
}

export interface NormalizedOneTimeAdditionalRepayment {
  month: number
  amountCents: MoneyCents
}

export interface NormalizedAdditionalRepaymentPlan {
  annualAdditionalRepaymentCents: MoneyCents
  annualAdditionalRepaymentMonth: number
  oneTimeAdditionalRepayments: readonly NormalizedOneTimeAdditionalRepayment[]
}

export interface AdditionalRepaymentComparisonInput extends Omit<
  AmortizationScheduleInput,
  'additionalRepayments'
> {
  additionalRepayments: AdditionalRepaymentPlan
}

export interface AvailableAdditionalRepaymentComparisonResult {
  status: 'available'
  cashPurchase: boolean
  baseline: AvailableAmortizationScheduleResult
  withAdditionalRepayments: AvailableAmortizationScheduleResult
  interestSavedThroughFixedPeriodCents: MoneyCents
  projectedLifetimeInterestSavedCents: MoneyCents
  timeSavedMonths: number
}

export interface BaselineUnavailableAdditionalRepaymentComparisonResult {
  status: 'unavailable'
  reason: 'BASELINE_SCHEDULE_UNAVAILABLE'
  schedule: Exclude<AmortizationScheduleResult, AvailableAmortizationScheduleResult>
}

export interface AdditionalScheduleUnavailableComparisonResult {
  status: 'unavailable'
  reason: 'ADDITIONAL_REPAYMENT_SCHEDULE_UNAVAILABLE'
  schedule: Exclude<AmortizationScheduleResult, AvailableAmortizationScheduleResult>
}

export type AdditionalRepaymentComparisonResult =
  | AvailableAdditionalRepaymentComparisonResult
  | BaselineUnavailableAdditionalRepaymentComparisonResult
  | AdditionalScheduleUnavailableComparisonResult
