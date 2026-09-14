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

import type {
  AdditionalRepaymentPlan,
  NormalizedAdditionalRepaymentPlan,
  NormalizedOneTimeAdditionalRepayment,
} from './additional-repayment-types'
import {
  maximumAmortizationMonths,
  type AmortizationScheduleInput,
  type AmortizationScheduleResult,
  type AmortizationScheduleRow,
  type CashPurchaseAmortizationScheduleResult,
} from './amortization-types'
import type { AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult } from './types'

type MortgagePayment = Exclude<AvailableMortgagePaymentResult, CashPurchaseMortgagePaymentResult>

function positiveWholeMonth(value: unknown, field: string): number {
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

function annualPaymentMonth(value: number | undefined): number {
  const month =
    value === undefined ? 12 : assertSafeInteger(value, 'annualAdditionalRepaymentMonth')

  if (month < 1 || month > 12) {
    return validationFailure(
      financialValidationErrorCodes.outOfRange,
      'annualAdditionalRepaymentMonth',
      'annualAdditionalRepaymentMonth must be between 1 and 12',
      value,
    )
  }

  return month
}

function normalizeOneTimeRepayment(
  value: unknown,
  index: number,
): NormalizedOneTimeAdditionalRepayment {
  const field = 'oneTimeAdditionalRepayments[' + index + ']'

  if (typeof value !== 'object' || value === null) {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      field,
      field + ' must be an additional-repayment object',
      value,
    )
  }

  const repayment = value as Record<string, unknown>

  return {
    month: positiveWholeMonth(repayment.month, field + '.month'),
    amountCents: nonNegativeMoneyCents(repayment.amountCents, field + '.amountCents'),
  }
}

function normalizeAdditionalRepaymentPlan(
  plan: AdditionalRepaymentPlan | undefined,
): NormalizedAdditionalRepaymentPlan {
  const annualAmount = nonNegativeMoneyCents(
    plan?.annualAdditionalRepaymentCents === undefined ? 0 : plan.annualAdditionalRepaymentCents,
    'annualAdditionalRepaymentCents',
  )
  const rawOneTimeRepayments =
    plan?.oneTimeAdditionalRepayments === undefined ? [] : plan.oneTimeAdditionalRepayments

  if (!Array.isArray(rawOneTimeRepayments)) {
    return validationFailure(
      financialValidationErrorCodes.invalidType,
      'oneTimeAdditionalRepayments',
      'oneTimeAdditionalRepayments must be an array',
      rawOneTimeRepayments,
    )
  }

  const seenMonths = new Set<number>()
  const oneTimeRepayments = rawOneTimeRepayments.map((repayment, index) => {
    const normalized = normalizeOneTimeRepayment(repayment, index)

    if (seenMonths.has(normalized.month)) {
      return validationFailure(
        financialValidationErrorCodes.outOfRange,
        'oneTimeAdditionalRepayments[' + index + '].month',
        'one-time additional repayment months must be unique',
        normalized.month,
      )
    }

    seenMonths.add(normalized.month)
    return normalized
  })

  return {
    annualAdditionalRepaymentCents: annualAmount,
    annualAdditionalRepaymentMonth: annualPaymentMonth(plan?.annualAdditionalRepaymentMonth),
    oneTimeAdditionalRepayments: oneTimeRepayments,
  }
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

function eligibleAdditionalRepayment(
  plan: NormalizedAdditionalRepaymentPlan,
  oneTimeRepaymentsByMonth: ReadonlyMap<number, MoneyCents>,
  month: number,
  remainingBalance: MoneyCents,
): MoneyCents {
  const loanYearMonth = ((month - 1) % 12) + 1
  let eligible = moneyCents(0)

  if (loanYearMonth === plan.annualAdditionalRepaymentMonth) {
    eligible = addMoney(eligible, plan.annualAdditionalRepaymentCents)
  }

  const oneTimeRepayment = oneTimeRepaymentsByMonth.get(month)

  if (oneTimeRepayment !== undefined) {
    eligible = addMoney(eligible, oneTimeRepayment)
  }

  return minMoney(remainingBalance, eligible)
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
    firstYearAdditionalPrincipalCents: zero,
    interestThroughFixedPeriodCents: zero,
    scheduledPrincipalThroughFixedPeriodCents: zero,
    additionalPrincipalThroughFixedPeriodCents: zero,
    remainingDebtAtFixedPeriodCents: zero,
    projectedLifetimeInterestCents: zero,
    projectedLifetimeScheduledPrincipalCents: zero,
    projectedLifetimeAdditionalPrincipalCents: zero,
  }
}

function calculateMortgageSchedule(
  payment: MortgagePayment,
  fixedInterestMonths: number,
  selectedMonth: number | null,
  additionalRepayments: NormalizedAdditionalRepaymentPlan,
): AmortizationScheduleResult {
  const principal = nonNegativeMoneyCents(payment.principalCents, 'principalCents')
  const contractualPayment = nonNegativeMoneyCents(
    payment.monthlyPaymentCents,
    'contractualMonthlyPaymentCents',
  )
  const oneTimeRepaymentsByMonth = new Map(
    additionalRepayments.oneTimeAdditionalRepayments.map((repayment) => [
      repayment.month,
      repayment.amountCents,
    ]),
  )
  const zero = moneyCents(0)
  const rows: AmortizationScheduleRow[] = []
  let openingBalance = principal
  let cumulativeInterest = zero
  let cumulativeScheduledPrincipal = zero
  let cumulativeAdditionalPrincipal = zero
  let firstYearInterest = zero
  let firstYearScheduledPrincipal = zero
  let firstYearAdditionalPrincipal = zero
  let fixedPeriodInterest = zero
  let fixedPeriodScheduledPrincipal = zero
  let fixedPeriodAdditionalPrincipal = zero

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
    const balanceAfterRegular = subtractMoney(openingBalance, scheduledPrincipal)
    const additionalPrincipal = eligibleAdditionalRepayment(
      additionalRepayments,
      oneTimeRepaymentsByMonth,
      month,
      balanceAfterRegular,
    )
    const closingBalance = subtractMoney(balanceAfterRegular, additionalPrincipal)
    const totalPayment = addMoney(regularPayment, additionalPrincipal)

    cumulativeInterest = addMoney(cumulativeInterest, interest)
    cumulativeScheduledPrincipal = addMoney(cumulativeScheduledPrincipal, scheduledPrincipal)
    cumulativeAdditionalPrincipal = addMoney(cumulativeAdditionalPrincipal, additionalPrincipal)

    if (month <= 12) {
      firstYearInterest = addMoney(firstYearInterest, interest)
      firstYearScheduledPrincipal = addMoney(firstYearScheduledPrincipal, scheduledPrincipal)
      firstYearAdditionalPrincipal = addMoney(firstYearAdditionalPrincipal, additionalPrincipal)
    }

    if (month <= fixedInterestMonths) {
      fixedPeriodInterest = addMoney(fixedPeriodInterest, interest)
      fixedPeriodScheduledPrincipal = addMoney(fixedPeriodScheduledPrincipal, scheduledPrincipal)
      fixedPeriodAdditionalPrincipal = addMoney(fixedPeriodAdditionalPrincipal, additionalPrincipal)
    }

    rows.push({
      month,
      openingBalanceCents: openingBalance,
      contractualPaymentCents: contractualPayment,
      interestCents: interest,
      scheduledPrincipalCents: scheduledPrincipal,
      additionalPrincipalCents: additionalPrincipal,
      regularPaymentCents: regularPayment,
      totalPaymentCents: totalPayment,
      closingBalanceCents: closingBalance,
      cumulativeInterestCents: cumulativeInterest,
      cumulativeScheduledPrincipalCents: cumulativeScheduledPrincipal,
      cumulativeAdditionalPrincipalCents: cumulativeAdditionalPrincipal,
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
        firstYearAdditionalPrincipalCents: firstYearAdditionalPrincipal,
        interestThroughFixedPeriodCents: fixedPeriodInterest,
        scheduledPrincipalThroughFixedPeriodCents: fixedPeriodScheduledPrincipal,
        additionalPrincipalThroughFixedPeriodCents: fixedPeriodAdditionalPrincipal,
        remainingDebtAtFixedPeriodCents: remainingDebtAtMonth(rows, principal, fixedInterestMonths),
        projectedLifetimeInterestCents: cumulativeInterest,
        projectedLifetimeScheduledPrincipalCents: cumulativeScheduledPrincipal,
        projectedLifetimeAdditionalPrincipalCents: cumulativeAdditionalPrincipal,
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
    cumulativeAdditionalPrincipalCents: cumulativeAdditionalPrincipal,
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
  const additionalRepayments = normalizeAdditionalRepaymentPlan(input.additionalRepayments)

  if (input.payment.cashPurchase) {
    if (input.fixedInterestMonths !== undefined) {
      positiveWholeMonth(input.fixedInterestMonths, 'fixedInterestMonths')
    }

    return cashPurchaseSchedule(input.payment, selectedMonth)
  }

  const fixedInterestMonths = positiveWholeMonth(input.fixedInterestMonths, 'fixedInterestMonths')

  return calculateMortgageSchedule(
    input.payment,
    fixedInterestMonths,
    selectedMonth,
    additionalRepayments,
  )
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
