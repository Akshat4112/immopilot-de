import {
  createAmortizationPeriods,
  type AmortizationDetail,
  type AmortizationHorizon,
} from './amortizationPeriods'
import type { DebtChartSchedule } from './remainingDebtChart'

/** Shared loan-period slots, with actual cash flows only; payoff never creates extra rows. */
export function createPaymentCompositionChart(
  schedules: readonly DebtChartSchedule[],
  horizon: AmortizationHorizon,
  detail: AmortizationDetail,
  commonHorizonMonth: number,
) {
  const endMonth =
    horizon === 'fixed'
      ? Math.min(commonHorizonMonth, Math.max(...schedules.map((s) => s.schedule.payoffMonth)))
      : commonHorizonMonth
  const step = detail === 'annual' ? 12 : 1
  const columns = Array.from({ length: Math.ceil(endMonth / step) }, (_, index) => ({
    firstMonth: index * step + 1,
    lastMonth: Math.min((index + 1) * step, endMonth),
    loanYear: Math.floor((index * step) / 12) + 1,
  }))
  const series = schedules.map(({ id, schedule }) => ({
    id,
    payoffMonth: schedule.payoffMonth,
    periods: new Map(
      createAmortizationPeriods(schedule, horizon, detail).map((period) => [
        period.firstMonth,
        period,
      ]),
    ),
  }))
  return {
    endMonth,
    step,
    columns,
    series,
    fixedMonth: schedules[0]!.schedule.fixedInterestMonths,
    maximumPaymentCents: Math.max(
      1,
      ...series.flatMap((s) => [...s.periods.values()].map((p) => p.totalPaymentCents)),
    ),
  }
}
