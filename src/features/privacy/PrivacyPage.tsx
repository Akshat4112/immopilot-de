import { useTranslation } from 'react-i18next'

import { PageLayout } from '../../components/PageLayout'
import { privacyNoticeMetadata } from '../../config/releaseMetadata'
import { formatDate } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

const sections = ['purpose', 'local', 'saved', 'sharing', 'hosting', 'limits', 'controls'] as const

export function PrivacyPage() {
  const { t, i18n } = useTranslation()
  const language: SupportedLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'de'

  return (
    <PageLayout
      eyebrow={t('privacy.page.eyebrow')}
      title={t('privacy.page.title')}
      summary={t('privacy.page.summary')}
    >
      <div className="privacy-notice">
        <aside className="privacy-notice__status" aria-label={t('privacy.status.title')}>
          <strong>{t('privacy.status.title')}</strong>
          <span>{t('privacy.status.version', { version: privacyNoticeMetadata.version })}</span>
          <span>
            {t('privacy.status.verified', {
              date: formatDate(privacyNoticeMetadata.verifiedOn, language),
            })}
          </span>
        </aside>

        <section className="privacy-notice__warning" aria-labelledby="privacy-warning-title">
          <h2 id="privacy-warning-title">{t('privacy.warning.title')}</h2>
          <p>{t('privacy.warning.body')}</p>
        </section>

        {sections.map((section) => (
          <section className="privacy-notice__section" key={section}>
            <h2>{t(`privacy.sections.${section}.title`)}</h2>
            <p>{t(`privacy.sections.${section}.body`)}</p>
          </section>
        ))}

        <section className="privacy-notice__section">
          <h2>{t('privacy.sources.title')}</h2>
          <p>{t('privacy.sources.body')}</p>
          <ul>
            <li>
              <a
                href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection"
                rel="noreferrer"
              >
                {t('privacy.sources.githubPages')}
              </a>
            </li>
            <li>
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                rel="noreferrer"
              >
                {t('privacy.sources.githubPrivacy')}
              </a>
            </li>
            <li>
              <a
                href="https://github.com/Akshat4112/immopilot-de/blob/main/docs/legal-and-privacy.md"
                rel="noreferrer"
              >
                {t('privacy.sources.fullDocument')}
              </a>
            </li>
          </ul>
        </section>
      </div>
    </PageLayout>
  )
}
