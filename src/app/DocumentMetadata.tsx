import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

const pageKeys: Record<string, string> = {
  '/': 'home',
  '/purchase-costs': 'purchaseCosts',
  '/financing': 'financing',
  '/results': 'results',
  '/scenarios': 'scenarios',
  '/comparison': 'comparison',
  '/privacy': 'privacy',
}

function setMetaContent(selector: string, content: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

export function DocumentMetadata() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()

  useEffect(() => {
    const pageKey = pageKeys[pathname] ?? 'home'
    const title = t(`metadata.pages.${pageKey}.title`)
    const description = t(`metadata.pages.${pageKey}.description`)

    document.title = title
    setMetaContent('meta[name="description"]', description)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[property="og:description"]', description)
  }, [i18n.resolvedLanguage, pathname, t])

  return null
}
