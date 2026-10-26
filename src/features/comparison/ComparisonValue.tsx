import i18n from '../../i18n/config'
import { formatEuroFromCents, formatNumber, formatPercentage } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import type { ComparisonMetricId, ComparisonMetricValue } from './comparisonCalculations'

export function ComparisonValue({
  metric,
  value,
  language,
}: {
  metric: ComparisonMetricId
  value: ComparisonMetricValue
  language: SupportedLanguage
}) {
  const t = i18n.getFixedT(language)
  if (value.status === 'missing') {
    return (
      <span className="comparison-value-status comparison-value-status--warning">
        {value.count > 0
          ? t('comparison.status.missingCount', { count: value.count })
          : t('comparison.status.notConfigured')}
      </span>
    )
  }
  if (value.status === 'not-applicable') {
    return <span className="comparison-value-status">{t('comparison.status.notApplicable')}</span>
  }
  if (value.status === 'unavailable') {
    return (
      <span className="comparison-value-status">
        {t('comparison.status.unavailable')}
        {value.reason === 'repayment-schedule' ? (
          <small className="comparison-value-detail">
            {t('comparison.status.repaymentSchedule')}
          </small>
        ) : null}
      </span>
    )
  }

  let formatted: string
  if (value.format === 'percentage') {
    formatted = formatPercentage(value.rate, language)
  } else if (value.format === 'loan-month') {
    formatted = t('comparison.value.loanMonth', { month: formatNumber(value.months, language) })
  } else if (value.format === 'duration') {
    formatted = t('comparison.value.duration', {
      years: formatNumber(Math.floor(value.months / 12), language),
      months: formatNumber(value.months % 12, language),
      yearUnit: t(
        Math.floor(value.months / 12) === 1
          ? 'results.sondertilgung.duration.year'
          : 'results.sondertilgung.duration.years',
      ),
      monthUnit: t(
        value.months % 12 === 1
          ? 'results.sondertilgung.duration.month'
          : 'results.sondertilgung.duration.months',
      ),
    })
  } else if (value.format === 'euro-range') {
    formatted = t('comparison.value.range', {
      low: formatEuroFromCents(value.lowCents, language),
      high: formatEuroFromCents(value.highCents, language),
    })
  } else {
    formatted = formatEuroFromCents(value.cents, language)
  }

  return (
    <>
      <strong className="comparison-value">{formatted}</strong>
      {'basis' in value && value.basis === 'constant-rate:loan-months' ? (
        <small className="comparison-value-detail">
          {t('comparison.value.constantRateProjection')}
        </small>
      ) : null}
      {['additionalPrincipal', 'interestSaved', 'remainingDebtReduction'].includes(metric) &&
      value.format === 'euro' &&
      value.basis ? (
        <small className="comparison-value-detail">
          {t('comparison.value.fixedPeriodRepayment', {
            years: Number(value.basis.split(':')[1]) / 12,
          })}
        </small>
      ) : null}
      {value.format === 'percentage' && value.numeratorCents !== undefined ? (
        <small className="comparison-value-detail">
          {t('comparison.value.yieldBasis', {
            numerator: formatEuroFromCents(value.numeratorCents, language),
            denominator: formatEuroFromCents(value.denominatorCents ?? 0, language),
          })}
        </small>
      ) : null}
      {metric === 'remainingDebt' && value.format === 'euro' && value.basis ? (
        <small className="comparison-value-detail">
          {t(
            value.repaymentBasis === 'additional-repayments'
              ? 'comparison.value.afterYearsWithAdditionalRepayments'
              : 'comparison.value.afterYears',
            { years: Number(value.basis.split(':')[1]) / 12 },
          )}
        </small>
      ) : null}
      {metric === 'projectedReturn' && value.format === 'euro' && value.basis ? (
        <small className="comparison-value-detail">
          {value.basis.startsWith('owner:')
            ? t('comparison.value.ownerReturn', {
                years: Number(value.basis.split(':')[1]) / 12,
              })
            : t('comparison.value.rentalReturn', {
                years: Number(value.basis.split(':')[1]) / 12,
              })}
        </small>
      ) : null}
      {metric !== 'remainingDebt' &&
      value.format === 'euro' &&
      value.repaymentBasis === 'additional-repayments' ? (
        <small className="comparison-value-detail">
          {t('comparison.value.additionalRepaymentsIncluded')}
        </small>
      ) : null}
    </>
  )
}
