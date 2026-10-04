import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  AmortizationScheduleResult,
  MortgageAmortizationScheduleResult,
} from '../../domain/mortgage/amortization-types'
import { FinancialValidationError } from '../../domain/shared/validation'
import { formatEuroFromCents, formatNumber } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import { AmortizationTableFrame } from './AmortizationTableFrame'
import { RemainingDebtChart } from './RemainingDebtChart'
import { PaymentCompositionChart } from './PaymentCompositionChart'
import {
  createAmortizationPeriods,
  type AmortizationDetail,
  type AmortizationHorizon,
} from './amortizationPeriods'

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
  horizon,
  detail,
}: {
  id: string
  title: string
  schedule: MortgageAmortizationScheduleResult
  language: SupportedLanguage
  horizon: AmortizationHorizon
  detail: AmortizationDetail
}) {
  const { t } = useTranslation()
  const [requestedPage, setPage] = useState(0)
  const periods = useMemo(() => {
    try {
      return createAmortizationPeriods(schedule, horizon, detail)
    } catch (error) {
      if (error instanceof FinancialValidationError && error.code === 'ARITHMETIC_OVERFLOW')
        return null
      throw error
    }
  }, [schedule, horizon, detail])
  const headingId = `amortization-${id}-heading`
  if (periods === null)
    return (
      <section aria-labelledby={headingId} className="amortization-schedule">
        <h3 id={headingId}>{title}</h3>
        <p className="result-detail">{t('finance.results.breakdown.annualUnavailable')}</p>
      </section>
    )
  const pageCount = Math.ceil(periods.length / pageSize)
  const page = Math.min(requestedPage, pageCount - 1)
  const rows = periods.slice(page * pageSize, (page + 1) * pageSize)
  const tableId = `amortization-${id}-table`
  const caption = `${title} · ${t(`finance.results.breakdown.horizon.${horizon}`)} · ${t(`finance.results.breakdown.detail.${detail}`)} · EUR`
  return (
    <section aria-labelledby={headingId} className="amortization-schedule">
      <h3 id={headingId}>{title}</h3>
      <p className="result-detail">
        {t(`finance.results.breakdown.${horizon === 'full' ? 'fullSchedule' : 'fixedSchedule'}`, {
          months: formatNumber(periods.at(-1)?.lastMonth ?? 0, language),
          fixedMonths: formatNumber(schedule.fixedInterestMonths, language),
        })}
      </p>
      <p className="result-detail">
        {t(
          schedule.payoffMonth <= schedule.fixedInterestMonths
            ? 'finance.results.breakdown.payoffWithinFixedPeriod'
            : horizon === 'full'
              ? 'finance.results.breakdown.projectionBoundary'
              : 'finance.results.breakdown.fixedPeriodOnly',
        )}
      </p>
      <AmortizationTableFrame caption={caption} title={title} tableId={tableId}>
        <thead>
          <tr>
            <th scope="col">
              {t(`finance.results.breakdown.${detail === 'annual' ? 'year' : 'month'}`)}
            </th>
            <th scope="col">{t('finance.results.breakdown.openingBalance')}</th>
            <th scope="col">
              {t(
                `finance.results.breakdown.${detail === 'annual' ? 'regularPaymentAnnual' : 'regularPayment'}`,
              )}
            </th>
            <th scope="col">{t('finance.results.breakdown.interest')}</th>
            <th scope="col">{t('finance.results.breakdown.scheduledPrincipal')}</th>
            <th scope="col">{t('finance.results.breakdown.additionalPrincipal')}</th>
            <th scope="col">{t('finance.results.breakdown.totalPayment')}</th>
            <th scope="col">{t('finance.results.breakdown.closingBalance')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.firstMonth}>
              <th scope="row">
                {detail === 'annual'
                  ? t('finance.results.breakdown.loanYear', {
                      year: formatNumber(row.loanYear, language),
                    })
                  : formatNumber(row.firstMonth, language)}
                {detail === 'annual' ? (
                  <small className="amortization-period-marker">
                    {t('finance.results.breakdown.monthRange', {
                      first: formatNumber(row.firstMonth, language),
                      last: formatNumber(row.lastMonth, language),
                    })}
                    {row.lastMonth - row.firstMonth + 1 < 12
                      ? ` · ${t('finance.results.breakdown.partialYear')}`
                      : ''}
                  </small>
                ) : null}
                {row.firstMonth <= schedule.fixedInterestMonths &&
                row.lastMonth >= schedule.fixedInterestMonths ? (
                  <small className="amortization-period-marker">
                    {t('finance.results.breakdown.fixedPeriodEndAt', {
                      month: formatNumber(schedule.fixedInterestMonths, language),
                    })}
                  </small>
                ) : null}
                {row.lastMonth > schedule.fixedInterestMonths ? (
                  <small className="amortization-period-marker">
                    {t(
                      row.firstMonth <= schedule.fixedInterestMonths
                        ? 'finance.results.breakdown.mixedPeriod'
                        : 'finance.results.breakdown.projectedPeriod',
                    )}
                  </small>
                ) : null}
                {row.lastMonth === schedule.payoffMonth ? (
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
      </AmortizationTableFrame>
      <div className="amortization-pagination">
        <p aria-live="polite" role="status">
          {t(`finance.results.breakdown.${detail === 'annual' ? 'annualPageRange' : 'pageRange'}`, {
            first: formatNumber(
              (detail === 'annual' ? rows[0]?.loanYear : rows[0]?.firstMonth) ?? 0,
              language,
            ),
            last: formatNumber(
              (detail === 'annual' ? rows.at(-1)?.loanYear : rows.at(-1)?.lastMonth) ?? 0,
              language,
            ),
            total: formatNumber(periods.length, language),
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
  const hasSelectedSchedule = selectedBasis === 'additional-repayments' && !!selectedSchedule
  const [horizon, setHorizon] = useState<AmortizationHorizon>('fixed')
  const [detail, setDetail] = useState<AmortizationDetail>('annual')
  const [scheduleChoice, setScheduleChoice] = useState<
    'baseline' | 'additional-repayments' | 'both'
  >('both')
  const [previousAvailability, setPreviousAvailability] = useState(hasSelectedSchedule)
  if (previousAvailability !== hasSelectedSchedule) {
    setPreviousAvailability(hasSelectedSchedule)
    if (!hasSelectedSchedule) setScheduleChoice('baseline')
  }
  const effectiveChoice = hasSelectedSchedule ? scheduleChoice : 'baseline'
  const commonHorizonMonth = baselineSchedule
    ? horizon === 'fixed'
      ? baselineSchedule.fixedInterestMonths
      : Math.max(
          baselineSchedule.payoffMonth,
          hasSelectedSchedule ? selectedSchedule.payoffMonth : 0,
        )
    : 0

  const schedules = [
    ...(baselineSchedule && effectiveChoice !== 'additional-repayments'
      ? [
          {
            id: 'baseline' as const,
            title: t('finance.results.breakdown.baseline'),
            schedule: baselineSchedule,
          },
        ]
      : []),
    ...(hasSelectedSchedule && selectedSchedule && effectiveChoice !== 'baseline'
      ? [
          {
            id: 'additional-repayments' as const,
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
            <div role="status">
              <p>{t('finance.unavailable.scheduleMessage')}</p>
              <p>{t('finance.results.breakdown.unavailableHelp')}</p>
            </div>
          ) : (
            <>
              <p>{t('finance.results.breakdown.intro')}</p>
              <div className="amortization-controls">
                <fieldset>
                  <legend>{t('finance.results.breakdown.horizon.label')}</legend>
                  {(['fixed', 'full'] as const).map((value) => (
                    <label key={value}>
                      <input
                        checked={horizon === value}
                        name="amortization-horizon"
                        onChange={() => setHorizon(value)}
                        type="radio"
                        value={value}
                      />
                      <span>{t(`finance.results.breakdown.horizon.${value}`)}</span>
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>{t('finance.results.breakdown.detail.label')}</legend>
                  {(['annual', 'monthly'] as const).map((value) => (
                    <label key={value}>
                      <input
                        checked={detail === value}
                        name="amortization-detail"
                        onChange={() => setDetail(value)}
                        type="radio"
                        value={value}
                      />
                      <span>{t(`finance.results.breakdown.detail.${value}`)}</span>
                    </label>
                  ))}
                </fieldset>
                <fieldset>
                  <legend>{t('finance.results.breakdown.schedule.label')}</legend>
                  {(['baseline', 'additional-repayments', 'both'] as const).map((value) => (
                    <label key={value}>
                      <input
                        checked={effectiveChoice === value}
                        disabled={value !== 'baseline' && !hasSelectedSchedule}
                        name="amortization-schedule"
                        onChange={() => setScheduleChoice(value)}
                        type="radio"
                        value={value}
                      />
                      <span>{t(`finance.results.breakdown.schedule.${value}`)}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <p className="result-detail amortization-view-basis">
                {t(
                  `finance.results.breakdown.${horizon === 'fixed' ? 'fixedHorizon' : 'fullHorizon'}`,
                  {
                    month: formatNumber(commonHorizonMonth, language),
                  },
                )}
                {detail === 'annual' ? ` ${t('finance.results.breakdown.annualBasis')}` : ''}
              </p>
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
              <RemainingDebtChart
                key={`debt:${inputKey}:${horizon}:${detail}:${effectiveChoice}`}
                schedules={schedules}
                horizon={horizon}
                detail={detail}
                commonHorizonMonth={commonHorizonMonth}
                language={language}
              />
              <PaymentCompositionChart
                key={`payments:${inputKey}:${horizon}:${detail}:${effectiveChoice}`}
                schedules={schedules}
                horizon={horizon}
                detail={detail}
                commonHorizonMonth={commonHorizonMonth}
                language={language}
              />
              {schedules.map(({ id, title, schedule }) => (
                <ScheduleTable
                  id={id}
                  key={`${id}:${inputKey}:${horizon}:${detail}:${effectiveChoice}`}
                  language={language}
                  schedule={schedule}
                  title={title}
                  horizon={horizon}
                  detail={detail}
                />
              ))}
            </>
          )}
        </>
      ) : null}
    </details>
  )
}
