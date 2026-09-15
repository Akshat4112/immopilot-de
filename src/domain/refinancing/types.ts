import type Decimal from 'decimal.js'

import type { DecimalValue, FinancialValidationErrorCode, MoneyCents, Rate } from '../shared'
import type { FixedPeriodResult } from '../mortgage/fixed-period-types'

export const refinancingPaymentModes = ['initial-repayment-rate', 'selected-term'] as const
export type RefinancingPaymentMode = (typeof refinancingPaymentModes)[number]

interface RefinancingScenarioBase {
  id: string
  futureNominalAnnualRate: DecimalValue
}

export interface InitialRepaymentRefinancingScenario extends RefinancingScenarioBase {
  paymentMode: 'initial-repayment-rate'
  futureInitialRepaymentRate: DecimalValue
  repaymentTermMonths?: never
}

export interface SelectedTermRefinancingScenario extends RefinancingScenarioBase {
  paymentMode: 'selected-term'
  repaymentTermMonths: number
  futureInitialRepaymentRate?: never
}

export type RefinancingScenarioInput =
  InitialRepaymentRefinancingScenario | SelectedTermRefinancingScenario

export interface RefinancingStressInput {
  fixedPeriod: FixedPeriodResult
  currentContractualMonthlyPaymentCents: number
  scenarios: readonly RefinancingScenarioInput[]
}

export interface RefinancingScenarioResult {
  id: string
  paymentMode: RefinancingPaymentMode
  futureNominalAnnualRate: Rate
  futureInitialRepaymentRate: Rate | null
  repaymentTermMonths: number | null
  futureMonthlyPaymentCents: MoneyCents
  monthlyPaymentChangeCents: MoneyCents
  /** Decimal fraction, e.g. 0.10 = 10%; null if the current payment is zero. */
  monthlyPaymentChangeRate: Decimal | null
}

export interface AvailableRefinancingStressResult {
  status: 'available'
  assumptionKind: 'user-selected-stress-not-forecast'
  remainingDebtCents: MoneyCents
  fixedInterestMonths: number
  currentContractualMonthlyPaymentCents: MoneyCents
  paymentMode: RefinancingPaymentMode
  scenarios: readonly RefinancingScenarioResult[]
}

export interface FixedPeriodUnavailableRefinancingResult {
  status: 'unavailable'
  reason: 'FIXED_PERIOD_UNAVAILABLE'
  fixedPeriod: Exclude<FixedPeriodResult, { status: 'available' }>
}

export interface NotApplicableRefinancingResult {
  status: 'not-applicable'
  reason: 'CASH_PURCHASE' | 'PAID_OFF'
}

export interface ValidationUnavailableRefinancingResult {
  status: 'unavailable'
  reason: 'VALIDATION_ERROR'
  error: {
    code: FinancialValidationErrorCode
    field: string
    message: string
    value: unknown
  }
}

export interface ComparisonAssumptionsMismatchRefinancingResult {
  status: 'unavailable'
  reason: 'COMPARISON_ASSUMPTIONS_MISMATCH'
  scenarioId: string
  field: 'paymentMode' | 'futureInitialRepaymentRate' | 'repaymentTermMonths'
}

export interface FuturePaymentNotAmortizingRefinancingResult {
  status: 'unavailable'
  reason: 'FUTURE_PAYMENT_NOT_AMORTIZING'
  scenarioId: string
  futureMonthlyPaymentCents: MoneyCents
  firstMonthInterestCents: MoneyCents
}

export type RefinancingStressResult =
  | AvailableRefinancingStressResult
  | FixedPeriodUnavailableRefinancingResult
  | NotApplicableRefinancingResult
  | ValidationUnavailableRefinancingResult
  | ComparisonAssumptionsMismatchRefinancingResult
  | FuturePaymentNotAmortizingRefinancingResult
