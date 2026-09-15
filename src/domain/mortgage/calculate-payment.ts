import {
  FinancialValidationError,
  addRates,
  assertSafeInteger,
  financialValidationErrorCodes,
  initialRepaymentRate,
  moneyCents,
  multiplyMoney,
  nominalAnnualRate,
  rate,
  safeDivide,
  subtractMoney,
  validationFailure,
  type DecimalValue,
  type MoneyCents,
  type Rate,
} from '../shared'

import { fullyAmortizingMonthlyPayment } from './payment-formulas'

import type {
  CashPurchaseMortgagePaymentResult,
  FullRepaymentTermMortgagePaymentInput,
  InitialRepaymentMortgagePaymentInput,
  MortgagePaymentInput,
  MortgagePaymentMode,
  MortgagePaymentResult,
} from './types'

function isMortgagePaymentMode(value: unknown): value is MortgagePaymentMode {
  return value === 'initial-repayment-rate' || value === 'full-repayment-term'
}

function requiredDecimal(value: DecimalValue | undefined, field: string): DecimalValue {
  if (value === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      field,
      field + ' is required',
      value,
    )
  }

  return value
}

function positiveTermMonths(value: number | undefined): number {
  if (value === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      'repaymentTermMonths',
      'repaymentTermMonths is required',
      value,
    )
  }

  const months = assertSafeInteger(value, 'repaymentTermMonths')

  if (months <= 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'repaymentTermMonths',
      'repaymentTermMonths must be greater than zero',
      value,
    )
  }

  return months
}

function cashPurchaseResult(input: MortgagePaymentInput): CashPurchaseMortgagePaymentResult {
  if (input.financing.status !== 'available') {
    throw new Error('Cash-purchase result requires available financing')
  }

  const zero = moneyCents(0)

  return {
    status: 'available',
    cashPurchase: true,
    financing: input.financing,
    paymentMode: input.paymentMode,
    principalCents: zero,
    nominalAnnualRate: null,
    monthlyNominalRate: null,
    initialRepaymentRate: null,
    repaymentTermMonths: null,
    monthlyPaymentCents: zero,
    firstMonthInterestCents: zero,
    firstMonthScheduledPrincipalCents: zero,
  }
}

function firstMonthAllocation(
  principal: MoneyCents,
  monthlyPayment: MoneyCents,
  monthlyNominalRate: Rate,
): {
  firstMonthInterestCents: MoneyCents
  firstMonthScheduledPrincipalCents: MoneyCents
} | null {
  const firstMonthInterest = multiplyMoney(principal, monthlyNominalRate, 'firstMonthInterestCents')

  if (monthlyPayment <= firstMonthInterest) {
    return null
  }

  return {
    firstMonthInterestCents: firstMonthInterest,
    firstMonthScheduledPrincipalCents: subtractMoney(monthlyPayment, firstMonthInterest),
  }
}

function initialRepaymentPayment(
  input: InitialRepaymentMortgagePaymentInput,
  principal: MoneyCents,
): MortgagePaymentResult {
  if (input.financing.status !== 'available') {
    throw new Error('Mortgage payment requires available financing')
  }

  const annualInterest = nominalAnnualRate(
    requiredDecimal(input.nominalAnnualRate, 'nominalAnnualRate'),
    'nominalAnnualRate',
  )
  const annualRepayment = initialRepaymentRate(
    requiredDecimal(input.initialRepaymentRate, 'initialRepaymentRate'),
    'initialRepaymentRate',
  )
  const monthlyNominalRate = rate(
    safeDivide(annualInterest, 12, 'monthsPerYear'),
    'monthlyNominalRate',
  )
  const monthlyPayment = multiplyMoney(
    principal,
    safeDivide(addRates([annualInterest, annualRepayment]), 12, 'monthsPerYear'),
    'contractualMonthlyPaymentCents',
  )
  const allocation = firstMonthAllocation(principal, monthlyPayment, monthlyNominalRate)

  if (allocation === null) {
    return {
      status: 'unavailable',
      reason: 'NEGATIVE_AMORTIZATION',
      paymentMode: input.paymentMode,
      financing: input.financing,
      principalCents: principal,
      monthlyPaymentCents: monthlyPayment,
      firstMonthInterestCents: multiplyMoney(
        principal,
        monthlyNominalRate,
        'firstMonthInterestCents',
      ),
    }
  }

  return {
    status: 'available',
    cashPurchase: false,
    financing: input.financing,
    paymentMode: input.paymentMode,
    principalCents: principal,
    nominalAnnualRate: annualInterest,
    monthlyNominalRate,
    initialRepaymentRate: annualRepayment,
    repaymentTermMonths: null,
    monthlyPaymentCents: monthlyPayment,
    contractualMonthlyPaymentCents: monthlyPayment,
    ...allocation,
  }
}

function fullRepaymentTermPayment(
  input: FullRepaymentTermMortgagePaymentInput,
  principal: MoneyCents,
): MortgagePaymentResult {
  if (input.financing.status !== 'available') {
    throw new Error('Mortgage payment requires available financing')
  }

  const annualInterest = nominalAnnualRate(
    requiredDecimal(input.nominalAnnualRate, 'nominalAnnualRate'),
    'nominalAnnualRate',
  )
  const repaymentTermMonths = positiveTermMonths(input.repaymentTermMonths)
  const monthlyNominalRate = rate(
    safeDivide(annualInterest, 12, 'monthsPerYear'),
    'monthlyNominalRate',
  )
  const monthlyPayment = fullyAmortizingMonthlyPayment(
    principal,
    monthlyNominalRate,
    repaymentTermMonths,
  )
  const allocation = firstMonthAllocation(principal, monthlyPayment, monthlyNominalRate)

  if (allocation === null) {
    return {
      status: 'unavailable',
      reason: 'NEGATIVE_AMORTIZATION',
      paymentMode: input.paymentMode,
      financing: input.financing,
      principalCents: principal,
      monthlyPaymentCents: monthlyPayment,
      firstMonthInterestCents: multiplyMoney(
        principal,
        monthlyNominalRate,
        'firstMonthInterestCents',
      ),
    }
  }

  return {
    status: 'available',
    cashPurchase: false,
    financing: input.financing,
    paymentMode: input.paymentMode,
    principalCents: principal,
    nominalAnnualRate: annualInterest,
    monthlyNominalRate,
    initialRepaymentRate: null,
    repaymentTermMonths,
    monthlyPaymentCents: monthlyPayment,
    fullyAmortizingMonthlyPaymentCents: monthlyPayment,
    ...allocation,
  }
}

function calculateMortgagePaymentInternal(input: MortgagePaymentInput): MortgagePaymentResult {
  if (input.financing.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'FINANCING_UNAVAILABLE',
      financing: input.financing,
    }
  }

  if (!isMortgagePaymentMode(input.paymentMode)) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'paymentMode',
      'paymentMode must be initial-repayment-rate or full-repayment-term',
      input.paymentMode,
    )
  }

  const principal = input.financing.loanAmountCents

  if (principal === 0) {
    return cashPurchaseResult(input)
  }

  return input.paymentMode === 'initial-repayment-rate'
    ? initialRepaymentPayment(input, principal)
    : fullRepaymentTermPayment(input, principal)
}

export function calculateMortgagePayment(input: MortgagePaymentInput): MortgagePaymentResult {
  try {
    return calculateMortgagePaymentInternal(input)
  } catch (error: unknown) {
    if (error instanceof FinancialValidationError) {
      return {
        status: 'unavailable',
        reason: 'VALIDATION_ERROR',
        error: {
          code: error.code,
          field: error.field,
          message: error.message,
          value: error.value,
        },
      }
    }

    throw error
  }
}
