import type { MortgageAmortizationScheduleResult } from '../../domain/mortgage/amortization-types'
import type { MoneyCents } from '../../domain/shared/money'
import type { AmortizationDetail, AmortizationHorizon } from './amortizationPeriods'

export interface DebtChartSchedule {
  id: 'baseline' | 'additional-repayments'
  schedule: MortgageAmortizationScheduleResult
}

/** Chart presentation only. Zero after payoff never creates payment or savings rows. */
export function createRemainingDebtChart(
  schedules: readonly DebtChartSchedule[],
  horizon: AmortizationHorizon,
  detail: AmortizationDetail,
  commonHorizonMonth: number,
) {
  const fixedMonth = schedules[0]!.schedule.fixedInterestMonths
  const endMonth =
    horizon === 'fixed'
      ? Math.min(
          commonHorizonMonth,
          Math.max(...schedules.map(({ schedule }) => schedule.payoffMonth)),
        )
      : commonHorizonMonth
  const months = new Set([0, endMonth])
  for (
    let month = detail === 'annual' ? 12 : 1;
    month < endMonth;
    month += detail === 'annual' ? 12 : 1
  )
    months.add(month)
  if (fixedMonth <= endMonth) months.add(fixedMonth)
  for (const { schedule } of schedules)
    if (schedule.payoffMonth <= endMonth) months.add(schedule.payoffMonth)
  const sortedMonths = [...months].sort((a, b) => a - b)
  return {
    fixedMonth,
    endMonth,
    months: sortedMonths,
    maximumBalanceCents: Math.max(...schedules.map(({ schedule }) => schedule.principalCents)),
    series: schedules.map(({ id, schedule }) => ({
      id,
      payoffMonth: schedule.payoffMonth,
      points: sortedMonths.map((month) => ({
        month,
        balanceCents:
          month === 0
            ? schedule.principalCents
            : month > schedule.payoffMonth
              ? (0 as MoneyCents)
              : schedule.rows[month - 1]!.closingBalanceCents,
      })),
    })),
  }
}
