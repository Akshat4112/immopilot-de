import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  AmortizationScheduleResult,
  MortgageAmortizationScheduleResult,
} from '../../domain/mortgage/amortization-types'
import { formatEuroFromCents, formatNumber } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

interface AmortizationBreakdownProps {
  baseline: AmortizationScheduleResult
  selected: AmortizationScheduleResult
  selectedBasis: 'baseline' | 'additional-repayments' | 'unavailable'
  inputKey: string
}

const pageSize = 24

function languageForFormatting(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de'
}

function availableLoanSchedule(schedule: AmortizationScheduleResult) {
  return schedule.status === 'available' && !schedule.cashPurchase ? schedule : undefined
}

function ScheduleTable({
  id,
  title,
  schedule,
  language,
}: {
  id: string
  title: string
  schedule: MortgageAmortizationScheduleResult
  language: SupportedLanguage
}) {
  const { t } = useTranslation()
  const [requestedPage, setPage] = useState(0)
  const pageCount = Math.ceil(schedule.rows.length / pageSize)
  const page = Math.min(requestedPage, pageCount - 1)
  const rows = schedule.rows.slice(page * pageSize, (page + 1) * pageSize)
  const headingId = `amortization-${id}-heading`
  const tableId = `amortization-${id}-table`
  return (
    <section aria-labelledby={headingId} className="amortization-schedule">
      <h3 id={headingId}>{title}</h3>
      <p className="result-detail">
        {t('finance.results.breakdown.fullSchedule', {
          months: formatNumber(schedule.payoffMonth, language),
          fixedMonths: formatNumber(schedule.fixedInterestMonths, language),
        })}
      </p>
      <p className="result-detail">
        {t(
          schedule.payoffMonth <= schedule.fixedInterestMonths
            ? 'finance.results.breakdown.payoffWithinFixedPeriod'
            : 'finance.results.breakdown.projectionBoundary',
        )}
      </p>
      <div
        aria-label={t('finance.results.breakdown.scrollLabel', { title })}
        className="amortization-table-scroll"
        role="region"
        tabIndex={0}
      >
        <table className="amortization-table" id={tableId}>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">{t('finance.results.breakdown.month')}</th>
              <th scope="col">{t('finance.results.breakdown.openingBalance')}</th>
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
                <th scope="row">
                  {formatNumber(row.month, language)}
                  {row.month === schedule.fixedInterestMonths ? (
                    <small className="amortization-period-marker">
                      {t('finance.results.breakdown.fixedPeriodEnd')}
                    </small>
                  ) : null}
                  {row.month > schedule.fixedInterestMonths ? (
                    <small className="amortization-period-marker">
                      {t('finance.results.breakdown.projectedPeriod')}
                    </small>
                  ) : null}
                  {row.month === schedule.payoffMonth ? (
                    <small className="amortization-period-marker">
                      {t('finance.results.breakdown.payoff')}
                    </small>
                  ) : null}
                </th>
                <td>{formatEuroFromCents(row.openingBalanceCents, language)}</td>
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
      <div className="amortization-pagination">
        <p aria-live="polite" role="status">
          {t('finance.results.breakdown.pageRange', {
            first: formatNumber(rows[0]?.month ?? 0, language),
            last: formatNumber(rows.at(-1)?.month ?? 0, language),
            total: formatNumber(schedule.rows.length, language),
            page: formatNumber(page + 1, language),
            pages: formatNumber(pageCount, language),
          })}
        </p>
        <nav aria-label={t('finance.results.breakdown.paginationLabel', { title })}>
          <button
            aria-controls={tableId}
            disabled={page === 0}
            onClick={() => setPage(0)}
            type="button"
          >
            {t('finance.results.breakdown.firstPage')}
          </button>
          <button
            aria-controls={tableId}
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, Math.min(current, pageCount - 1) - 1))}
            type="button"
          >
            {t('finance.results.breakdown.previousPage')}
          </button>
          <button
            aria-controls={tableId}
            disabled={page === pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            type="button"
          >
            {t('finance.results.breakdown.nextPage')}
          </button>
          <button
            aria-controls={tableId}
            disabled={page === pageCount - 1}
            onClick={() => setPage(pageCount - 1)}
            type="button"
          >
            {t('finance.results.breakdown.lastPage')}
          </button>
        </nav>
      </div>
    </section>
  )
}

export function AmortizationBreakdown({
  baseline,
  selected,
  selectedBasis,
  inputKey,
}: AmortizationBreakdownProps) {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const language = languageForFormatting(i18n.resolvedLanguage ?? i18n.language)
  const baselineSchedule = availableLoanSchedule(baseline)
  const selectedSchedule = availableLoanSchedule(selected)

  const schedules = [
    ...(baselineSchedule
      ? [
          {
            id: 'baseline',
            title: t('finance.results.breakdown.baseline'),
            schedule: baselineSchedule,
          },
        ]
      : []),
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
          {baseline.status === 'available' && baseline.cashPurchase ? (
            <p role="status">{t('finance.results.breakdown.cashPurchase')}</p>
          ) : !baselineSchedule ? (
            <p role="status">{t('finance.unavailable.scheduleMessage')}</p>
          ) : (
            <>
              <p>{t('finance.results.breakdown.intro')}</p>
              {selectedBasis === 'unavailable' ||
              (selectedBasis === 'additional-repayments' && !selectedSchedule) ? (
                <p className="amortization-schedule-warning" role="status">
                  {t('finance.results.breakdown.baselineReference')}
                </p>
              ) : selectedBasis === 'baseline' ? (
                <p className="result-detail">
                  {t('finance.results.breakdown.noAdditionalRepayments')}
                </p>
              ) : null}
              {schedules.map(({ id, title, schedule }) => (
                <ScheduleTable
                  id={id}
                  key={`${id}:${inputKey}`}
                  language={language}
                  schedule={schedule}
                  title={title}
                />
              ))}
            </>
          )}
        </>
      ) : null}
    </details>
  )
}
