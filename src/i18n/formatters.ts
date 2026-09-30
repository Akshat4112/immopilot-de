import type { SupportedLanguage } from './resources'

const locales: Record<SupportedLanguage, string> = { de: 'de-DE', en: 'en-GB' }

export function formatEuroFromCents(
  cents: number,
  language: SupportedLanguage,
  fractionDigits = cents % 100 === 0 ? 0 : 2,
) {
  return new Intl.NumberFormat(locales[language], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100)
}

export function formatPercentage(
  decimalRate: number,
  language: SupportedLanguage,
  fractionDigits = 2,
) {
  return new Intl.NumberFormat(locales[language], {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(decimalRate)
}

export function formatNumber(
  value: number,
  language: SupportedLanguage,
  maximumFractionDigits = 2,
) {
  return new Intl.NumberFormat(locales[language], { maximumFractionDigits }).format(value)
}

export function formatDate(date: string, language: SupportedLanguage) {
  return new Intl.DateTimeFormat(locales[language], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
