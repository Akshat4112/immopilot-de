export const resources = {
  de: {
    translation: {
      language: { selectorLabel: 'Sprache auswählen', german: 'Deutsch', english: 'English' },
      brand: { homeLabel: 'ImmoPilot DE Startseite', release: 'Grundlage · 0.1' },
      hero: {
        eyebrow: 'Immobilienentscheidungen für Deutschland',
        titleLineOne: 'Zahlen verstehen.',
        titleLineTwo: 'Sicherer entscheiden.',
        summary:
          'Ein transparenter Rechner für Kaufkosten, Finanzierung und langfristige Immobilienszenarien. Lokal im Browser und ohne Benutzerkonto.',
        primaryAction: 'Projekt ansehen',
        documentation: 'Dokumentation',
      },
      preview: {
        label: 'Geplanter Beispielüberblick',
        title: 'Beispielszenario',
        status: 'Vorbereitet',
        caption: 'Kaufpreis · Baden-Württemberg',
        remainingDebtAfterYears: 'Restschuld nach {{years}} J.',
        verified: 'Geprüft gegen Berechnungsspezifikation {{version}}',
      },
      principles: {
        label: 'Projektgrundsätze',
        local: 'Lokale Berechnung',
        accounts: 'Keine Konten',
        assumptions: 'Quellenbasierte Annahmen',
        bilingual: 'Deutsch & English',
      },
      foundation: {
        eyebrow: 'Version 1',
        title: 'Eine klare Grundlage für den Immobilienkauf.',
        summary:
          'Die fachlichen Regeln und deutschen Annahmen sind dokumentiert. Die interaktiven Rechner werden schrittweise auf dieser geprüften Grundlage gebaut.',
        acquisitionDescription:
          'Bundesland, Notar, Grundbuch und Makler transparent aufschlüsseln.',
        financingTitle: 'Finanzierung',
        financingDescription: 'Rate, Tilgung, Restschuld und Anschlussfinanzierung nachvollziehen.',
        decisionsTitle: 'Entscheidungen',
        decisionsDescription:
          'Eigennutzung, Vermietung und mehrere Szenarien konsistent vergleichen.',
      },
      footer: {
        disclaimer:
          'Nur unverbindliche Planungswerte. Keine Finanzierungs-, Steuer- oder Rechtsberatung und kein Darlehensangebot.',
        copyright: '© 2026 ImmoPilot DE',
      },
      property: { purchasePrice: 'Kaufpreis' },
      purchase: { additionalCosts: 'Kaufnebenkosten' },
      finance: { equity: 'Eigenkapital', monthlyPayment: 'Monatliche Darlehensrate' },
    },
  },
  en: {
    translation: {
      language: { selectorLabel: 'Choose language', german: 'Deutsch', english: 'English' },
      brand: { homeLabel: 'ImmoPilot DE home', release: 'Foundation · 0.1' },
      hero: {
        eyebrow: 'Property decisions for Germany',
        titleLineOne: 'Understand the numbers.',
        titleLineTwo: 'Decide with confidence.',
        summary:
          'A transparent calculator for acquisition costs, financing and long-term property scenarios. Local in your browser, with no account required.',
        primaryAction: 'View project',
        documentation: 'Documentation',
      },
      preview: {
        label: 'Planned example overview',
        title: 'Example scenario',
        status: 'Prepared',
        caption: 'Purchase price · Baden-Württemberg',
        remainingDebtAfterYears: 'Remaining debt after {{years}} years',
        verified: 'Verified against calculation specification {{version}}',
      },
      principles: {
        label: 'Project principles',
        local: 'Local calculations',
        accounts: 'No accounts',
        assumptions: 'Source-based assumptions',
        bilingual: 'German & English',
      },
      foundation: {
        eyebrow: 'Version 1',
        title: 'A clear foundation for buying property.',
        summary:
          'The financial rules and German assumptions are documented. The interactive calculators will be built step by step on this verified foundation.',
        acquisitionDescription:
          'Break down the federal state, notary, land-register and broker costs transparently.',
        financingTitle: 'Financing',
        financingDescription:
          'Understand payments, principal repayment, remaining debt and refinancing.',
        decisionsTitle: 'Decisions',
        decisionsDescription:
          'Compare owner occupation, rental investment and multiple scenarios consistently.',
      },
      footer: {
        disclaimer:
          'Non-binding planning estimates only. Not financial, tax or legal advice, and not a loan offer.',
        copyright: '© 2026 ImmoPilot DE',
      },
      property: { purchasePrice: 'Purchase price' },
      purchase: { additionalCosts: 'Acquisition costs' },
      finance: { equity: 'Equity', monthlyPayment: 'Monthly mortgage payment' },
    },
  },
} as const

export type SupportedLanguage = keyof typeof resources

export const supportedLanguages = Object.keys(resources) as SupportedLanguage[]
