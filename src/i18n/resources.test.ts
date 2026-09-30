import { describe, expect, it } from 'vitest'

import { resources } from './resources'

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  return Object.values(value).flatMap(collectStrings)
}

describe('German interface voice', () => {
  it('uses the documented informal address consistently', () => {
    const germanCopy = collectStrings(resources.de.translation).join('\n')

    expect(germanCopy).not.toMatch(/\b(?:Ihnen|Ihr(?:e|en|em|er|es)?)\b/)
    expect(resources.de.translation.footer.disclaimer).toContain('Prüfe aktuelle Werte')
    expect(resources.de.translation.purchase.nextSteps.message).toContain('Jetzt kannst du')
  })

  it('does not expose obsolete foundation-stage product copy in either language', () => {
    const allCopy = [
      ...collectStrings(resources.de.translation),
      ...collectStrings(resources.en.translation),
    ].join('\n')

    expect(allCopy).not.toContain('Grundlage · 0.1')
    expect(allCopy).not.toContain('Foundation · 0.1')
    expect(allCopy).not.toMatch(/interaktiven Rechner werden schrittweise/i)
    expect(allCopy).not.toMatch(/interactive calculators will be built step by step/i)
  })
})
