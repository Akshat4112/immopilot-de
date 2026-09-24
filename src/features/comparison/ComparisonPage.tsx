import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'

import { PageLayout } from '../../components/PageLayout'
import { formatEuroFromCents, formatPercentage } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'
import { readScenarioLibrary, type SavedScenario, type ScenarioLibraryIssue } from '../../storage'
import {
  calculateSavedScenarioComparison,
  hasMixedComparisonBasis,
  type ComparisonMetricId,
  type ComparisonMetricValue,
  type ScenarioComparison,
} from './comparisonCalculations'

const MAX_COMPARISONS = 3
const metricGroups: Array<{
  id: 'purchase' | 'financing' | 'performance' | 'offer'
  metrics: ComparisonMetricId[]
}> = [
  { id: 'purchase', metrics: ['purchasePrice', 'acquisitionCosts'] },
  { id: 'financing', metrics: ['equity', 'loan', 'monthlyPayment', 'remainingDebt'] },
  {
    id: 'performance',
    metrics: ['grossYield', 'netYield', 'monthlyCashFlow', 'projectedReturn'],
  },
  {
    id: 'offer',
    metrics: [
      'grossYieldCeiling',
      'netYieldCeiling',
      'affordabilityCeiling',
      'comparableValue',
      'openingOffer',
    ],
  },
]

function languageForFormatting(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de'
}

function readBrowserLibrary(): { scenarios: SavedScenario[]; issue?: ScenarioLibraryIssue } {
  if (typeof window === 'undefined') return { scenarios: [] }
  try {
    return readScenarioLibrary(window.localStorage)
  } catch {
    return { scenarios: [], issue: 'storage-unavailable' }
  }
}

function move<T>(items: readonly T[], from: number, to: number) {
  const reordered = [...items]
  const [item] = reordered.splice(from, 1)
  if (item !== undefined) reordered.splice(to, 0, item)
  return reordered
}

function Value({
  metric,
  value,
  language,
}: {
  metric: ComparisonMetricId
  value: ComparisonMetricValue
  language: SupportedLanguage
}) {
  const { t } = useTranslation()
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
    return <span className="comparison-value-status">{t('comparison.status.unavailable')}</span>
  }

  let formatted: string
  if (value.format === 'percentage') {
    formatted = formatPercentage(value.rate, language)
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

function ScenarioHeader({
  comparison,
  index,
  total,
  onMove,
  onRemove,
}: {
  comparison: ScenarioComparison
  index: number
  total: number
  onMove: (from: number, to: number) => void
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()
  const mode = comparison.scenario.inputs.analysis.propertyUse
  return (
    <div className="comparison-column-heading">
      <strong>{comparison.scenario.name}</strong>
      <small>{t(`comparison.mode.${mode}`)}</small>
      {comparison.dashboard.selectedAmortizationBasis === 'additional-repayments' ? (
        <small>{t('comparison.repayment.additionalRepayments')}</small>
      ) : comparison.dashboard.selectedAmortizationBasis === 'unavailable' ? (
        <small className="comparison-basis-warning">{t('comparison.repayment.invalid')}</small>
      ) : null}
      <div className="comparison-column-actions">
        <button
          aria-label={t('comparison.actions.moveLeft', { name: comparison.scenario.name })}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
          type="button"
        >
          ←
        </button>
        <button
          aria-label={t('comparison.actions.moveRight', { name: comparison.scenario.name })}
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
          type="button"
        >
          →
        </button>
        <button onClick={() => onRemove(comparison.scenario.id)} type="button">
          {t('comparison.actions.remove')}
        </button>
      </div>
    </div>
  )
}

export function ComparisonPage() {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const [{ scenarios, issue }] = useState(readBrowserLibrary)
  const requestedId = searchParams.get('scenario')
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (requestedId && scenarios.some((scenario) => scenario.id === requestedId)) {
      return [requestedId]
    }
    return scenarios.slice(0, Math.min(2, scenarios.length)).map((scenario) => scenario.id)
  })
  const [scenarioToAdd, setScenarioToAdd] = useState('')
  const language = languageForFormatting(i18n.resolvedLanguage ?? i18n.language)
  const available = useMemo(() => {
    const selected = new Set(selectedIds)
    return scenarios.filter((scenario) => !selected.has(scenario.id))
  }, [scenarios, selectedIds])
  const effectiveScenarioToAdd = available.some((scenario) => scenario.id === scenarioToAdd)
    ? scenarioToAdd
    : (available[0]?.id ?? '')
  const comparisons = useMemo(() => {
    const scenariosById = new Map(scenarios.map((scenario) => [scenario.id, scenario]))
    return selectedIds.flatMap((id) => {
      const scenario = scenariosById.get(id)
      return scenario ? [calculateSavedScenarioComparison(scenario)] : []
    })
  }, [scenarios, selectedIds])

  const addScenario = () => {
    if (!effectiveScenarioToAdd || selectedIds.length >= MAX_COMPARISONS) return
    setSelectedIds((ids) => [...ids, effectiveScenarioToAdd])
  }

  return (
    <PageLayout
      eyebrow={t('comparison.page.eyebrow')}
      title={t('comparison.page.title')}
      summary={t('comparison.page.summary')}
    >
      <div className="comparison-workspace">
        {issue ? (
          <section className="scenario-notice scenario-notice--warning" role="alert">
            <h2>{t(`scenarios.issues.${issue}.title`)}</h2>
            <p>{t(`scenarios.issues.${issue}.message`)}</p>
          </section>
        ) : null}

        {scenarios.length === 0 ? (
          <section className="comparison-empty">
            <h2>{t('comparison.empty.title')}</h2>
            <p>{t('comparison.empty.message')}</p>
            <Link className="primary-action" to="/scenarios">
              {t('comparison.actions.openScenarios')}
            </Link>
          </section>
        ) : (
          <>
            <section className="comparison-picker" aria-labelledby="comparison-picker-title">
              <div>
                <h2 id="comparison-picker-title">{t('comparison.picker.title')}</h2>
                <p>{t('comparison.picker.description')}</p>
              </div>
              <div className="comparison-picker-controls">
                <label className="form-field" htmlFor="comparison-scenario-picker">
                  <span className="form-field__label">{t('comparison.picker.label')}</span>
                  <select
                    disabled={selectedIds.length >= MAX_COMPARISONS || available.length === 0}
                    id="comparison-scenario-picker"
                    onChange={(event) => setScenarioToAdd(event.target.value)}
                    value={effectiveScenarioToAdd}
                  >
                    {available.map((scenario) => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="primary-action"
                  disabled={selectedIds.length >= MAX_COMPARISONS || !effectiveScenarioToAdd}
                  onClick={addScenario}
                  type="button"
                >
                  {t('comparison.actions.add')}
                </button>
              </div>
              <p className="comparison-limit" role="status">
                {t('comparison.picker.count', { count: selectedIds.length, max: MAX_COMPARISONS })}
              </p>
            </section>

            {comparisons.length === 0 ? (
              <section className="comparison-empty">
                <h2>{t('comparison.noSelection.title')}</h2>
                <p>{t('comparison.noSelection.message')}</p>
              </section>
            ) : (
              <section aria-labelledby="comparison-table-title">
                <div className="comparison-table-heading">
                  <div>
                    <h2 id="comparison-table-title">{t('comparison.table.title')}</h2>
                    <p>{t('comparison.table.description')}</p>
                  </div>
                  <Link className="inline-link" to="/scenarios">
                    {t('comparison.actions.manageScenarios')}
                  </Link>
                </div>
                <p className="comparison-mobile-hint">{t('comparison.table.mobileHint')}</p>
                <div className="comparison-table-scroll" tabIndex={0}>
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th scope="col">{t('comparison.table.metric')}</th>
                        {comparisons.map((comparison, index) => (
                          <th key={comparison.scenario.id} scope="col">
                            <ScenarioHeader
                              comparison={comparison}
                              index={index}
                              onMove={(from, to) => setSelectedIds((ids) => move(ids, from, to))}
                              onRemove={(id) =>
                                setSelectedIds((ids) => ids.filter((candidate) => candidate !== id))
                              }
                              total={comparisons.length}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metricGroups.map((group) => (
                        <FragmentRows
                          comparisons={comparisons}
                          group={group}
                          key={group.id}
                          language={language}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}

function FragmentRows({
  comparisons,
  group,
  language,
}: {
  comparisons: ScenarioComparison[]
  group: (typeof metricGroups)[number]
  language: SupportedLanguage
}) {
  const { t } = useTranslation()
  return (
    <>
      <tr className="comparison-group-row">
        <th colSpan={comparisons.length + 1} scope="colgroup">
          {t(`comparison.groups.${group.id}`)}
        </th>
      </tr>
      {group.metrics.map((metric) => {
        const mixedBasis =
          (metric === 'remainingDebt' || metric === 'projectedReturn') &&
          hasMixedComparisonBasis(comparisons, metric)
        return (
          <tr key={metric}>
            <th scope="row">
              {t(`comparison.metrics.${metric}`)}
              {mixedBasis ? (
                <small className="comparison-basis-warning">
                  {t(`comparison.nonComparable.${metric}`)}
                </small>
              ) : null}
            </th>
            {comparisons.map((comparison) => (
              <td key={comparison.scenario.id}>
                <Value language={language} metric={metric} value={comparison.values[metric]} />
              </td>
            ))}
          </tr>
        )
      })}
    </>
  )
}
