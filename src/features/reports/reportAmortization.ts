import { FinancialValidationError } from '../../domain/shared/validation'
import { createAmortizationPeriods } from '../financing/amortizationPeriods'
import { createPaymentCompositionChart } from '../financing/paymentCompositionChart'
import { createRemainingDebtChart, type DebtChartSchedule } from '../financing/remainingDebtChart'
import type { ReportProperty } from './reportSnapshot'

export function reportPeriods(
  schedule: DebtChartSchedule['schedule'],
  detail: 'annual' | 'monthly',
) {
  try {
    return createAmortizationPeriods(schedule, 'full', detail)
  } catch (error) {
    if (error instanceof FinancialValidationError && error.code === 'ARITHMETIC_OVERFLOW')
      return null
    throw error
  }
}

/** Presentation models consume captured rows, never recalculate financial results or mutate inputs. */
export function createReportAmortization(property: ReportProperty) {
  const {
    amortization: baseline,
    selectedAmortization: selected,
    selectedAmortizationBasis: basis,
  } = property.results
  const schedules: DebtChartSchedule[] = []
  if (baseline.status === 'available' && !baseline.cashPurchase)
    schedules.push({ id: 'baseline', schedule: baseline })
  if (
    basis === 'additional-repayments' &&
    selected.status === 'available' &&
    !selected.cashPurchase
  )
    schedules.push({ id: 'additional-repayments', schedule: selected })
  const selectedUnavailable = basis === 'unavailable' || selected.status === 'unavailable'
  const commonHorizonMonth = Math.max(0, ...schedules.map(({ schedule }) => schedule.payoffMonth))
  const annualSchedule = schedules.at(-1)
  let paymentChart = null
  if (schedules.length) {
    try {
      paymentChart = createPaymentCompositionChart(schedules, 'full', 'annual', commonHorizonMonth)
    } catch (error) {
      if (!(error instanceof FinancialValidationError && error.code === 'ARITHMETIC_OVERFLOW'))
        throw error
    }
  }
  return {
    schedules,
    annualSchedule,
    annualPeriods: annualSchedule ? reportPeriods(annualSchedule.schedule, 'annual') : null,
    selectedUnavailable,
    cashPurchase: baseline.status === 'available' && baseline.cashPurchase,
    debtChart: schedules.length
      ? createRemainingDebtChart(schedules, 'full', 'annual', commonHorizonMonth)
      : null,
    paymentChart,
  }
}

export type ReportAmortization = ReturnType<typeof createReportAmortization>
