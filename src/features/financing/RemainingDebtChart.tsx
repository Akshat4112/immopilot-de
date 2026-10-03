import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatEuroFromCents, formatNumber } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import type { AmortizationDetail, AmortizationHorizon } from './amortizationPeriods'
import { createRemainingDebtChart, type DebtChartSchedule } from './remainingDebtChart'

const plot = { left: 100, right: 688, top: 38, bottom: 282 }

function Point({ x, y, baseline }: { x: number; y: number; baseline: boolean }) {
  return baseline ? (
    <circle cx={x} cy={y} r={4} />
  ) : (
    <path d={`M ${x} ${y - 5} l 5 5 l -5 5 l -5 -5 Z`} />
  )
}

export function RemainingDebtChart({
  schedules,
  horizon,
  detail,
  commonHorizonMonth,
  language,
}: {
  schedules: readonly DebtChartSchedule[]
  horizon: AmortizationHorizon
  detail: AmortizationDetail
  commonHorizonMonth: number
  language: SupportedLanguage
}) {
  const { t } = useTranslation()
  const id = useId()
  const [requestedMonth, setRequestedMonth] = useState(0)
  const model = useMemo(
    () => createRemainingDebtChart(schedules, horizon, detail, commonHorizonMonth),
    [schedules, horizon, detail, commonHorizonMonth],
  )
  const inspectedMonth = model.months.includes(requestedMonth) ? requestedMonth : 0
  const x = (month: number) => plot.left + (month / model.endMonth) * (plot.right - plot.left)
  const y = (balance: number) =>
    plot.bottom - (balance / model.maximumBalanceCents) * (plot.bottom - plot.top)
  const labels = {
    baseline: t('finance.results.breakdown.schedule.baseline'),
    'additional-repayments': t('finance.results.breakdown.schedule.additional-repayments'),
  }
  const projected = model.endMonth > model.fixedMonth
  const boundaryVisible = model.fixedMonth <= model.endMonth
  const xTicks = [...new Set([0, ...[1, 2, 3, 4].map((n) => Math.round((model.endMonth * n) / 4))])]
  return (
    <section aria-labelledby={`${id}-heading`} className="remaining-debt-chart">
      <h3 id={`${id}-heading`}>{t('finance.results.breakdown.debtChart.title')}</h3>
      <p className="result-detail" id={`${id}-basis`}>
        {t('finance.results.breakdown.debtChart.basis')}{' '}
        {detail === 'annual' ? t('finance.results.breakdown.debtChart.annualBasis') : ''}
      </p>
      <ul className="debt-chart-legend">
        {model.series.map((series) => (
          <li key={series.id}>
            <svg
              aria-hidden="true"
              className={`debt-series debt-series--${series.id}`}
              viewBox="0 0 44 16"
            >
              <path className="debt-chart-line" d="M 0 8 H 44" />
              <Point x={22} y={8} baseline={series.id === 'baseline'} />
            </svg>
            {labels[series.id]} ·{' '}
            {t(
              `finance.results.breakdown.debtChart.${series.id === 'baseline' ? 'solid' : 'dashed'}`,
            )}
          </li>
        ))}
      </ul>
      <p className="result-detail">
        {t(
          boundaryVisible
            ? 'finance.results.breakdown.fixedPeriodEndAt'
            : 'finance.results.breakdown.debtChart.boundaryAfterPayoff',
          {
            month: formatNumber(model.fixedMonth, language),
          },
        )}
        {' · '}
        {t(
          projected
            ? 'finance.results.breakdown.projectionBoundary'
            : 'finance.results.breakdown.debtChart.withinFixed',
        )}
      </p>
      <div
        aria-label={t('finance.results.breakdown.debtChart.scroll')}
        className="debt-chart-scroll"
        role="region"
        tabIndex={0}
      >
        <svg
          aria-describedby={`${id}-basis`}
          aria-labelledby={`${id}-heading ${id}-description`}
          className="debt-chart-svg"
          role="img"
          viewBox="0 0 720 336"
        >
          <desc id={`${id}-description`}>
            {t('finance.results.breakdown.debtChart.description')}
          </desc>
          <defs>
            <pattern id={`${id}-projection`} patternUnits="userSpaceOnUse" width={8} height={8}>
              <path className="debt-chart-hatch" d="M 0 8 L 8 0" />
            </pattern>
          </defs>
          {projected ? (
            <rect
              data-chart-projection="true"
              x={x(model.fixedMonth)}
              y={plot.top}
              width={x(model.endMonth) - x(model.fixedMonth)}
              height={plot.bottom - plot.top}
              fill={`url(#${id}-projection)`}
            />
          ) : null}
          {[0, 1, 2, 3, 4].map((n) => {
            const amount = Math.round((model.maximumBalanceCents / 4) * n)
            return (
              <g key={n} className="debt-chart-axis">
                <line x1={plot.left} x2={plot.right} y1={y(amount)} y2={y(amount)} />
                <text x={plot.left - 12} y={y(amount) + 4} textAnchor="end">
                  {formatEuroFromCents(amount, language, 0)}
                </text>
              </g>
            )
          })}
          <text className="debt-chart-axis-title" x={plot.left} y={20}>
            {t('finance.results.breakdown.debtChart.yAxis')}
          </text>
          {xTicks.map((month) => (
            <text className="debt-chart-axis" key={month} x={x(month)} y={304} textAnchor="middle">
              {formatNumber(month, language)}
            </text>
          ))}
          <text
            className="debt-chart-axis-title"
            x={(plot.left + plot.right) / 2}
            y={328}
            textAnchor="middle"
          >
            {t('finance.results.breakdown.month')}
          </text>
          {boundaryVisible ? (
            <line
              className="debt-chart-boundary"
              data-fixed-month={model.fixedMonth}
              x1={x(model.fixedMonth)}
              x2={x(model.fixedMonth)}
              y1={plot.top}
              y2={plot.bottom}
            />
          ) : null}
          <line
            className="debt-chart-inspection"
            x1={x(inspectedMonth)}
            x2={x(inspectedMonth)}
            y1={plot.top}
            y2={plot.bottom}
          />
          {model.series.map((series, seriesIndex) => (
            <g
              className={`debt-series debt-series--${series.id}`}
              data-debt-series={series.id}
              key={series.id}
            >
              <path
                className="debt-chart-line"
                d={series.points
                  .map(
                    (point, index) =>
                      `${index === 0 ? 'M' : 'L'} ${x(point.month).toFixed(2)} ${y(point.balanceCents).toFixed(2)}`,
                  )
                  .join(' ')}
              />
              {series.payoffMonth <= model.endMonth ? (
                <text
                  className="debt-chart-payoff-label"
                  x={x(series.payoffMonth)}
                  y={plot.bottom - 16 - seriesIndex * 18}
                  textAnchor={x(series.payoffMonth) > plot.right - 130 ? 'end' : 'start'}
                >
                  {formatNumber(series.payoffMonth, language)} ·{' '}
                  {t('finance.results.breakdown.payoff')}
                </text>
              ) : null}
              {series.points
                .filter(
                  (point) =>
                    detail === 'annual' ||
                    point.month === 0 ||
                    point.month === model.fixedMonth ||
                    point.month === series.payoffMonth ||
                    point.month === model.endMonth ||
                    point.month === inspectedMonth,
                )
                .map((point) => (
                  <g
                    key={point.month}
                    data-chart-month={point.month}
                    data-balance-cents={point.balanceCents}
                    data-chart-payoff={point.month === series.payoffMonth ? 'true' : undefined}
                  >
                    <Point
                      x={x(point.month)}
                      y={y(point.balanceCents)}
                      baseline={series.id === 'baseline'}
                    />
                  </g>
                ))}
            </g>
          ))}
        </svg>
      </div>
      <ul className="debt-chart-endpoints">
        {model.series.map((series) => (
          <li key={series.id}>
            {labels[series.id]}:{' '}
            {t('finance.results.breakdown.debtChart.endpoint', {
              month: formatNumber(Math.min(series.payoffMonth, model.endMonth), language),
              value: formatEuroFromCents(series.points.at(-1)!.balanceCents, language),
            })}
            {series.payoffMonth <= model.endMonth
              ? ` · ${t('finance.results.breakdown.payoff')} (${t('finance.results.breakdown.month')} ${formatNumber(series.payoffMonth, language)})`
              : ''}
          </li>
        ))}
      </ul>
      <div className="debt-chart-inspector">
        <label htmlFor={`${id}-month`}>{t('finance.results.breakdown.debtChart.inspect')}</label>
        <select
          id={`${id}-month`}
          onChange={(event) => setRequestedMonth(Number(event.target.value))}
          value={inspectedMonth}
        >
          {model.months.map((month) => (
            <option key={month} value={month}>
              {t('finance.results.breakdown.month')} {formatNumber(month, language)}
              {month === 0 ? ` · ${t('finance.results.breakdown.openingBalance')}` : ''}
            </option>
          ))}
        </select>
        <dl>
          {model.series.map((series) => (
            <div key={series.id}>
              <dt>{labels[series.id]}</dt>
              <dd>
                {formatEuroFromCents(
                  series.points.find((point) => point.month === inspectedMonth)!.balanceCents,
                  language,
                )}
                {inspectedMonth > series.payoffMonth
                  ? ` · ${t('finance.results.breakdown.debtChart.alreadyRepaid')}`
                  : ''}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
