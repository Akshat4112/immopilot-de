import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div>
        <p>{t('footer.disclaimer')}</p>
        <Link className="site-footer__notice" to="/privacy">
          {t('footer.privacyNotice')}
        </Link>
      </div>
      <span>{t('footer.copyright')}</span>
    </footer>
  )
}
