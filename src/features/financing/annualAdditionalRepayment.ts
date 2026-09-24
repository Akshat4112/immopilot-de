import type { SupportedLanguage } from '../../i18n/resources'

export type AnnualAdditionalRepaymentIssue = 'invalid-amount' | 'negative-amount' | 'invalid-month'

export interface AnnualAdditionalRepaymentValidation {
  amountCents: number | null
  amountIssue?: AnnualAdditionalRepaymentIssue
  monthIssue?: AnnualAdditionalRepaymentIssue
}

function normalizedAmount(value: string, language: SupportedLanguage) {
  const withoutCurrency = value.trim().replace(/[€\s]/gu, '')
  const format =
    language === 'en'
      ? /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/u
      : /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/u

  if (!format.test(withoutCurrency)) return null
  return language === 'en'
    ? withoutCurrency.replaceAll(',', '')
    : withoutCurrency.replaceAll('.', '').replace(',', '.')
}

export function validateAnnualAdditionalRepayment(
  amount: string,
  month: string,
  language: SupportedLanguage,
): AnnualAdditionalRepaymentValidation {
  if (!amount.trim()) return { amountCents: 0 }
  if (amount.trim().replace(/[€\s]/gu, '').startsWith('-')) {
    return { amountCents: null, amountIssue: 'negative-amount' }
  }

  const normalized = normalizedAmount(amount, language)
  if (normalized === null) return { amountCents: null, amountIssue: 'invalid-amount' }

  const amountCents = Math.round(Number(normalized) * 100)
  if (!Number.isSafeInteger(amountCents)) {
    return { amountCents: null, amountIssue: 'invalid-amount' }
  }

  if (amountCents > 0 && !/^(?:[1-9]|1[0-2])$/u.test(month)) {
    return { amountCents, monthIssue: 'invalid-month' }
  }

  return { amountCents }
}
