export const resources = {
  de: {
    translation: {
      language: { selectorLabel: 'Sprache auswählen', german: 'Deutsch', english: 'English' },
      brand: { homeLabel: 'ImmoPilot DE Startseite', release: 'Grundlage · 0.1' },
      shell: {
        skipToContent: 'Zum Inhalt springen',
        primaryNavigation: 'Hauptnavigation',
        openMenu: 'Navigation öffnen',
        closeMenu: 'Navigation schließen',
        navigation: {
          overview: 'Überblick',
          purchaseCosts: 'Kaufkosten',
          financing: 'Finanzierung',
          comparison: 'Vergleich',
        },
        pages: {
          eyebrow: 'Rechner in Vorbereitung',
          back: 'Zurück zum Überblick',
          purchaseCosts: {
            title: 'Kaufkosten berechnen',
            summary:
              'Der kommende Rechner schlüsselt Grunderwerbsteuer, Notar, Grundbuch, Makler und weitere Startkosten transparent auf.',
          },
          financing: {
            title: 'Finanzierung planen',
            summary:
              'Hier entstehen Darlehensrate, Tilgungsplan, Sondertilgung und Anschlussfinanzierungs-Szenarien.',
          },
          comparison: {
            title: 'Szenarien vergleichen',
            summary:
              'Diese Ansicht wird Eigennutzung, Vermietung und alternative Finanzierungsszenarien vergleichbar machen.',
          },
        },
      },
      hero: {
        eyebrow: 'Immobilienentscheidungen für Deutschland',
        titleLineOne: 'Zahlen verstehen.',
        titleLineTwo: 'Sicherer entscheiden.',
        summary:
          'Ein transparenter Rechner für Kaufkosten, Finanzierung und langfristige Immobilienszenarien. Lokal im Browser und ohne Benutzerkonto.',
        primaryAction: 'Kaufkosten starten',
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
          'Nur unverbindliche Planungswerte. Keine Finanzierungs-, Anlage-, Steuer- oder Rechtsberatung und kein Darlehensangebot oder Finanzierungszusage. Prüfen Sie aktuelle Werte und lassen Sie sich vor einer Entscheidung qualifiziert beraten.',
        copyright: '© 2026 ImmoPilot DE',
      },
      property: { purchasePrice: 'Kaufpreis' },
      purchase: {
        additionalCosts: 'Kaufnebenkosten',
        section: {
          quickInputs: 'Schnelleingaben',
          advancedInputs: 'Erweiterte Eingaben',
          results: 'Ergebnisse',
          nextSteps: 'Nächste Schritte',
        },
        stateLabel: 'Bundesland',
        brokerToggle: 'Makler beteiligt',
        buyerBrokerRateLabel: 'Käuferprovision',
        rateLabel: 'Satz',
        budgetPlaceholder: 'Betrag in €',
        budgetStatus: {
          notBudgeted: 'Noch nicht budgetiert',
          confirmedZero: 'Bestätigt: 0 €',
          budgeted: 'Budgetiert',
        },
        fixedPeriod: {
          5: '5 Jahre',
          10: '10 Jahre',
          15: '15 Jahre',
          20: '20 Jahre',
          30: '30 Jahre',
        },
        errors: {
          purchasePriceRequired: 'Kaufpreis ist erforderlich und muss größer als 0 sein.',
          stateRequired: 'Bitte wählen Sie ein Bundesland.',
          calculationFailed: 'Berechnung fehlgeschlagen',
          field: 'Feld',
          code: 'Code',
        },
        warnings: {
          unconfirmedBudgets: 'Post-Purchase-Budget noch nicht bestätigt',
          unconfirmedBudgetsMessage:
            'Die folgenden Budgets sind noch nicht bestätigt. Bitte setzen Sie sie auf "Bestätigt: 0 €" oder geben Sie ein Budget ein.',
        },
        budgetFields: {
          renovationBudget: 'Renovierungsbudget',
          movingSetupCosts: 'Umzugs- und Einrichtungskosten',
        },
        results: {
          transferTax: 'Grunderwerbsteuer',
          notaryCosts: 'Notarkosten',
          landRegisterCosts: 'Grundbuchkosten',
          brokerCommission: 'Maklerprovision',
          transactionCosts: 'Kaufnebenkosten gesamt',
          postPurchaseBudget: 'Post-Purchase-Budget',
          totalProjectCost: 'Gesamtkosten',
          purchasePricePlusAllCosts: 'Kaufpreis + alle Nebenkosten + Budget',
          sumOfAbove: 'Summe der obigen Positionen',
          renovationPlusMoving: 'Renovierung + Umzug/Einrichtung',
          assumptionSetVersion: 'Annahmen-Version',
          transferTaxRateSourceDate: 'Grunderwerbsteuer-Quelldatum',
          assumptions: 'Verwendete Annahmen',
          rate: 'Satz',
        },
        origin: {
          'state-lookup': 'Staatlich',
          'assumption-default': 'Standard',
          'user-override': 'Benutzerdefiniert',
        },
        nextSteps: {
          message:
            'Die Kaufkosten stehen. Jetzt können Sie die Finanzierung planen oder Szenarien vergleichen.',
          continueToFinancing: 'Zur Finanzierung →',
          compareScenarios: 'Szenarien vergleichen →',
        },
      },
      finance: { equity: 'Eigenkapital', monthlyPayment: 'Monatliche Darlehensrate' },
    },
  },
  en: {
    translation: {
      language: { selectorLabel: 'Choose language', german: 'Deutsch', english: 'English' },
      brand: { homeLabel: 'ImmoPilot DE home', release: 'Foundation · 0.1' },
      shell: {
        skipToContent: 'Skip to content',
        primaryNavigation: 'Primary navigation',
        openMenu: 'Open navigation',
        closeMenu: 'Close navigation',
        navigation: {
          overview: 'Overview',
          purchaseCosts: 'Purchase costs',
          financing: 'Financing',
          comparison: 'Comparison',
        },
        pages: {
          eyebrow: 'Calculator in preparation',
          back: 'Back to overview',
          purchaseCosts: {
            title: 'Calculate purchase costs',
            summary:
              'The upcoming calculator will transparently break down transfer tax, notary, land-register, broker and other setup costs.',
          },
          financing: {
            title: 'Plan financing',
            summary:
              'This is where mortgage payments, amortization, special repayments and refinancing scenarios will be built.',
          },
          comparison: {
            title: 'Compare scenarios',
            summary:
              'This view will compare owner occupation, rental investment and alternative financing scenarios consistently.',
          },
        },
      },
      hero: {
        eyebrow: 'Property decisions for Germany',
        titleLineOne: 'Understand the numbers.',
        titleLineTwo: 'Decide with confidence.',
        summary:
          'A transparent calculator for acquisition costs, financing and long-term property scenarios. Local in your browser, with no account required.',
        primaryAction: 'Start purchase costs',
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
          'Educational estimates only. Not financial, mortgage, investment, tax or legal advice, and not a financing offer or approval. Check current figures and obtain qualified advice before making a commitment.',
        copyright: '© 2026 ImmoPilot DE',
      },
      property: { purchasePrice: 'Purchase price' },
      purchase: {
        additionalCosts: 'Acquisition costs',
        section: {
          quickInputs: 'Quick inputs',
          advancedInputs: 'Advanced inputs',
          results: 'Results',
          nextSteps: 'Next steps',
        },
        stateLabel: 'Federal state',
        brokerToggle: 'Broker involved',
        buyerBrokerRateLabel: 'Buyer broker commission',
        rateLabel: 'Rate',
        budgetPlaceholder: 'Amount in €',
        budgetStatus: {
          notBudgeted: 'Not yet budgeted',
          confirmedZero: 'Confirmed: €0',
          budgeted: 'Budgeted',
        },
        fixedPeriod: {
          5: '5 years',
          10: '10 years',
          15: '15 years',
          20: '20 years',
          30: '30 years',
        },
        errors: {
          purchasePriceRequired: 'Purchase price is required and must be greater than 0.',
          stateRequired: 'Please select a federal state.',
          calculationFailed: 'Calculation failed',
          field: 'Field',
          code: 'Code',
        },
        warnings: {
          unconfirmedBudgets: 'Post-purchase budget not confirmed',
          unconfirmedBudgetsMessage:
            'The following budgets are not yet confirmed. Please set them to "Confirmed: €0" or enter a budget amount.',
        },
        budgetFields: {
          renovationBudget: 'Renovation budget',
          movingSetupCosts: 'Moving and setup costs',
        },
        results: {
          transferTax: 'Property transfer tax',
          notaryCosts: 'Notary costs',
          landRegisterCosts: 'Land-register costs',
          brokerCommission: 'Broker commission',
          transactionCosts: 'Total acquisition costs',
          postPurchaseBudget: 'Post-purchase budget',
          totalProjectCost: 'Total project cost',
          purchasePricePlusAllCosts: 'Purchase price + all costs + budget',
          sumOfAbove: 'Sum of the above items',
          renovationPlusMoving: 'Renovation + moving/setup',
          assumptionSetVersion: 'Assumption set version',
          transferTaxRateSourceDate: 'Transfer tax rate source date',
          assumptions: 'Applied assumptions',
          rate: 'Rate',
        },
        origin: {
          'state-lookup': 'Statutory',
          'assumption-default': 'Default',
          'user-override': 'User override',
        },
        nextSteps: {
          message: 'Purchase costs are ready. Now you can plan financing or compare scenarios.',
          continueToFinancing: 'Continue to financing →',
          compareScenarios: 'Compare scenarios →',
        },
      },
      finance: { equity: 'Equity', monthlyPayment: 'Monthly mortgage payment' },
    },
  },
} as const

export type SupportedLanguage = keyof typeof resources

export const supportedLanguages = Object.keys(resources) as SupportedLanguage[]
