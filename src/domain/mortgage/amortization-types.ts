import type {
  AvailableMortgagePaymentResult,
  CashPurchaseMortgagePaymentResult,
  MortgagePaymentResult,
} from './types'
import type { FinancialValidationErrorCode, MoneyCents } from '../shared'

export const maximumAmortizationMonths = 1_200

export interface AmortizationScheduleInput {
  payment: MortgagePaymentResult
  fixedInterestMonths?: number
  selectedMonth?: number
}

export interface AmortizationScheduleRow {
  month: number
  openingBalanceCents: MoneyCents
  contractualPaymentCents: MoneyCents
  interestCents: MoneyCents
  scheduledPrincipalCents: MoneyCents
  additionalPrincipalCents: MoneyCents
  regularPaymentCents: MoneyCents
  totalPaymentCents: MoneyCents
  closingBalanceCents: MoneyCents
  cumulativeInterestCents: MoneyCents
  cumulativeScheduledPrincipalCents: MoneyCents
  cumulativeAdditionalPrincipalCents: MoneyCents
}

interface AvailableAmortizationScheduleResultBase {
  status: 'available'
  payment: AvailableMortgagePaymentResult
  principalCents: MoneyCents
  contractualMonthlyPaymentCents: MoneyCents
  fixedInterestMonths: number | null
  selectedMonth: number | null
  remainingDebtAtSelectedMonthCents: MoneyCents | null
  rows: readonly AmortizationScheduleRow[]
  payoffMonth: number
  firstYearInterestCents: MoneyCents
  firstYearScheduledPrincipalCents: MoneyCents
  interestThroughFixedPeriodCents: MoneyCents
  scheduledPrincipalThroughFixedPeriodCents: MoneyCents
  additionalPrincipalThroughFixedPeriodCents: MoneyCents
  remainingDebtAtFixedPeriodCents: MoneyCents
  projectedLifetimeInterestCents: MoneyCents
  projectedLifetimeScheduledPrincipalCents: MoneyCents
}

export interface CashPurchaseAmortizationScheduleResult extends AvailableAmortizationScheduleResultBase {
  cashPurchase: true
  payment: CashPurchaseMortgagePaymentResult
  fixedInterestMonths: null
  rows: readonly []
  payoffMonth: 0
}

export interface MortgageAmortizationScheduleResult extends AvailableAmortizationScheduleResultBase {
  cashPurchase: false
  payment: Exclude<AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult>
  fixedInterestMonths: number
}

export type AvailableAmortizationScheduleResult =
  CashPurchaseAmortizationScheduleResult | MortgageAmortizationScheduleResult

export interface PaymentUnavailableAmortizationScheduleResult {
  status: 'unavailable'
  reason: 'MORTGAGE_PAYMENT_UNAVAILABLE'
  payment: Exclude<MortgagePaymentResult, AvailableMortgagePaymentResult>
}

interface AmortizationFailureBase {
  status: 'unavailable'
  payment: Exclude<AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult>
  month: number
  openingBalanceCents: MoneyCents
  contractualMonthlyPaymentCents: MoneyCents
  interestCents: MoneyCents
}

export interface NegativeAmortizationScheduleResult extends AmortizationFailureBase {
  reason: 'NEGATIVE_AMORTIZATION'
}

export interface NonAmortizingScheduleResult extends AmortizationFailureBase {
  reason: 'NON_AMORTIZING_LOAN'
}

export interface ScheduleLimitExceededAmortizationResult {
  status: 'unavailable'
  reason: 'SCHEDULE_LIMIT_EXCEEDED'
  payment: Exclude<AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult>
  maximumMonths: number
  remainingDebtCents: MoneyCents
  cumulativeInterestCents: MoneyCents
  cumulativeScheduledPrincipalCents: MoneyCents
}

export interface ValidationUnavailableAmortizationResult {
  status: 'unavailable'
  reason: 'VALIDATION_ERROR'
  error: {
    code: FinancialValidationErrorCode
    field: string
    message: string
    value: unknown
  }
}

export type AmortizationScheduleResult =
  | AvailableAmortizationScheduleResult
  | PaymentUnavailableAmortizationScheduleResult
  | NegativeAmortizationScheduleResult
  | NonAmortizingScheduleResult
  | ScheduleLimitExceededAmortizationResult
  | ValidationUnavailableAmortizationResult
