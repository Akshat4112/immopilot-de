import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { formatEuroFromCents } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  )
}

export function HomePage() {
  const { i18n, t } = useTranslation()
  const language = i18n.resolvedLanguage as SupportedLanguage
  const foundationAreas = [
    {
      number: '01',
      title: t('purchase.additionalCosts'),
      description: t('foundation.acquisitionDescription'),
    },
    {
      number: '02',
      title: t('foundation.financingTitle'),
      description: t('foundation.financingDescription'),
    },
    {
      number: '03',
      title: t('foundation.decisionsTitle'),
      description: t('foundation.decisionsDescription'),
    },
  ] as const

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title">
            {t('hero.titleLineOne')}
            <br />
            {t('hero.titleLineTwo')}
          </h1>
          <p className="hero-summary">{t('hero.summary')}</p>
          <div className="hero-actions">
            <Link className="primary-action" to="/purchase-costs">
              {t('hero.primaryAction')}
              <ArrowIcon />
            </Link>
            <a className="secondary-action" href="https://github.com/Akshat4112/immopilot-de">
              {t('hero.documentation')}
            </a>
          </div>
        </div>

        <aside className="preview-card" aria-label={t('preview.label')}>
          <div className="preview-heading">
            <span>{t('preview.title')}</span>
            <span className="status-dot">{t('preview.status')}</span>
          </div>
          <p className="preview-price">{formatEuroFromCents(25_000_000, language)}</p>
          <p className="preview-caption">{t('property.purchasePrice')} · Baden-Württemberg</p>
          <dl className="preview-metrics">
            <div>
              <dt>{t('finance.equity')}</dt>
              <dd>{formatEuroFromCents(6_625_000, language)}</dd>
            </div>
            <div>
              <dt>{t('finance.monthlyPayment')}</dt>
              <dd>{formatEuroFromCents(91_667, language)}</dd>
            </div>
            <div>
              <dt>{t('preview.remainingDebtAfterYears', { years: 10 })}</dt>
              <dd>{formatEuroFromCents(15_218_873, language)}</dd>
            </div>
          </dl>
          <p className="preview-note">{t('preview.verified', { version: '1.0.0' })}</p>
        </aside>
      </section>

      <section className="trust-strip" aria-label={t('principles.label')}>
        <span>{t('principles.local')}</span>
        <span>{t('principles.accounts')}</span>
        <span>{t('principles.assumptions')}</span>
        <span>{t('principles.bilingual')}</span>
      </section>

      <section className="foundation" id="foundation" aria-labelledby="foundation-title">
        <div className="section-intro">
          <p className="eyebrow">{t('foundation.eyebrow')}</p>
          <h2 id="foundation-title">{t('foundation.title')}</h2>
          <p>{t('foundation.summary')}</p>
        </div>

        <div className="area-grid">
          {foundationAreas.map((area) => (
            <article className="area-card" key={area.number}>
              <span className="area-number">{area.number}</span>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
