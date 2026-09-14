import { subtractMoney } from '../shared'

import type {
  AdditionalRepaymentComparisonInput,
  AdditionalRepaymentComparisonResult,
} from './additional-repayment-types'
import { calculateAmortizationSchedule } from './calculate-amortization'
import type { AmortizationScheduleInput } from './amortization-types'

function scheduleInput(
  input: AdditionalRepaymentComparisonInput,
  includeAdditionalRepayments: boolean,
): AmortizationScheduleInput {
  return {
    payment: input.payment,
    ...(input.fixedInterestMonths === undefined
      ? {}
      : { fixedInterestMonths: input.fixedInterestMonths }),
    ...(input.selectedMonth === undefined ? {} : { selectedMonth: input.selectedMonth }),
    ...(includeAdditionalRepayments ? { additionalRepayments: input.additionalRepayments } : {}),
  }
}

export function calculateAdditionalRepaymentComparison(
  input: AdditionalRepaymentComparisonInput,
): AdditionalRepaymentComparisonResult {
  const baseline = calculateAmortizationSchedule(scheduleInput(input, false))

  if (baseline.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'BASELINE_SCHEDULE_UNAVAILABLE',
      schedule: baseline,
    }
  }

  const withAdditionalRepayments = calculateAmortizationSchedule(scheduleInput(input, true))

  if (withAdditionalRepayments.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'ADDITIONAL_REPAYMENT_SCHEDULE_UNAVAILABLE',
      schedule: withAdditionalRepayments,
    }
  }

  return {
    status: 'available',
    cashPurchase: baseline.cashPurchase,
    baseline,
    withAdditionalRepayments,
    interestSavedThroughFixedPeriodCents: subtractMoney(
      baseline.interestThroughFixedPeriodCents,
      withAdditionalRepayments.interestThroughFixedPeriodCents,
    ),
    projectedLifetimeInterestSavedCents: subtractMoney(
      baseline.projectedLifetimeInterestCents,
      withAdditionalRepayments.projectedLifetimeInterestCents,
    ),
    timeSavedMonths: baseline.payoffMonth - withAdditionalRepayments.payoffMonth,
  }
}
