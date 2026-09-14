import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router-dom'

import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'

export function AppShell() {
  const { t } = useTranslation()

  const moveFocusToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    document.getElementById('main-content')?.focus()
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content" onClick={moveFocusToContent}>
        {t('shell.skipToContent')}
      </a>
      <AppHeader />
      <main className="application-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
