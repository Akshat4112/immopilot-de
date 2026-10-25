import { useId, useMemo } from 'react'

import type { AmortizationPeriod } from '../financing/amortizationPeriods'
import type { SupportedLanguage } from '../../i18n/resources'
import {
  createReportAmortization,
  reportPeriods,
  type ReportAmortization,
} from './reportAmortization'
import { reportText, reportFormat } from './reportCopy'
import { ReportTable } from './ReportTable'
import type { ReportProperty } from './reportSnapshot'

const moneyFields = [
  'openingBalanceCents',
  'regularPaymentCents',
  'interestCents',
  'scheduledPrincipalCents',
  'additionalPrincipalCents',
  'totalPaymentCents',
  'closingBalanceCents',
] as const

export function ReportSchedule({
  periods,
  title,
  fixedMonth,
  payoffMonth,
  language,
  monthly = false,
}: {
  periods: readonly AmortizationPeriod[] | null
  title: string
  fixedMonth: number
  payoffMonth: number
  language: SupportedLanguage
  monthly?: boolean
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  if (!periods)
    return (
      <p className="report-warning">
        {t('Annual totals exceed the safe money range. Use the complete monthly appendix.')}
      </p>
    )
  return (
    <ReportTable
      caption={`${title} · EUR`}
      headers={[
        t(monthly ? 'Loan month' : 'Year'),
        t('Opening debt'),
        t(monthly ? 'Regular payment' : 'Regular payments (sum)'),
        t('Interest'),
        t('Scheduled principal'),
        t('Additional principal'),
        t('Total payment'),
        t('Closing debt'),
      ]}
      rows={periods.map((period) => [
        <span>
          {monthly ? f.number(period.firstMonth) : `${t('Year')} ${f.number(period.loanYear)}`}
          <small>
            {t('Months')} {f.number(period.firstMonth)}–{f.number(period.lastMonth)}
            {!monthly && period.lastMonth - period.firstMonth + 1 < 12
              ? ` · ${t('Partial year')}`
              : ''}
            {period.firstMonth <= fixedMonth && period.lastMonth >= fixedMonth
              ? ` · ${t('Fixed-interest boundary')}`
              : ''}
            {period.lastMonth > fixedMonth
              ? ` · ${t('Projection')}`
              : ` · ${t('Within fixed interest')}`}
            {period.lastMonth === payoffMonth ? ` · ${t('Payoff')}` : ''}
          </small>
        </span>,
        ...moneyFields.map((field) => f.money(period[field])),
      ])}
    />
  )
}

function DebtFigure({
  model,
  language,
}: {
  model: NonNullable<ReportAmortization['debtChart']>
  language: SupportedLanguage
}) {
  const id = useId()
  const t = reportText(language)
  const f = reportFormat(language)
  const x = (month: number) => 72 + (month / model.endMonth) * 610
  const y = (balance: number) => 250 - (balance / model.maximumBalanceCents) * 212
  return (
    <figure>
      <figcaption>{t('Remaining debt')} · EUR</figcaption>
      <svg viewBox="0 0 720 300" role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>{t('Remaining debt')}</title>
        <desc id={`${id}-description`}>
          {t('Baseline')} —; {t('With additional repayments')} – –. {t('Remaining-debt data')}:{' '}
          {t('Full projected repayment')}. {t('Fixed-interest boundary')}:{' '}
          {f.number(model.fixedMonth)}.
        </desc>
        <defs>
          <pattern id={`${id}-projection`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8L8 0" stroke="#aaa" strokeWidth=".5" />
          </pattern>
        </defs>
        {model.fixedMonth < model.endMonth ? (
          <rect
            x={x(model.fixedMonth)}
            y="32"
            width={x(model.endMonth) - x(model.fixedMonth)}
            height="218"
            fill={`url(#${id}-projection)`}
          />
        ) : null}
        <path d="M72 32V250H682" fill="none" stroke="#333" />
        <text x="72" y="23" textAnchor="start">
          {f.money(model.maximumBalanceCents)}
        </text>
        <text x="67" y="253" textAnchor="end">
          {f.money(0)}
        </text>
        {model.series.map((series) => (
          <g key={series.id}>
            <path
              data-report-debt-series={series.id}
              d={series.points
                .map(
                  (point, index) =>
                    `${index === 0 ? 'M' : 'L'}${x(point.month).toFixed(2)} ${y(point.balanceCents).toFixed(2)}`,
                )
                .join(' ')}
              fill="none"
              stroke={series.id === 'baseline' ? '#163f35' : '#6a4818'}
              strokeWidth="2.5"
              strokeDasharray={series.id === 'baseline' ? undefined : '7 4'}
            />
            {series.points
              .filter(
                (point) => point.month === series.payoffMonth || point.month === model.fixedMonth,
              )
              .map((point) =>
                series.id === 'baseline' ? (
                  <circle
                    key={point.month}
                    cx={x(point.month)}
                    cy={y(point.balanceCents)}
                    r="4"
                    fill="#163f35"
                  />
                ) : (
                  <path
                    key={point.month}
                    d={`M${x(point.month)} ${y(point.balanceCents) - 5}l5 5 -5 5 -5 -5Z`}
                    fill="#6a4818"
                  />
                ),
              )}
          </g>
        ))}
        {model.fixedMonth <= model.endMonth ? (
          <line
            x1={x(model.fixedMonth)}
            x2={x(model.fixedMonth)}
            y1="32"
            y2="250"
            stroke="#555"
            strokeDasharray="3 3"
          />
        ) : null}
        {[
          ...new Set([
            0,
            model.fixedMonth <= model.endMonth ? model.fixedMonth : 0,
            model.endMonth,
          ]),
        ].map((month) => (
          <text
            key={month}
            x={x(month)}
            y="274"
            textAnchor={month === 0 ? 'start' : month === model.endMonth ? 'end' : 'middle'}
          >
            {t('Loan month')} {f.number(month)}
          </text>
        ))}
      </svg>
      <p className="report-chart-key">
        {model.series
          .map(
            (series) =>
              `${series.id === 'baseline' ? '— ●' : '– – ◆'} ${t(series.id === 'baseline' ? 'Baseline' : 'With additional repayments')}`,
          )
          .join(' · ')}{' '}
        · {t('Fixed-interest boundary')}: {f.number(model.fixedMonth)}
      </p>
    </figure>
  )
}

function PaymentFigure({
  model,
  language,
}: {
  model: NonNullable<ReportAmortization['paymentChart']>
  language: SupportedLanguage
}) {
  const id = useId()
  const t = reportText(language)
  const f = reportFormat(language)
  const slot = 610 / model.columns.length
  const boundaryIndex = Math.floor((model.fixedMonth - 1) / model.step)
  const boundaryPeriod = model.columns[boundaryIndex]
  const boundaryX = boundaryPeriod
    ? 72 +
      (boundaryIndex +
        (model.fixedMonth - boundaryPeriod.firstMonth + 1) /
          (boundaryPeriod.lastMonth - boundaryPeriod.firstMonth + 1)) *
        slot
    : null
  const y = (value: number) => 250 - (value / model.maximumPaymentCents) * 212
  return (
    <figure>
      <figcaption>{t('Payment composition')} · EUR</figcaption>
      <svg viewBox="0 0 720 300" role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>{t('Payment composition')}</title>
        <desc id={`${id}-description`}>
          {t('Interest')}; {t('Scheduled principal')}; {t('Additional principal')}. {t('Baseline')}{' '}
          / {t('With additional repayments')}. {t('Payment-composition data')}.
        </desc>
        <defs>
          <pattern id={`${id}-principal`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#d0dfd9" />
            <path d="M0 6L6 0" stroke="#304d40" />
          </pattern>
          <pattern id={`${id}-extra`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#f2e3c6" />
            <circle cx="3" cy="3" r="1.2" fill="#5e421c" />
          </pattern>
          <pattern id={`${id}-projection`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8L8 0" stroke="#aaa" strokeWidth=".5" />
          </pattern>
        </defs>
        {boundaryX !== null && model.fixedMonth < model.endMonth ? (
          <rect
            data-report-projection="true"
            x={boundaryX}
            y="32"
            width={682 - boundaryX}
            height="218"
            fill={`url(#${id}-projection)`}
          />
        ) : null}
        <path d="M72 32V250H682" fill="none" stroke="#333" />
        <text x="72" y="23" textAnchor="start">
          {f.money(model.maximumPaymentCents)}
        </text>
        <text x="67" y="253" textAnchor="end">
          {f.money(0)}
        </text>
        {model.columns.map((column, index) =>
          model.series.map((series, scheduleIndex) => {
            const period = series.periods.get(column.firstMonth)
            if (!period) return null
            const left = 72 + index * slot + (scheduleIndex * slot) / model.series.length
            const width = Math.max(0.5, (slot / model.series.length) * 0.8)
            const layers = [
              period.interestCents,
              period.scheduledPrincipalCents,
              period.additionalPrincipalCents,
            ]
            let sum = 0
            return (
              <g key={`${index}-${series.id}`} data-report-payment-series={series.id}>
                {layers.map((value, layer) => {
                  sum += value
                  return (
                    <rect
                      key={layer}
                      x={left}
                      y={y(sum)}
                      width={width}
                      height={(value / model.maximumPaymentCents) * 212}
                      fill={
                        layer === 0
                          ? '#365e50'
                          : `url(#${id}-${layer === 1 ? 'principal' : 'extra'})`
                      }
                      stroke="#333"
                      strokeWidth=".35"
                    />
                  )
                })}
                <rect
                  x={left}
                  y={y(period.totalPaymentCents)}
                  width={width}
                  height={250 - y(period.totalPaymentCents)}
                  fill="none"
                  stroke="#111"
                  strokeWidth=".6"
                  strokeDasharray={series.id === 'baseline' ? undefined : '3 2'}
                />
              </g>
            )
          }),
        )}
        {boundaryX !== null ? (
          <line
            x1={boundaryX}
            x2={boundaryX}
            y1="32"
            y2="250"
            stroke="#555"
            strokeDasharray="3 3"
          />
        ) : null}
        {[0, Math.floor((model.columns.length - 1) / 2), model.columns.length - 1]
          .filter((value, index, all) => all.indexOf(value) === index)
          .map((index) => (
            <text key={index} x={72 + (index + 0.5) * slot} y="274" textAnchor="middle">
              {t('Year')} {f.number(index + 1)}
            </text>
          ))}
      </svg>
      <p className="report-chart-key">
        ■ {t('Interest')} · ╱ {t('Scheduled principal')} · • {t('Additional principal')}
        <br />
        {model.series
          .map((series) => t(series.id === 'baseline' ? 'Baseline' : 'With additional repayments'))
          .join(' / ')}{' '}
        · {t('Fixed-interest boundary')}: {f.number(model.fixedMonth)}
      </p>
    </figure>
  )
}

export function ReportAmortizationSection({
  property,
  language,
  monthly = false,
}: {
  property: ReportProperty
  language: SupportedLanguage
  monthly?: boolean
}) {
  const t = reportText(language)
  const f = reportFormat(language)
  const model = useMemo(() => createReportAmortization(property), [property])
  const title = (id: string) => t(id === 'baseline' ? 'Baseline' : 'With additional repayments')
  if (model.cashPurchase)
    return <p>{t('Cash purchase: no mortgage payments or repayment charts apply.')}</p>
  if (!model.schedules.length)
    return <p className="report-warning">{t('The requested repayment schedule is unavailable.')}</p>
  if (monthly)
    return (
      <>
        {model.schedules.map(({ id, schedule }) => (
          <ReportSchedule
            key={id}
            periods={reportPeriods(schedule, 'monthly')}
            title={`${t('Monthly appendix')} · ${title(id)}`}
            fixedMonth={schedule.fixedInterestMonths}
            payoffMonth={schedule.payoffMonth}
            language={language}
            monthly
          />
        ))}
      </>
    )
  const debt = model.debtChart!
  return (
    <>
      {model.selectedUnavailable ? (
        <p className="report-warning">
          {t('Baseline reference only: the requested repayment plan is unavailable.')}
        </p>
      ) : null}
      <p>{t('Amounts sum actual monthly payments in cents; debt uses period endpoints.')}</p>
      <p>
        {t(
          'Projection beyond the fixed-interest period assumes the initial nominal rate remains unchanged. Payoff timing is not a contractual term.',
        )}
      </p>
      <ReportSchedule
        periods={model.annualPeriods}
        title={title(model.annualSchedule!.id)}
        fixedMonth={model.annualSchedule!.schedule.fixedInterestMonths}
        payoffMonth={model.annualSchedule!.schedule.payoffMonth}
        language={language}
      />
      <DebtFigure model={debt} language={language} />
      <ReportTable
        caption={`${t('Remaining-debt data')} · EUR`}
        headers={[t('Loan month'), ...debt.series.map((series) => title(series.id))]}
        rows={debt.months.map((month, index) => [
          `${f.number(month)}${month === debt.fixedMonth ? ` · ${t('Fixed-interest boundary')}` : ''}${month > debt.fixedMonth ? ` · ${t('Projection')}` : ''}`,
          ...debt.series.map(
            (series) =>
              `${f.money(series.points[index]!.balanceCents)}${month === series.payoffMonth ? ` · ${t('Payoff')}` : month > series.payoffMonth ? ` · ${t('Already repaid; no further payments')}` : ''}`,
          ),
        ])}
      />
      {model.paymentChart ? (
        <>
          <PaymentFigure model={model.paymentChart} language={language} />
          <ReportTable
            caption={`${t('Payment-composition data')} · EUR`}
            headers={[
              t('Period'),
              t('Schedule'),
              t('Interest'),
              t('Scheduled principal'),
              t('Additional principal'),
              t('Regular payments (sum)'),
              t('Total payment'),
            ]}
            rows={model.paymentChart.columns.flatMap((column) =>
              model.paymentChart!.series.flatMap((series) => {
                const period = series.periods.get(column.firstMonth)
                return period
                  ? [
                      [
                        `${t('Year')} ${f.number(period.loanYear)} · ${t('Months')} ${f.number(period.firstMonth)}–${f.number(period.lastMonth)}${period.lastMonth - period.firstMonth + 1 < 12 ? ` · ${t('Partial year')}` : ''}${period.lastMonth > debt.fixedMonth ? ` · ${t('Projection')}` : ''}${period.lastMonth === series.payoffMonth ? ` · ${t('Payoff')}` : ''}`,
                        title(series.id),
                        ...[
                          period.interestCents,
                          period.scheduledPrincipalCents,
                          period.additionalPrincipalCents,
                          period.regularPaymentCents,
                          period.totalPaymentCents,
                        ].map(f.money),
                      ],
                    ]
                  : []
              }),
            )}
          />
        </>
      ) : (
        <p className="report-warning">
          {t('Annual totals exceed the safe money range. Use the complete monthly appendix.')}
        </p>
      )}
    </>
  )
}
