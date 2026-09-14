import { useTranslation } from 'react-i18next'

import type { SupportedLanguage } from '../i18n/resources'

const languageOptions: readonly SupportedLanguage[] = ['de', 'en']

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const activeLanguage = i18n.resolvedLanguage as SupportedLanguage

  return (
    <div className="language-switcher" role="group" aria-label={t('language.selectorLabel')}>
      {languageOptions.map((language) => (
        <button
          aria-label={t(`language.${language === 'de' ? 'german' : 'english'}`)}
          aria-pressed={activeLanguage === language}
          className="language-option"
          key={language}
          onClick={() => void i18n.changeLanguage(language)}
          type="button"
        >
          {language === 'de' ? 'DE' : 'EN'}
        </button>
      ))}
    </div>
  )
}
