import type { SupportedLanguage } from './resources'

const locales: Record<SupportedLanguage, string> = { de: 'de-DE', en: 'en-GB' }
const euroFormatters = new Map<string, Intl.NumberFormat>()
const numberFormatters = new Map<string, Intl.NumberFormat>()

export function formatEuroFromCents(
  cents: number,
  language: SupportedLanguage,
  fractionDigits = cents % 100 === 0 ? 0 : 2,
) {
  const key = `${language}:${fractionDigits}`
  let formatter = euroFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locales[language], {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    euroFormatters.set(key, formatter)
  }
  return formatter.format(cents / 100)
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
  const key = `${language}:${maximumFractionDigits}`
  let formatter = numberFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locales[language], { maximumFractionDigits })
    numberFormatters.set(key, formatter)
  }
  return formatter.format(value)
}

export function formatDate(date: string, language: SupportedLanguage) {
  return new Intl.DateTimeFormat(locales[language], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
