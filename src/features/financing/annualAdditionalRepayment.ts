import type { SupportedLanguage } from '../../i18n/resources'

export type AnnualAdditionalRepaymentIssue = 'invalid-amount' | 'negative-amount' | 'invalid-month'

export interface AnnualAdditionalRepaymentValidation {
  amountCents: number | null
  amountIssue?: AnnualAdditionalRepaymentIssue
  monthIssue?: AnnualAdditionalRepaymentIssue
}

export type AdditionalRepaymentAmountIssue = 'invalid-amount' | 'negative-amount'

export interface AdditionalRepaymentAmountValidation {
  amountCents: number | null
  issue?: AdditionalRepaymentAmountIssue
}

export function validateAdditionalRepaymentAmount(
  value: string,
  language: SupportedLanguage,
): AdditionalRepaymentAmountValidation {
  if (!value.trim()) return { amountCents: 0 }
  if (value.trim().replace(/[€\s]/gu, '').startsWith('-')) {
    return { amountCents: null, issue: 'negative-amount' }
  }

  const withoutCurrency = value.trim().replace(/[€\s]/gu, '')
  const format =
    language === 'en'
      ? /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/u
      : /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/u

  if (!format.test(withoutCurrency)) return { amountCents: null, issue: 'invalid-amount' }
  const normalized =
    language === 'en'
      ? withoutCurrency.replaceAll(',', '')
      : withoutCurrency.replaceAll('.', '').replace(',', '.')

  const amountCents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(amountCents)
    ? { amountCents }
    : { amountCents: null, issue: 'invalid-amount' }
}

export function validateAnnualAdditionalRepayment(
  amount: string,
  month: string,
  language: SupportedLanguage,
): AnnualAdditionalRepaymentValidation {
  const amountValidation = validateAdditionalRepaymentAmount(amount, language)
  if (amountValidation.issue) {
    return { amountCents: null, amountIssue: amountValidation.issue }
  }
  const amountCents = amountValidation.amountCents ?? 0

  if (amountCents > 0 && !/^(?:[1-9]|1[0-2])$/u.test(month)) {
    return { amountCents, monthIssue: 'invalid-month' }
  }

  return { amountCents }
}
