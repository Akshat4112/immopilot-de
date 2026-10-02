import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { calculationMetadata } from '../config/releaseMetadata'
import { formatDate } from '../i18n/formatters'
import type { SupportedLanguage } from '../i18n/resources'

export type CalculationProvenanceScope =
  | 'purchase'
  | 'financing'
  | 'repayment'
  | 'refinancing'
  | 'owner'
  | 'rental'
  | 'offer'
  | 'comparison'

export function CalculationProvenance({ scope }: { scope: CalculationProvenanceScope }) {
  const { t, i18n } = useTranslation()
  const language: SupportedLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'de'

  return (
    <aside className="calculation-provenance" aria-label={t('provenance.title')}>
      <div className="calculation-provenance__heading">
        <strong>{t('provenance.title')}</strong>
        <Link className="inline-link" to="/privacy">
          {t('provenance.fullNotice')}
        </Link>
      </div>
      <dl>
        <div>
          <dt>{t('provenance.assumptionSet')}</dt>
          <dd>{calculationMetadata.assumptionSetVersion}</dd>
        </div>
        <div>
          <dt>{t('provenance.verifiedOn')}</dt>
          <dd>{formatDate(calculationMetadata.assumptionSetVerifiedOn, language)}</dd>
        </div>
        <div>
          <dt>{t('provenance.calculationSpecification')}</dt>
          <dd>{calculationMetadata.calculationSpecificationVersion}</dd>
        </div>
      </dl>
      <p>{t(`provenance.scope.${scope}`)}</p>
      <p className="calculation-provenance__limitation">{t('provenance.limitation')}</p>
    </aside>
  )
}
