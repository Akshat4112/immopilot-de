import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { AmortizationScheduleResult } from '../../domain/mortgage/amortization-types'
import { formatEuroFromCents, formatNumber } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

interface AmortizationBreakdownProps {
  baseline: AmortizationScheduleResult
  selected: AmortizationScheduleResult
  selectedBasis: 'baseline' | 'additional-repayments' | 'unavailable'
}

function languageForFormatting(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de'
}

function availableLoanSchedule(schedule: AmortizationScheduleResult) {
  return schedule.status === 'available' && !schedule.cashPurchase ? schedule : undefined
}

export function AmortizationBreakdown({
  baseline,
  selected,
  selectedBasis,
}: AmortizationBreakdownProps) {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const language = languageForFormatting(i18n.resolvedLanguage ?? i18n.language)
  const baselineSchedule = availableLoanSchedule(baseline)
  const selectedSchedule = availableLoanSchedule(selected)

  if (!baselineSchedule) return null

  const schedules = [
    {
      id: 'baseline',
      title: t('finance.results.breakdown.baseline'),
      schedule: baselineSchedule,
    },
    ...(selectedBasis === 'additional-repayments' && selectedSchedule
      ? [
          {
            id: 'additional-repayments',
            title: t('finance.results.breakdown.withAdditionalRepayments'),
            schedule: selectedSchedule,
          },
        ]
      : []),
  ]

  return (
    <details
      className="amortization-breakdown"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{t('finance.results.breakdown.open')}</summary>
      {open ? (
        <>
          <p>{t('finance.results.breakdown.intro')}</p>
          {schedules.map(({ id, title, schedule }) => {
            const rows = schedule.rows.slice(0, schedule.fixedInterestMonths)
            const headingId = `amortization-${id}-heading`
            return (
              <section aria-labelledby={headingId} className="amortization-schedule" key={id}>
                <h3 id={headingId}>{title}</h3>
                <p className="result-detail">
                  {t('finance.results.breakdown.fixedPeriodOnly', {
                    months: formatNumber(schedule.fixedInterestMonths, language),
                  })}
                </p>
                <div
                  aria-label={t('finance.results.breakdown.scrollLabel', { title })}
                  className="amortization-table-scroll"
                  role="region"
                  tabIndex={0}
                >
                  <table className="amortization-table">
                    <caption>{title}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t('finance.results.breakdown.month')}</th>
                        <th scope="col">{t('finance.results.breakdown.regularPayment')}</th>
                        <th scope="col">{t('finance.results.breakdown.interest')}</th>
                        <th scope="col">{t('finance.results.breakdown.scheduledPrincipal')}</th>
                        <th scope="col">{t('finance.results.breakdown.additionalPrincipal')}</th>
                        <th scope="col">{t('finance.results.breakdown.totalPayment')}</th>
                        <th scope="col">{t('finance.results.breakdown.closingBalance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.month}>
                          <th scope="row">{formatNumber(row.month, language)}</th>
                          <td>{formatEuroFromCents(row.regularPaymentCents, language)}</td>
                          <td>{formatEuroFromCents(row.interestCents, language)}</td>
                          <td>{formatEuroFromCents(row.scheduledPrincipalCents, language)}</td>
                          <td>{formatEuroFromCents(row.additionalPrincipalCents, language)}</td>
                          <td>{formatEuroFromCents(row.totalPaymentCents, language)}</td>
                          <td>{formatEuroFromCents(row.closingBalanceCents, language)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
          <p className="result-detail">{t('finance.results.breakdown.projectionBoundary')}</p>
        </>
      ) : null}
    </details>
  )
}
