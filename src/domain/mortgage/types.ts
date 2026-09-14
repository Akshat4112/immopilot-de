import type { AvailableFinancingResult, FinancingResult } from '../financing'
import type { DecimalValue, FinancialValidationErrorCode, MoneyCents, Rate } from '../shared'

export const mortgagePaymentModes = ['initial-repayment-rate', 'full-repayment-term'] as const

export type MortgagePaymentMode = (typeof mortgagePaymentModes)[number]

interface MortgagePaymentInputBase {
  financing: FinancingResult
  nominalAnnualRate?: DecimalValue
}

export interface InitialRepaymentMortgagePaymentInput extends MortgagePaymentInputBase {
  paymentMode: 'initial-repayment-rate'
  initialRepaymentRate?: DecimalValue
}

export interface FullRepaymentTermMortgagePaymentInput extends MortgagePaymentInputBase {
  paymentMode: 'full-repayment-term'
  repaymentTermMonths?: number
}

export type MortgagePaymentInput =
  | InitialRepaymentMortgagePaymentInput
  | FullRepaymentTermMortgagePaymentInput

interface AvailableMortgagePaymentResultBase {
  status: 'available'
  financing: AvailableFinancingResult
  paymentMode: MortgagePaymentMode
  principalCents: MoneyCents
  monthlyPaymentCents: MoneyCents
  firstMonthInterestCents: MoneyCents
  firstMonthScheduledPrincipalCents: MoneyCents
}

export interface CashPurchaseMortgagePaymentResult extends AvailableMortgagePaymentResultBase {
  cashPurchase: true
  nominalAnnualRate: null
  monthlyNominalRate: null
  initialRepaymentRate: null
  repaymentTermMonths: null
}

export interface InitialRepaymentMortgagePaymentResult
  extends AvailableMortgagePaymentResultBase {
  cashPurchase: false
  paymentMode: 'initial-repayment-rate'
  nominalAnnualRate: Rate
  monthlyNominalRate: Rate
  initialRepaymentRate: Rate
  repaymentTermMonths: null
  contractualMonthlyPaymentCents: MoneyCents
}

export interface FullRepaymentTermMortgagePaymentResult
  extends AvailableMortgagePaymentResultBase {
  cashPurchase: false
  paymentMode: 'full-repayment-term'
  nominalAnnualRate: Rate
  monthlyNominalRate: Rate
  initialRepaymentRate: null
  repaymentTermMonths: number
  fullyAmortizingMonthlyPaymentCents: MoneyCents
}

export type AvailableMortgagePaymentResult =
  | CashPurchaseMortgagePaymentResult
  | InitialRepaymentMortgagePaymentResult
  | FullRepaymentTermMortgagePaymentResult

export interface FinancingUnavailableMortgagePaymentResult {
  status: 'unavailable'
  reason: 'FINANCING_UNAVAILABLE'
  financing: Exclude<FinancingResult, AvailableFinancingResult>
}

export interface NegativeAmortizationMortgagePaymentResult {
  status: 'unavailable'
  reason: 'NEGATIVE_AMORTIZATION'
  paymentMode: MortgagePaymentMode
  financing: AvailableFinancingResult
  principalCents: MoneyCents
  monthlyPaymentCents: MoneyCents
  firstMonthInterestCents: MoneyCents
}

export interface ValidationUnavailableMortgagePaymentResult {
  status: 'unavailable'
  reason: 'VALIDATION_ERROR'
  error: {
    code: FinancialValidationErrorCode
    field: string
    message: string
    value: unknown
  }
}

export type MortgagePaymentResult =
  | AvailableMortgagePaymentResult
  | FinancingUnavailableMortgagePaymentResult
  | NegativeAmortizationMortgagePaymentResult
  | ValidationUnavailableMortgagePaymentResult
