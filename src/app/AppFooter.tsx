import { useTranslation } from 'react-i18next'

export function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <p>{t('footer.disclaimer')}</p>
      <span>{t('footer.copyright')}</span>
    </footer>
  )
}
