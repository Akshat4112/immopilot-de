import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type ThemePreference = 'system' | 'light' | 'dark'

/**
 * A theme override is intentionally session-local. Reload returns to the
 * operating-system preference; no financial data or theme choice is persisted.
 */
export function ThemeSelector() {
  const { t } = useTranslation()
  const [preference, setPreference] = useState<ThemePreference>('system')

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      document.documentElement.dataset.theme =
        preference === 'system' ? (query?.matches ? 'dark' : 'light') : preference
    }

    updateTheme()
    query?.addEventListener?.('change', updateTheme)
    return () => {
      query?.removeEventListener?.('change', updateTheme)
      delete document.documentElement.dataset.theme
    }
  }, [preference])

  return (
    <label className="theme-selector">
      <span className="sr-only">{t('theme.label')}</span>
      <select
        aria-label={t('theme.label')}
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
      >
        <option value="system">{t('theme.system')}</option>
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
      </select>
    </label>
  )
}
