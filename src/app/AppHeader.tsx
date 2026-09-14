import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { AppNavigation } from './AppNavigation'

const navigationId = 'primary-navigation'

export function AppHeader() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const { t } = useTranslation()

  const closeNavigation = (moveFocusToContent = false) => {
    setIsNavigationOpen(false)

    if (moveFocusToContent) {
      window.setTimeout(() => document.getElementById('main-content')?.focus(), 0)
    }
  }

  return (
    <header className="site-header">
      <div className="header-bar">
        <Link
          className="brand"
          to="/"
          aria-label={t('brand.homeLabel')}
          onClick={() => closeNavigation()}
        >
          <span className="brand-mark" aria-hidden="true">
            IP
          </span>
          <span>ImmoPilot DE</span>
        </Link>

        <div className="header-actions">
          <span className="release-tag">{t('brand.release')}</span>
          <LanguageSwitcher />
          <button
            className="menu-toggle"
            type="button"
            aria-controls={navigationId}
            aria-expanded={isNavigationOpen}
            aria-label={t(isNavigationOpen ? 'shell.closeMenu' : 'shell.openMenu')}
            onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>

      <AppNavigation
        id={navigationId}
        isOpen={isNavigationOpen}
        onNavigate={() => closeNavigation(isNavigationOpen)}
      />
    </header>
  )
}
