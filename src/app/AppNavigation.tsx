import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { to: '/', labelKey: 'shell.navigation.overview', end: true },
  { to: '/purchase-costs', labelKey: 'shell.navigation.purchaseCosts', end: false },
  { to: '/financing', labelKey: 'shell.navigation.financing', end: false },
  { to: '/results', labelKey: 'shell.navigation.results', end: false },
] as const

interface AppNavigationProps {
  id: string
  isOpen: boolean
  onNavigate: () => void
}

export function AppNavigation({ id, isOpen, onNavigate }: AppNavigationProps) {
  const { t } = useTranslation()

  return (
    <nav
      className="primary-navigation"
      id={id}
      aria-label={t('shell.primaryNavigation')}
      data-open={isOpen}
    >
      <ul>
        {navigationItems.map((item) => (
          <li key={item.to}>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'navigation-link navigation-link-active' : 'navigation-link'
              }
              end={item.end}
              onClick={onNavigate}
              to={item.to}
            >
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
