import { useTranslation } from 'react-i18next'

import assumptionSet from '../../../data/assumptions/de-2026.09.json'
import { PageLayout } from '../../components/PageLayout'
import { calculationMetadata } from '../../config/releaseMetadata'
import { formatDate } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

const sections = [
  'acquisition',
  'financing',
  'mortgage',
  'repayment',
  'owner',
  'rental',
  'offer',
  'limits',
] as const

export function MethodologyPage() {
  const { t, i18n } = useTranslation()
  const language: SupportedLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'de'

  return (
    <PageLayout
      eyebrow={t('methodology.page.eyebrow')}
      title={t('methodology.page.title')}
      summary={t('methodology.page.summary')}
      wide
    >
      <div className="methodology-page">
        <aside className="methodology-metadata" aria-label={t('methodology.versionHeading')}>
          <h2>{t('methodology.versionHeading')}</h2>
          <dl>
            <div>
              <dt>{t('methodology.assumptionVersion')}</dt>
              <dd>{calculationMetadata.assumptionSetVersion}</dd>
            </div>
            <div>
              <dt>{t('methodology.specificationVersion')}</dt>
              <dd>{calculationMetadata.calculationSpecificationVersion}</dd>
            </div>
            <div>
              <dt>{t('methodology.assumptionVerified')}</dt>
              <dd>{formatDate(calculationMetadata.assumptionSetVerifiedOn, language)}</dd>
            </div>
            <div>
              <dt>{t('methodology.transferTaxSourceAsOf')}</dt>
              <dd>{formatDate(assumptionSet.transferTax.rateSourceDate, language)}</dd>
            </div>
          </dl>
          <p>{t('methodology.dateWarning')}</p>
        </aside>

        <div className="methodology-sections">
          {sections.map((section) => (
            <section className="methodology-section" key={section}>
              <h2>{t(`methodology.sections.${section}.title`)}</h2>
              <p>{t(`methodology.sections.${section}.description`)}</p>
              <div className="methodology-formula" role="note">
                <strong>{t('methodology.formulaLabel')}</strong>
                <code>{t(`methodology.sections.${section}.formula`)}</code>
              </div>
              <p className="methodology-limitation">
                {t(`methodology.sections.${section}.boundary`)}
              </p>
            </section>
          ))}
        </div>

        <section className="methodology-sources" aria-labelledby="methodology-sources-heading">
          <h2 id="methodology-sources-heading">{t('methodology.sources.title')}</h2>
          <p>{t('methodology.sources.description')}</p>
          <ul>
            {assumptionSet.sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} rel="noreferrer noopener" target="_blank">
                  {source.title}
                </a>
                <span>{source.publisher}</span>
                <span>
                  {t('methodology.sources.sourceDate')}:{' '}
                  {source.sourceDate
                    ? formatDate(source.sourceDate, language)
                    : t('methodology.sources.undated')}
                </span>
                <span>
                  {t('methodology.sources.verifiedOn')}: {formatDate(source.verifiedOn, language)}
                </span>
              </li>
            ))}
          </ul>
          <p>{t('methodology.sources.note')}</p>
        </section>

        <section className="methodology-section">
          <h2>{t('methodology.documentation.title')}</h2>
          <p>{t('methodology.documentation.summary')}</p>
          <ul>
            <li>
              <a
                href="https://github.com/Akshat4112/immopilot-de/blob/main/docs/calculation-specification.md"
                rel="noreferrer noopener"
                target="_blank"
              >
                {t('methodology.documentation.specification')}
              </a>
            </li>
            <li>
              <a
                href="https://github.com/Akshat4112/immopilot-de/blob/main/docs/pf-0065-methodology-audit.md"
                rel="noreferrer noopener"
                target="_blank"
              >
                {t('methodology.documentation.audit')}
              </a>
            </li>
          </ul>
        </section>
      </div>
    </PageLayout>
  )
}
