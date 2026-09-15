import { subtractMoney } from '../shared'
import type { AdditionalRepaymentComparisonResult } from './additional-repayment-types'
import type {
  AmortizationScheduleResult,
  AvailableAmortizationScheduleResult,
} from './amortization-types'
import type {
  AvailableFixedPeriodResult,
  FixedPeriodComparisonResult,
  FixedPeriodResult,
  RefinancingEligibility,
} from './fixed-period-types'

function summarizeAvailableSchedule(
  schedule: AvailableAmortizationScheduleResult,
): AvailableFixedPeriodResult {
  const refinancing: RefinancingEligibility = schedule.cashPurchase
    ? { status: 'not-applicable', reason: 'CASH_PURCHASE' }
    : schedule.remainingDebtAtFixedPeriodCents === 0
      ? { status: 'not-applicable', reason: 'PAID_OFF' }
      : { status: 'applicable', remainingDebtCents: schedule.remainingDebtAtFixedPeriodCents }

  return {
    status: 'available',
    cashPurchase: schedule.cashPurchase,
    fixedInterestMonths: schedule.fixedInterestMonths,
    remainingDebtCents: schedule.remainingDebtAtFixedPeriodCents,
    interestPaidCents: schedule.interestThroughFixedPeriodCents,
    scheduledPrincipalPaidCents: schedule.scheduledPrincipalThroughFixedPeriodCents,
    additionalPrincipalPaidCents: schedule.additionalPrincipalThroughFixedPeriodCents,
    refinancing,
    projectedPayoffMonth: schedule.payoffMonth,
    projectionAssumption: 'constant-initial-rate',
  }
}

export function calculateFixedPeriod(schedule: AmortizationScheduleResult): FixedPeriodResult {
  if (schedule.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'AMORTIZATION_SCHEDULE_UNAVAILABLE',
      schedule,
    }
  }

  return summarizeAvailableSchedule(schedule)
}

export function calculateFixedPeriodComparison(
  comparison: AdditionalRepaymentComparisonResult,
): FixedPeriodComparisonResult {
  if (comparison.status !== 'available') {
    return {
      status: 'unavailable',
      reason: 'ADDITIONAL_REPAYMENT_COMPARISON_UNAVAILABLE',
      comparison,
    }
  }

  const baseline = summarizeAvailableSchedule(comparison.baseline)
  const withAdditionalRepayments = summarizeAvailableSchedule(comparison.withAdditionalRepayments)

  if (baseline.fixedInterestMonths !== withAdditionalRepayments.fixedInterestMonths) {
    return {
      status: 'unavailable',
      reason: 'FIXED_PERIOD_MISMATCH',
      baselineFixedInterestMonths: baseline.fixedInterestMonths,
      additionalFixedInterestMonths: withAdditionalRepayments.fixedInterestMonths,
    }
  }

  return {
    status: 'available',
    fixedInterestMonths: baseline.fixedInterestMonths,
    baseline,
    withAdditionalRepayments,
    remainingDebtReductionCents: subtractMoney(
      baseline.remainingDebtCents,
      withAdditionalRepayments.remainingDebtCents,
    ),
  }
}
