import i18n from '../../i18n/config'
import { resources } from '../../i18n/resources'
import { ComparisonValue } from '../comparison/ComparisonValue'
import { comparisonMetricGroups } from '../comparison/comparisonMetricGroups'
import { ReportPropertyDocument } from './PropertyReport'
import { reportText } from './reportCopy'
import type { ReportSnapshot, ReportValue } from './reportSnapshot'

/** Pure presentation of the ordered, freshly recalculated capture; no storage access. */
export function ComparisonReport({ snapshot }: { snapshot: ReportValue<ReportSnapshot> }) {
  const { language, properties } = snapshot
  const t = reportText(language)
  const comparisonText = i18n.getFixedT(language)
  if (
    snapshot.kind !== 'comparison' ||
    properties.length < 1 ||
    properties.length > 3 ||
    properties.some((property) => !property.comparisonValues)
  )
    return <p>{t('Correct the required inputs before creating a report.')}</p>
  const label = (ordinal: number) => `${language === 'de' ? 'Objekt' : 'Property'} ${ordinal}`
  return (
    <article
      className="property-report comparison-report"
      lang={language}
      aria-label={t('Property comparison')}
    >
      <section className="report-comparison-summary">
        <header className="report-header">
          <p className="report-brand">ImmoPilot DE · EUR</p>
          <h2>{t('Property comparison')}</h2>
          <p>
            <strong>{t(snapshot.status === 'complete' ? 'Complete' : 'Incomplete')}</strong> ·{' '}
            {t('Generated')}:{' '}
            <time dateTime={snapshot.generatedAt}>
              {new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'UTC',
              }).format(new Date(snapshot.generatedAt))}{' '}
              UTC
            </time>
          </p>
        </header>
        {snapshot.status === 'incomplete' ? (
          <p className="report-warning">
            {t('Some results are missing or unavailable. Review the marked sections.')}
          </p>
        ) : null}
        <p>{resources[language].translation.footer.disclaimer}</p>
        <p>{comparisonText('comparison.repayment.basis')}</p>
        <p className="report-screen-hint">
          {t(
            'Swipe horizontally for more table columns, or focus the table region and use the arrow keys.',
          )}
        </p>
        <div
          className="report-table-scroll"
          role="region"
          aria-label={t('Comparison summary')}
          tabIndex={0}
        >
          <table className="report-comparison-table">
            <caption>{t('Comparison summary')} · EUR</caption>
            <thead>
              <tr>
                <th scope="col">{comparisonText('comparison.table.metric')}</th>
                {properties.map((property) => (
                  <th scope="col" key={property.ordinal}>
                    {label(property.ordinal)}
                    {property.name === undefined ? null : <small>{property.name}</small>}
                    <small>
                      {comparisonText(`comparison.mode.${property.inputs.analysis.propertyUse}`)}
                    </small>
                    <small>
                      {t(
                        property.results.amortization.status === 'available' &&
                          property.results.amortization.cashPurchase
                          ? 'Not applicable'
                          : property.results.selectedAmortizationBasis === 'baseline'
                            ? 'Baseline'
                            : property.results.selectedAmortizationBasis === 'additional-repayments'
                              ? 'With additional repayments'
                              : 'Unavailable',
                      )}
                    </small>
                    <small>{t(property.status === 'complete' ? 'Complete' : 'Incomplete')}</small>
                  </th>
                ))}
              </tr>
            </thead>
            {comparisonMetricGroups.map((group) => (
              <tbody key={group.id}>
                <tr className="report-comparison-group">
                  <th colSpan={properties.length + 1} scope="colgroup">
                    {comparisonText(`comparison.groups.${group.id}`)}
                  </th>
                </tr>
                {group.metrics.map((metric) => (
                  <tr key={metric}>
                    <th scope="row">
                      {comparisonText(`comparison.metrics.${metric}`)}
                      {snapshot.mixedBasisMetrics.includes(metric) ? (
                        <small className="comparison-basis-warning">
                          {comparisonText(
                            metric === 'projectedReturn'
                              ? 'comparison.nonComparable.projectedReturn'
                              : 'comparison.nonComparable.remainingDebt',
                          )}
                        </small>
                      ) : null}
                    </th>
                    {properties.map((property) => (
                      <td key={property.ordinal}>
                        <ComparisonValue
                          metric={metric}
                          value={property.comparisonValues![metric]}
                          language={language}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>
      {properties.map((property) => (
        <ReportPropertyDocument key={property.ordinal} snapshot={snapshot} property={property} />
      ))}
    </article>
  )
}
