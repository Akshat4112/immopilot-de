import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources, supportedLanguages } from './resources'

export const defaultLanguage = 'de'

void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: supportedLanguages,
  load: 'languageOnly',
  interpolation: { escapeValue: false },
  initAsync: false,
})

function updateDocumentLanguage(language: string) {
  document.documentElement.lang = language
}

updateDocumentLanguage(i18n.resolvedLanguage as string)
i18n.on('languageChanged', updateDocumentLanguage)

export default i18n
