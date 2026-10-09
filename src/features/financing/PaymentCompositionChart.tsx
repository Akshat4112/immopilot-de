import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FinancialValidationError } from '../../domain/shared/validation'
import { formatEuroFromCents, formatNumber } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import type {
  AmortizationDetail,
  AmortizationHorizon,
  AmortizationPeriod,
} from './amortizationPeriods'
import { ChartDataView } from './ChartDataView'
import { createPaymentCompositionChart } from './paymentCompositionChart'
import type { DebtChartSchedule } from './remainingDebtChart'

const components = ['interest', 'scheduledPrincipal', 'additionalPrincipal'] as const
const inspectionComponents = [...components, 'regularPayment', 'totalPayment'] as const
const plot = { left: 100, top: 38, bottom: 282 }

export function PaymentCompositionChart({
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
  const scroll = useRef<HTMLDivElement>(null)
  const [hasInspected, setHasInspected] = useState(false)
  const [requestedMonth, setRequestedMonth] = useState(1)
  const model = useMemo(() => {
    try {
      return createPaymentCompositionChart(schedules, horizon, detail, commonHorizonMonth)
    } catch (error) {
      if (error instanceof FinancialValidationError && error.code === 'ARITHMETIC_OVERFLOW')
        return null
      throw error
    }
  }, [schedules, horizon, detail, commonHorizonMonth])
  if (!model)
    return (
      <section aria-labelledby={`${id}-heading`} className="payment-composition-chart">
        <h3 id={`${id}-heading`}>{t('finance.results.breakdown.paymentChart.title')}</h3>
        <p className="result-detail">{t('finance.results.breakdown.annualUnavailable')}</p>
      </section>
    )
  const inspectedMonth = model.columns.some((p) => p.firstMonth === requestedMonth)
    ? requestedMonth
    : 1
  const width = Math.max(720, plot.left + 32 + model.columns.length * 28)
  const right = width - 32
  const slotWidth = (right - plot.left) / model.columns.length
  const x = (index: number) => plot.left + index * slotWidth
  const y = (amount: number) =>
    plot.bottom - (amount / model.maximumPaymentCents) * (plot.bottom - plot.top)
  const componentLabel = (component: (typeof inspectionComponents)[number]) =>
    t(
      `finance.results.breakdown.${component === 'regularPayment' && detail === 'annual' ? 'regularPaymentAnnual' : component}`,
    )
  const labels = {
    baseline: t('finance.results.breakdown.schedule.baseline'),
    'additional-repayments': t('finance.results.breakdown.schedule.additional-repayments'),
  }
  const periodLabel = (
    period: Pick<AmortizationPeriod, 'firstMonth' | 'lastMonth' | 'loanYear'>,
  ) =>
    detail === 'annual'
      ? `${t('finance.results.breakdown.loanYear', { year: formatNumber(period.loanYear, language) })} · ${t('finance.results.breakdown.monthRange', { first: formatNumber(period.firstMonth, language), last: formatNumber(period.lastMonth, language) })}`
      : `${t('finance.results.breakdown.month')} ${formatNumber(period.firstMonth, language)}`
  const periodBasis = (period: AmortizationPeriod) =>
    period.lastMonth > model.fixedMonth
      ? t(
          `finance.results.breakdown.${period.firstMonth <= model.fixedMonth ? 'mixedPeriod' : 'projectedPeriod'}`,
        )
      : t('finance.results.breakdown.chartAccess.withinFixed')
  const projected = [...model.series].some((s) =>
    [...s.periods.values()].some((p) => p.lastMonth > model.fixedMonth),
  )
  const boundaryVisible = model.fixedMonth <= model.endMonth
  const boundaryIndex = Math.floor((model.fixedMonth - 1) / model.step)
  const boundaryColumn = model.columns[boundaryIndex]
  const boundaryX = boundaryColumn
    ? x(
        boundaryIndex +
          (model.fixedMonth - boundaryColumn.firstMonth + 1) /
            (boundaryColumn.lastMonth - boundaryColumn.firstMonth + 1),
      )
    : 0
  const ticks = new Set(
    Array.from({ length: 5 }, (_, i) => Math.round(((model.columns.length - 1) * i) / 4)),
  )
  const actualPeriods = model.columns.flatMap((column) =>
    model.series.flatMap((series) => {
      const period = series.periods.get(column.firstMonth)
      return period ? [{ series, period }] : []
    }),
  )
  const periodStatus = (period: AmortizationPeriod, payoffMonth: number) =>
    [
      detail === 'annual' && period.lastMonth - period.firstMonth + 1 < 12
        ? t('finance.results.breakdown.partialYear')
        : '',
      periodBasis(period),
      period.lastMonth === payoffMonth ? t('finance.results.breakdown.payoff') : '',
    ]
      .filter(Boolean)
      .join(' · ')
  const dataTitle = t('finance.results.breakdown.chartAccess.dataView', {
    title: t('finance.results.breakdown.paymentChart.title'),
  })
  return (
    <section aria-labelledby={`${id}-heading`} className="payment-composition-chart">
      <h3 id={`${id}-heading`}>{t('finance.results.breakdown.paymentChart.title')}</h3>
      <p className="result-detail" id={`${id}-basis`}>
        {model.series.map((series) => labels[series.id]).join(' · ')}.{' '}
        {t('finance.results.breakdown.paymentChart.basis')}{' '}
        {model.series.length === 2 ? t('finance.results.breakdown.paymentChart.paired') : ''}
      </p>
      <p className="result-detail" id={`${id}-help`}>
        {t('finance.results.breakdown.chartAccess.inspectHelp')}
      </p>
      <ul className="payment-chart-legend">
        {components.map((component) => (
          <li key={component}>
            <span aria-hidden="true" className={`payment-swatch payment-swatch--${component}`} />
            {componentLabel(component)} ·{' '}
            {t(`finance.results.breakdown.paymentChart.pattern.${component}`)}
          </li>
        ))}
      </ul>
      <p className="result-detail">
        {t(
          boundaryVisible
            ? 'finance.results.breakdown.fixedPeriodEndAt'
            : 'finance.results.breakdown.debtChart.boundaryAfterPayoff',
          { month: formatNumber(model.fixedMonth, language) },
        )}
        {' · '}
        {t(
          projected
            ? 'finance.results.breakdown.projectionBoundary'
            : 'finance.results.breakdown.paymentChart.withinFixed',
        )}
        {detail === 'annual' && projected && model.fixedMonth % 12 !== 0
          ? ` ${t('finance.results.breakdown.paymentChart.mixed')}`
          : ''}
      </p>
      <div
        aria-label={t('finance.results.breakdown.paymentChart.scroll')}
        className="payment-chart-scroll"
        aria-describedby={`${id}-help`}
        ref={scroll}
        role="region"
        tabIndex={0}
      >
        <svg
          aria-describedby={`${id}-basis ${id}-help`}
          aria-labelledby={`${id}-heading ${id}-description`}
          className="payment-chart-svg"
          role="img"
          style={{ minWidth: `${width}px` }}
          viewBox={`0 0 ${width} 336`}
        >
          <desc id={`${id}-description`}>
            {t('finance.results.breakdown.paymentChart.description')}
          </desc>
          <defs>
            <pattern
              id={`${id}-scheduledPrincipal`}
              patternUnits="userSpaceOnUse"
              width={6}
              height={6}
            >
              <rect width={6} height={6} className="payment-fill--scheduledPrincipal" />
              <path d="M 0 6 L 6 0" className="payment-pattern" />
            </pattern>
            <pattern
              id={`${id}-additionalPrincipal`}
              patternUnits="userSpaceOnUse"
              width={6}
              height={6}
            >
              <rect width={6} height={6} className="payment-fill--additionalPrincipal" />
              <circle cx={3} cy={3} r={1} className="payment-dot" />
            </pattern>
          </defs>
          {projected ? (
            <rect
              data-payment-projection="true"
              className="payment-chart-projection"
              x={x(Math.floor(model.fixedMonth / model.step))}
              y={plot.top}
              width={right - x(Math.floor(model.fixedMonth / model.step))}
              height={plot.bottom - plot.top}
            />
          ) : null}
          {[0, 1, 2, 3, 4].map((n) => {
            const amount = Math.round((model.maximumPaymentCents / 4) * n)
            return (
              <g key={n} className="debt-chart-axis">
                <line x1={plot.left} x2={right} y1={y(amount)} y2={y(amount)} />
                <text x={plot.left - 12} y={y(amount) + 4} textAnchor="end">
                  {formatEuroFromCents(amount, language, 0)}
                </text>
              </g>
            )
          })}
          <text className="debt-chart-axis-title" x={plot.left} y={20}>
            {t('finance.results.breakdown.paymentChart.yAxis')}
          </text>
          {model.columns.map((column, index) => (
            <g key={column.firstMonth}>
              {column.firstMonth === inspectedMonth ? (
                <rect
                  className="payment-chart-inspection"
                  x={x(index)}
                  y={plot.top}
                  width={slotWidth}
                  height={plot.bottom - plot.top}
                />
              ) : null}
              {model.series.map((series, seriesIndex) => {
                const period = series.periods.get(column.firstMonth)
                if (!period) return null
                const barWidth = (slotWidth * 0.78) / model.series.length
                const barX = x(index) + slotWidth * 0.11 + seriesIndex * barWidth
                const amounts = [
                  period.interestCents,
                  period.scheduledPrincipalCents,
                  period.additionalPrincipalCents,
                ]
                const ends = [
                  period.interestCents,
                  period.regularPaymentCents,
                  period.totalPaymentCents,
                ]
                return (
                  <g
                    key={series.id}
                    data-payment-series={series.id}
                    data-first-month={period.firstMonth}
                    data-last-month={period.lastMonth}
                    data-total-cents={period.totalPaymentCents}
                  >
                    <title>{`${labels[series.id]} · ${periodLabel(period)} · ${periodBasis(period)} · ${components.map((c, i) => `${t(`finance.results.breakdown.${c}`)}: ${formatEuroFromCents(amounts[i]!, language)}`).join(' · ')} · ${t('finance.results.breakdown.totalPayment')}: ${formatEuroFromCents(period.totalPaymentCents, language)}`}</title>
                    {components.map((component, componentIndex) => (
                      <rect
                        key={component}
                        data-component={component}
                        data-amount-cents={amounts[componentIndex]}
                        x={barX}
                        y={y(ends[componentIndex]!)}
                        width={barWidth}
                        height={
                          (amounts[componentIndex]! / model.maximumPaymentCents) *
                          (plot.bottom - plot.top)
                        }
                        className={component === 'interest' ? 'payment-fill--interest' : undefined}
                        fill={component === 'interest' ? undefined : `url(#${id}-${component})`}
                      />
                    ))}
                    <rect
                      className={`payment-bar-outline payment-bar-outline--${series.id}`}
                      x={barX}
                      y={y(period.totalPaymentCents)}
                      width={barWidth}
                      height={plot.bottom - y(period.totalPaymentCents)}
                    />
                  </g>
                )
              })}
              {ticks.has(index) ? (
                <text
                  className="debt-chart-axis"
                  x={x(index) + slotWidth / 2}
                  y={304}
                  textAnchor="middle"
                >
                  {formatNumber(
                    detail === 'annual' ? column.loanYear : column.firstMonth,
                    language,
                  )}
                </text>
              ) : null}
            </g>
          ))}
          {boundaryVisible ? (
            <line
              className="debt-chart-boundary"
              data-payment-fixed-month={model.fixedMonth}
              x1={boundaryX}
              x2={boundaryX}
              y1={plot.top}
              y2={plot.bottom}
            />
          ) : null}
          <text
            className="debt-chart-axis-title"
            x={(plot.left + right) / 2}
            y={328}
            textAnchor="middle"
          >
            {t(`finance.results.breakdown.${detail === 'annual' ? 'year' : 'month'}`)}
          </text>
        </svg>
      </div>
      <div className="payment-chart-inspector">
        <label htmlFor={`${id}-period`}>
          {t('finance.results.breakdown.paymentChart.inspect')}
        </label>
        <select
          id={`${id}-period`}
          value={inspectedMonth}
          aria-describedby={`${id}-help`}
          aria-controls={`${id}-values`}
          onChange={(event) => {
            const month = Number(event.target.value)
            setRequestedMonth(month)
            setHasInspected(true)
            const index = model.columns.findIndex((p) => p.firstMonth === month)
            if (scroll.current) {
              const scale = Math.max(width, scroll.current.clientWidth) / width
              scroll.current.scrollLeft = x(index) * scale - scroll.current.clientWidth / 2
            }
          }}
        >
          {model.columns.map((p) => (
            <option key={p.firstMonth} value={p.firstMonth}>
              {periodLabel(p)}
            </option>
          ))}
        </select>
        <div className="payment-chart-details" id={`${id}-values`}>
          {model.series.map((series) => {
            const period = series.periods.get(inspectedMonth)
            return (
              <section key={series.id} aria-label={labels[series.id]}>
                <h4>{labels[series.id]}</h4>
                {period ? (
                  <>
                    <p className="result-detail">
                      {periodLabel(period)}
                      {detail === 'annual' && period.lastMonth - period.firstMonth + 1 < 12
                        ? ` · ${t('finance.results.breakdown.partialYear')}`
                        : ''}{' '}
                      · {periodBasis(period)}
                      {period.lastMonth === series.payoffMonth
                        ? ` · ${t('finance.results.breakdown.payoff')}`
                        : ''}
                    </p>
                    <dl>
                      {inspectionComponents.map((component) => (
                        <div key={component}>
                          <dt>{componentLabel(component)}</dt>
                          <dd>{formatEuroFromCents(period[`${component}Cents`], language)}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <p className="result-detail">
                    {t('finance.results.breakdown.debtChart.alreadyRepaid')}
                  </p>
                )}
              </section>
            )
          })}
        </div>
      </div>
      <p
        className="chart-inspection-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {hasInspected
          ? model.series
              .map((series) => {
                const period = series.periods.get(inspectedMonth)
                return period
                  ? `${labels[series.id]}: ${periodLabel(period)} · ${periodStatus(period, series.payoffMonth)}. ${inspectionComponents.map((component) => `${componentLabel(component)}: ${formatEuroFromCents(period[`${component}Cents`], language)}`).join('. ')}`
                  : `${labels[series.id]}: ${periodLabel(model.columns.find((p) => p.firstMonth === inspectedMonth)!)} · ${t('finance.results.breakdown.debtChart.alreadyRepaid')}`
              })
              .join('. ')
          : ''}
      </p>
      <ChartDataView
        id={`${id}-data`}
        title={t('finance.results.breakdown.paymentChart.title')}
        caption={`${dataTitle} · ${t(`finance.results.breakdown.horizon.${horizon}`)} · ${t(`finance.results.breakdown.detail.${detail}`)} · EUR`}
        columns={[
          t('finance.results.breakdown.chartAccess.period'),
          t('finance.results.breakdown.schedule.label'),
          ...inspectionComponents.map((component) => componentLabel(component)),
        ]}
        rowCount={actualPeriods.length}
        language={language}
        getRows={(first, count) =>
          actualPeriods.slice(first, first + count).map(({ series, period }) => ({
            key: `${series.id}:${period.firstMonth}`,
            heading: (
              <>
                {periodLabel(period)}
                <small className="amortization-period-marker">
                  {periodStatus(period, series.payoffMonth)}
                </small>
              </>
            ),
            cells: [
              labels[series.id],
              ...inspectionComponents.map((component) =>
                formatEuroFromCents(period[`${component}Cents`], language),
              ),
            ],
          }))
        }
      />
    </section>
  )
}
