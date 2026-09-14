import {
  FinancialValidationError,
  addMoney,
  assertSafeInteger,
  financialValidationErrorCodes,
  minMoney,
  moneyCents,
  multiplyMoney,
  nonNegativeMoneyCents,
  subtractMoney,
  validationFailure,
  type MoneyCents,
} from '../shared'

import {
  maximumAmortizationMonths,
  type AmortizationScheduleInput,
  type AmortizationScheduleResult,
  type AmortizationScheduleRow,
  type CashPurchaseAmortizationScheduleResult,
} from './amortization-types'
import type { AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult } from './types'

type MortgagePayment = Exclude<AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult>

function positiveWholeMonth(value: number | undefined, field: string): number {
  if (value === undefined) {
    return validationFailure(
      financialValidationErrorCodes.required,
      field,
      field + ' is required',
      value,
    )
  }

  const month = assertSafeInteger(value, field)

  if (month <= 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      field,
      field + ' must be a positive whole month',
      value,
    )
  }

  return month
}

function optionalSelectedMonth(value: number | undefined): number | null {
  if (value === undefined) {
    return null
  }

  const month = assertSafeInteger(value, 'selectedMonth')

  if (month < 0) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'selectedMonth',
      'selectedMonth must be zero or a positive whole month',
      value,
    )
  }

  return month
}

function remainingDebtAtMonth(
  rows: readonly AmortizationScheduleRow[],
  principal: MoneyCents,
  month: number,
): MoneyCents {
  if (month === 0) {
    return principal
  }

  return rows[month - 1]?.closingBalanceCents ?? moneyCents(0)
}

function cashPurchaseSchedule(
  payment: CashPurchaseMortgagePaymentResult,
  selectedMonth: number | null,
): CashPurchaseAmortizationScheduleResult {
  const zero = moneyCents(0)

  return {
    status: 'available',
    cashPurchase: true,
    payment,
    principalCents: zero,
    contractualMonthlyPaymentCents: zero,
    fixedInterestMonths: null,
    selectedMonth,
    remainingDebtAtSelectedMonthCents: selectedMonth === null ? null : zero,
    rows: [],
    payoffMonth: 0,
    firstYearInterestCents: zero,
    firstYearScheduledPrincipalCents: zero,
    interestThroughFixedPeriodCents: zero,
    scheduledPrincipalThroughFixedPeriodCents: zero,
    additionalPrincipalThroughFixedPeriodCents: zero,
    remainingDebtAtFixedPeriodCents: zero,
    projectedLifetimeInterestCents: zero,
    projectedLifetimeScheduledPrincipalCents: zero,
  }
}

function calculateMortgageSchedule(
  payment: MortgagePayment,
  fixedInterestMonths: number,
  selectedMonth: number | null,
): AmortizationScheduleResult {
  const principal = nonNegativeMoneyCents(payment.principalCents, 'principalCents')
  const contractualPayment = nonNegativeMoneyCents(
    payment.monthlyPaymentCents,
    'contractualMonthlyPaymentCents',
  )
  const zero = moneyCents(0)
  const rows: AmortizationScheduleRow[] = []
  let openingBalance = principal
  let cumulativeInterest = zero
  let cumulativeScheduledPrincipal = zero
  let firstYearInterest = zero
  let firstYearScheduledPrincipal = zero
  let fixedPeriodInterest = zero
  let fixedPeriodScheduledPrincipal = zero

  for (let month = 1; month <= maximumAmortizationMonths; month += 1) {
    const interest = multiplyMoney(openingBalance, payment.monthlyNominalRate, 'interestCents')
    const plannedPrincipal = subtractMoney(contractualPayment, interest)

    if (plannedPrincipal < 0) {
      return {
        status: 'unavailable',
        reason: 'NEGATIVE_AMORTIZATION',
        payment,
        month,
        openingBalanceCents: openingBalance,
        contractualMonthlyPaymentCents: contractualPayment,
        interestCents: interest,
      }
    }

    if (plannedPrincipal === 0) {
      return {
        status: 'unavailable',
        reason: 'NON_AMORTIZING_LOAN',
        payment,
        month,
        openingBalanceCents: openingBalance,
        contractualMonthlyPaymentCents: contractualPayment,
        interestCents: interest,
      }
    }

    const scheduledPrincipal = minMoney(openingBalance, plannedPrincipal)
    const regularPayment = addMoney(interest, scheduledPrincipal)
    const closingBalance = subtractMoney(openingBalance, scheduledPrincipal)

    cumulativeInterest = addMoney(cumulativeInterest, interest)
    cumulativeScheduledPrincipal = addMoney(cumulativeScheduledPrincipal, scheduledPrincipal)

    if (month <= 12) {
      firstYearInterest = addMoney(firstYearInterest, interest)
      firstYearScheduledPrincipal = addMoney(firstYearScheduledPrincipal, scheduledPrincipal)
    }

    if (month <= fixedInterestMonths) {
      fixedPeriodInterest = addMoney(fixedPeriodInterest, interest)
      fixedPeriodScheduledPrincipal = addMoney(fixedPeriodScheduledPrincipal, scheduledPrincipal)
    }

    rows.push({
      month,
      openingBalanceCents: openingBalance,
      contractualPaymentCents: contractualPayment,
      interestCents: interest,
      scheduledPrincipalCents: scheduledPrincipal,
      additionalPrincipalCents: zero,
      regularPaymentCents: regularPayment,
      totalPaymentCents: regularPayment,
      closingBalanceCents: closingBalance,
      cumulativeInterestCents: cumulativeInterest,
      cumulativeScheduledPrincipalCents: cumulativeScheduledPrincipal,
      cumulativeAdditionalPrincipalCents: zero,
    })

    if (closingBalance === 0) {
      return {
        status: 'available',
        cashPurchase: false,
        payment,
        principalCents: principal,
        contractualMonthlyPaymentCents: contractualPayment,
        fixedInterestMonths,
        selectedMonth,
        remainingDebtAtSelectedMonthCents:
          selectedMonth === null ? null : remainingDebtAtMonth(rows, principal, selectedMonth),
        rows,
        payoffMonth: month,
        firstYearInterestCents: firstYearInterest,
        firstYearScheduledPrincipalCents: firstYearScheduledPrincipal,
        interestThroughFixedPeriodCents: fixedPeriodInterest,
        scheduledPrincipalThroughFixedPeriodCents: fixedPeriodScheduledPrincipal,
        additionalPrincipalThroughFixedPeriodCents: zero,
        remainingDebtAtFixedPeriodCents: remainingDebtAtMonth(rows, principal, fixedInterestMonths),
        projectedLifetimeInterestCents: cumulativeInterest,
        projectedLifetimeScheduledPrincipalCents: cumulativeScheduledPrincipal,
      }
    }

    openingBalance = closingBalance
  }

  return {
    status: 'unavailable',
    reason: 'SCHEDULE_LIMIT_EXCEEDED',
    payment,
    maximumMonths: maximumAmortizationMonths,
    remainingDebtCents: openingBalance,
    cumulativeInterestCents: cumulativeInterest,
    cumulativeScheduledPrincipalCents: cumulativeScheduledPrincipal,
  }
}

function calculateAmortizationScheduleInternal(
  input: AmortizationScheduleInput,
): AmortizationScheduleResult {
  if (input.payment.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'MORTGAGE_PAYMENT_UNAVAILABLE',
      payment: input.payment,
    }
  }

  const selectedMonth = optionalSelectedMonth(input.selectedMonth)

  if (input.payment.cashPurchase) {
    if (input.fixedInterestMonths !== undefined) {
      positiveWholeMonth(input.fixedInterestMonths, 'fixedInterestMonths')
    }

    return cashPurchaseSchedule(input.payment, selectedMonth)
  }

  const fixedInterestMonths = positiveWholeMonth(input.fixedInterestMonths, 'fixedInterestMonths')

  return calculateMortgageSchedule(input.payment, fixedInterestMonths, selectedMonth)
}

export function calculateAmortizationSchedule(
  input: AmortizationScheduleInput,
): AmortizationScheduleResult {
  try {
    return calculateAmortizationScheduleInternal(input)
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
