import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router-dom'

import { useScenarioWorkspaceStore } from '../features/scenario-workspace'

import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { DocumentMetadata } from './DocumentMetadata'

export function AppShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeDemo = useScenarioWorkspaceStore((state) => state.activeDemo)
  const resetWorkspace = useScenarioWorkspaceStore((state) => state.reset)

  const moveFocusToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    document.getElementById('main-content')?.focus()
  }

  return (
    <div className="site-shell">
      <DocumentMetadata />
      <a className="skip-link" href="#main-content" onClick={moveFocusToContent}>
        {t('shell.skipToContent')}
      </a>
      <AppHeader />
      <main className="application-main" id="main-content" tabIndex={-1}>
        {activeDemo ? (
          <aside className="demo-active-banner" aria-label={t('demo.bannerLabel')}>
            <p>
              <strong>{t('demo.fictionalLabel')}</strong>{' '}
              {t(activeDemo === 'owner-occupier' ? 'demo.ownerActive' : 'demo.rentalActive')}
            </p>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                resetWorkspace()
                void navigate('/purchase-costs')
              }}
            >
              {t('demo.resetButton')}
            </button>
          </aside>
        ) : null}
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
