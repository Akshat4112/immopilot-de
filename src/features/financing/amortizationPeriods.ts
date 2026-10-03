import type {
  AmortizationScheduleRow,
  MortgageAmortizationScheduleResult,
} from '../../domain/mortgage/amortization-types'
import { sumMoney } from '../../domain/shared/money'

export type AmortizationHorizon = 'fixed' | 'full'
export type AmortizationDetail = 'annual' | 'monthly'

export interface AmortizationPeriod extends Pick<
  AmortizationScheduleRow,
  | 'openingBalanceCents'
  | 'regularPaymentCents'
  | 'interestCents'
  | 'scheduledPrincipalCents'
  | 'additionalPrincipalCents'
  | 'totalPaymentCents'
  | 'closingBalanceCents'
> {
  firstMonth: number
  lastMonth: number
  loanYear: number
}

/** Presentation only: sums actual payment flows; balances remain endpoint stocks. */
export function createAmortizationPeriods(
  schedule: MortgageAmortizationScheduleResult,
  horizon: AmortizationHorizon,
  detail: AmortizationDetail,
): AmortizationPeriod[] {
  const monthlyRows =
    horizon === 'fixed' ? schedule.rows.slice(0, schedule.fixedInterestMonths) : schedule.rows
  const step = detail === 'annual' ? 12 : 1
  const periods: AmortizationPeriod[] = []
  for (let index = 0; index < monthlyRows.length; index += step) {
    const rows = monthlyRows.slice(index, index + step)
    const first = rows[0]
    const last = rows.at(-1)
    if (!first || !last) continue
    periods.push({
      firstMonth: first.month,
      lastMonth: last.month,
      loanYear: Math.ceil(first.month / 12),
      openingBalanceCents: first.openingBalanceCents,
      regularPaymentCents: sumMoney(rows.map((row) => row.regularPaymentCents)),
      interestCents: sumMoney(rows.map((row) => row.interestCents)),
      scheduledPrincipalCents: sumMoney(rows.map((row) => row.scheduledPrincipalCents)),
      additionalPrincipalCents: sumMoney(rows.map((row) => row.additionalPrincipalCents)),
      totalPaymentCents: sumMoney(rows.map((row) => row.totalPaymentCents)),
      closingBalanceCents: last.closingBalanceCents,
    })
  }
  return periods
}
