import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageLayout } from '../../components/PageLayout'

type FoundationFeature = 'purchaseCosts' | 'financing' | 'comparison'

const pageKeys = {
  purchaseCosts: 'shell.pages.purchaseCosts',
  financing: 'shell.pages.financing',
  comparison: 'shell.pages.comparison',
} as const

interface FeaturePlaceholderPageProps {
  feature: FoundationFeature
}

export function FeaturePlaceholderPage({ feature }: FeaturePlaceholderPageProps) {
  const { t } = useTranslation()
  const pageKey = pageKeys[feature]

  return (
    <PageLayout
      eyebrow={t('shell.pages.eyebrow')}
      title={t(`${pageKey}.title`)}
      summary={t(`${pageKey}.summary`)}
    >
      <Link className="secondary-action route-back-link" to="/">
        {t('shell.pages.back')}
      </Link>
    </PageLayout>
  )
}
