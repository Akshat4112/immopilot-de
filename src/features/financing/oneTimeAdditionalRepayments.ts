import type { OneTimeAdditionalRepaymentDraft } from '../scenario-workspace'
import type { SupportedLanguage } from '../../i18n/resources'
import { validateAdditionalRepaymentAmount } from './annualAdditionalRepayment'

export type OneTimeAdditionalRepaymentIssue =
  | 'missing-amount'
  | 'invalid-amount'
  | 'negative-amount'
  | 'missing-month'
  | 'invalid-month'
  | 'duplicate-month'

export interface OneTimeAdditionalRepaymentValidation {
  amountCents: number | null
  month: number | null
  amountIssue?: OneTimeAdditionalRepaymentIssue
  monthIssue?: OneTimeAdditionalRepaymentIssue
}

function validateLoanMonth(value: string) {
  if (!value.trim()) return { month: null, issue: 'missing-month' as const }
  if (!/^[1-9]\d*$/u.test(value)) return { month: null, issue: 'invalid-month' as const }
  const month = Number(value)
  return Number.isSafeInteger(month) && month <= 1_200
    ? { month }
    : { month: null, issue: 'invalid-month' as const }
}

export function validateOneTimeAdditionalRepayments(
  rows: readonly OneTimeAdditionalRepaymentDraft[],
  language: SupportedLanguage,
): OneTimeAdditionalRepaymentValidation[] {
  const validations = rows.map((row) => {
    const amountValidation = validateAdditionalRepaymentAmount(row.amount, language)
    const monthValidation = validateLoanMonth(row.month)
    return {
      amountCents: amountValidation.amountCents,
      month: monthValidation.month,
      amountIssue: !row.amount.trim() ? ('missing-amount' as const) : amountValidation.issue,
      monthIssue: monthValidation.issue,
    }
  })

  const monthCounts = new Map<number, number>()
  for (const validation of validations) {
    if (validation.month !== null) {
      monthCounts.set(validation.month, (monthCounts.get(validation.month) ?? 0) + 1)
    }
  }

  return validations.map((validation) =>
    validation.month !== null && (monthCounts.get(validation.month) ?? 0) > 1
      ? { ...validation, monthIssue: 'duplicate-month' }
      : validation,
  )
}
