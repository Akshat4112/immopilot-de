export const resources = {
  de: {
    translation: {
      language: { selectorLabel: 'Sprache auswählen', german: 'Deutsch', english: 'English' },
      brand: { homeLabel: 'ImmoPilot DE Startseite', release: 'Version 1 · Release-Prüfung' },
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
          results: 'Auswertung',
          scenarios: 'Gespeicherte Szenarien',
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
        ownerAction: 'Für Eigennutzung rechnen',
        rentalAction: 'Kapitalanlage bewerten',
        documentation: 'Dokumentation',
      },
      preview: {
        label: 'Beispielrechnung',
        title: 'Beispielszenario',
        status: 'Berechnet',
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
      additionalRepaymentGuidance: {
        title: 'So rechnet ImmoPilot mit Sondertilgungen',
        intro:
          'Diese Regeln gelten einheitlich für Tilgungsplan, Anschlussfinanzierung, Eigennutzung, Vermietung und Immobilienvergleich.',
        items: {
          timing: {
            term: 'Zeitpunkt im Zahlungsmonat',
            description:
              'Zuerst werden Monatszinsen und die reguläre Rate berechnet. Danach wird die Sondertilgung am Monatsende von der verbleibenden Restschuld abgezogen.',
          },
          annual: {
            term: 'Jährlicher Betrag',
            description:
              'Der gewählte Monat wiederholt sich in jedem Darlehensjahr. Er bezeichnet einen Darlehensmonat, keinen Kalendermonat.',
          },
          overlap: {
            term: 'Mehrere Zahlungen',
            description:
              'Jährliche und einmalige Zahlungen im selben Monat werden addiert und auf die verbleibende Restschuld begrenzt. Zahlungen nach vollständiger Tilgung haben keine Wirkung.',
          },
          payment: {
            term: 'Vertragliche Monatsrate',
            description:
              'Die reguläre Monatsrate bleibt unverändert; dadurch wird das Darlehen früher zurückgezahlt. Eine spätere Ratensenkung wird nicht modelliert.',
          },
          results: {
            term: 'Darstellung in Ergebnissen',
            description:
              'Restschuld, Anschlussfinanzierung und Projektionen verwenden den Tilgungsplan mit Sondertilgung. Lebenszeitwerte nach der Zinsbindung sind klar gekennzeichnete Projektionen bei konstantem Sollzins. Die Cash-on-Cash-Rendite bleibt vor freiwilliger Sondertilgung.',
          },
          contract: {
            term: 'Darlehensvertrag',
            description:
              'ImmoPilot prüft keine vertraglichen Rechte, Höchstbeträge, Gebühren, Fristen oder erforderlichen Zustimmungen des Darlehensgebers.',
          },
        },
        note: 'Planungshinweis: Prüfe jede Sondertilgung gegen deinen Darlehensvertrag. Die Berechnung ist weder ein Finanzierungsangebot noch eine Empfehlung.',
      },
      scenarios: {
        page: {
          eyebrow: 'Szenarien verwalten',
          title: 'Gespeicherte Szenarien',
          summary:
            'Speichere deine Eingaben lokal, übertrage sie als JSON oder teile sie über einen Link. Ergebnisse werden beim Laden immer neu berechnet.',
        },
        current: {
          title: 'Aktueller Arbeitsstand',
          description:
            'Gespeichert werden ausschließlich die Eingaben – keine berechneten Ergebnisse.',
        },
        saved: {
          title: 'Lokal gespeicherte Szenarien',
          description: 'Diese Szenarien bleiben nur in diesem Browser gespeichert.',
          empty: 'Noch keine Szenarien gespeichert.',
          updated: 'Aktualisiert: {{date}}',
          deleteWarning: '„{{name}}“ wirklich dauerhaft löschen?',
          clearAllWarning:
            'Alle lokal gespeicherten Szenarien dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
        },
        shared: {
          title: 'Geteiltes Szenario',
          valid: '„{{name}}“ wurde sicher aus dem Link gelesen. Lade oder speichere es bewusst.',
        },
        share: {
          title: 'Freigabelink',
          description:
            'Der Link enthält die versionierten Eingaben. Es werden keine Daten an einen Server gesendet.',
          fieldLabel: 'Freigabelink für das Szenario',
        },
        privacy: {
          shareTitle: 'Finanzdaten im Link teilen?',
          shareWarning:
            'Jeder mit dem vollständigen Link kann die enthaltenen Finanzdaten lesen. Der Link kann im Browserverlauf, in Zwischenablagen, Nachrichten, Screenshots oder Synchronisierungsdiensten verbleiben. Der Szenarioname wird nicht aufgenommen.',
          exportTitle: 'Sensible Finanzdaten exportieren?',
          exportWarning:
            'Die JSON-Datei kann Kaufpläne und finanzielle Verhältnisse offenlegen. Prüfe ihren Inhalt vor dem Teilen und bewahre sie angemessen geschützt auf.',
        },
        fields: { name: 'Szenarioname' },
        actions: {
          save: 'Szenario speichern',
          saveShared: 'Lokal speichern',
          shareCurrent: 'Aktuellen Stand teilen',
          reset: 'Arbeitsstand zurücksetzen',
          load: 'Laden',
          rename: 'Umbenennen',
          duplicate: 'Duplizieren',
          delete: 'Löschen',
          export: 'JSON exportieren',
          import: 'JSON importieren',
          share: 'Teilen',
          compare: 'Vergleichen',
          copyLink: 'Link kopieren',
          confirmShare: 'Verstanden, Link erstellen',
          confirmExport: 'Verstanden, JSON exportieren',
          cancel: 'Abbrechen',
          removeSharedData: 'Geteilte Daten aus URL entfernen',
          clearAll: 'Alle lokalen Daten löschen',
          confirmClearAll: 'Alle endgültig löschen',
          confirmDelete: 'Endgültig löschen',
          results: 'Zur Auswertung →',
        },
        status: {
          saved: 'Szenario gespeichert.',
          renamed: 'Szenario umbenannt.',
          duplicated: 'Szenario dupliziert.',
          deleted: 'Szenario gelöscht.',
          cleared: 'Alle lokal gespeicherten Szenarien wurden gelöscht.',
          loaded: 'Szenario geladen. Alle Ergebnisse werden neu berechnet.',
          reset: 'Der aktuelle Arbeitsstand wurde zurückgesetzt.',
          imported: 'Szenario importiert und lokal gespeichert.',
          exported: 'Szenario als JSON exportiert.',
          linkReady: 'Freigabelink erstellt.',
          nameRequired: 'Bitte gib einen Szenarionamen ein.',
          dataInvalid: 'Die aktuellen Eingaben können nicht als Szenario gespeichert werden.',
          urlCleared: 'Die geteilten Daten wurden aus der URL entfernt.',
          writeFailed: 'Das Szenario konnte nicht lokal gespeichert werden.',
        },
        issues: {
          corrupted: {
            title: 'Ungültige Szenariodaten',
            message:
              'Die Daten sind beschädigt oder unvollständig und wurden nicht geladen. Deine aktuellen Eingaben bleiben unverändert.',
          },
          'unsupported-version': {
            title: 'Nicht unterstützte Szenarioversion',
            message:
              'Dieses Szenario stammt aus einer nicht unterstützten Version und wurde nicht geladen.',
          },
          'storage-unavailable': {
            title: 'Lokaler Speicher nicht verfügbar',
            message:
              'Der Browser hat den lokalen Speicher blockiert. Du kannst weiterhin rechnen und Freigabelinks verwenden.',
          },
        },
        copyName: '{{name}} (Kopie)',
      },
      comparison: {
        page: {
          eyebrow: 'Szenarien vergleichen',
          title: 'Immobilien im direkten Vergleich',
          summary:
            'Vergleiche bis zu drei gespeicherte Szenarien. Alle Werte werden aus den gespeicherten Eingaben mit der aktuellen Berechnungslogik neu berechnet.',
        },
        empty: {
          title: 'Noch keine Szenarien zum Vergleichen',
          message: 'Speichere zuerst mindestens ein Szenario in diesem Browser.',
        },
        noSelection: {
          title: 'Szenario hinzufügen',
          message: 'Wähle oben ein gespeichertes Szenario für den Vergleich aus.',
        },
        picker: {
          title: 'Vergleich zusammenstellen',
          description: 'Füge Immobilien hinzu, entferne sie oder ändere ihre Reihenfolge.',
          label: 'Gespeichertes Szenario',
          count: '{{count}} von maximal {{max}} Szenarien ausgewählt',
        },
        table: {
          title: 'Vergleichswerte',
          description:
            'Fehlende Eingaben und Werte mit unterschiedlicher Berechnungsbasis sind ausdrücklich gekennzeichnet.',
          metric: 'Kennzahl',
          mobileHint: 'Auf kleinen Bildschirmen horizontal wischen, um alle Immobilien zu sehen.',
        },
        mode: {
          'owner-occupier': 'Eigennutzung',
          'rental-investment': 'Vermietung',
        },
        repayment: {
          additionalRepayments: 'Mit Sondertilgung',
          invalid: 'Sondertilgung ungültig',
        },
        groups: {
          purchase: 'Kauf',
          financing: 'Finanzierung',
          performance: 'Rendite und Cashflow',
          offer: 'Kaufangebot',
        },
        metrics: {
          purchasePrice: 'Kaufpreis',
          acquisitionCosts: 'Kaufnebenkosten',
          equity: 'Erforderliches Eigenkapital',
          loan: 'Darlehen',
          monthlyPayment: 'Monatliche Rate',
          remainingDebt: 'Restschuld',
          grossYield: 'Bruttomietrendite',
          netYield: 'Nettomietrendite',
          monthlyCashFlow: 'Monatlicher Cashflow vor Steuern',
          projectedReturn: 'Prognostiziertes Ergebnis',
          grossYieldCeiling: 'Preisobergrenze nach Bruttorendite',
          netYieldCeiling: 'Preisobergrenze nach Nettorendite',
          affordabilityCeiling: 'Preisobergrenze nach Budget',
          comparableValue: 'Vergleichbarer Wert',
          openingOffer: 'Eröffnungsangebot',
        },
        status: {
          missingCount: '{{count}} Eingabe(n) fehlen',
          notConfigured: 'Nicht konfiguriert',
          notApplicable: 'Für dieses Modell nicht anwendbar',
          unavailable: 'Nicht berechenbar',
        },
        value: {
          range: '{{low}} bis {{high}}',
          yieldBasis: '{{numerator}} ÷ {{denominator}}',
          afterYears: 'nach {{years}} Jahren Zinsbindung',
          afterYearsWithAdditionalRepayments: 'nach Sondertilgung und {{years}} Jahren Zinsbindung',
          ownerReturn: 'Vorteil ggü. Miete nach {{years}} Jahren',
          rentalReturn: 'Gewinn vor Steuern nach {{years}} Jahren',
          additionalRepaymentsIncluded:
            'Sondertilgungen werden im jeweiligen Zahlungsmonat berücksichtigt.',
        },
        nonComparable: {
          remainingDebt: 'Unterschiedliche Zinsbindungszeiträume',
          projectedReturn: 'Unterschiedliche Modelle oder Zeiträume',
        },
        actions: {
          add: 'Hinzufügen',
          remove: 'Entfernen',
          moveLeft: '{{name}} nach links verschieben',
          moveRight: '{{name}} nach rechts verschieben',
          openScenarios: 'Szenarien speichern',
          manageScenarios: 'Gespeicherte Szenarien verwalten →',
        },
      },
      foundation: {
        eyebrow: 'Umgesetzte Arbeitsbereiche',
        title: 'Von Kaufkosten bis Immobilienvergleich.',
        summary:
          'Berechne Kaufnebenkosten und Finanzierung, plane Sondertilgungen, prüfe Eigennutzung oder Vermietung und vergleiche bis zu drei gespeicherte Szenarien. Version 1 befindet sich in der abschließenden Release-Prüfung.',
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
          'Nur unverbindliche Planungswerte. Keine Finanzierungs-, Anlage-, Steuer- oder Rechtsberatung und kein Darlehensangebot oder Finanzierungszusage. Prüfe aktuelle Werte und lass dich vor einer Entscheidung qualifiziert beraten.',
        privacyNotice: 'Datenschutz & Hinweise',
        copyright: '© 2026 ImmoPilot DE',
      },
      provenance: {
        title: 'Berechnungsgrundlage und Grenzen',
        scopeName: {
          purchase: 'Kaufkosten',
          financing: 'Finanzierung',
          repayment: 'Tilgung und Sondertilgung',
          refinancing: 'Anschlussfinanzierung',
          owner: 'Eigennutzung',
          rental: 'Kapitalanlage',
          offer: 'Angebotspreis',
          comparison: 'Szenariovergleich',
        },
        fullNotice: 'Datenschutz & vollständige Hinweise',
        assumptionSet: 'Annahmensatz',
        verifiedOn: 'Standardwerte geprüft am',
        calculationSpecification: 'Berechnungsspezifikation',
        limitation:
          'Ergebnisse sind unverbindliche Planungswerte, keine Beratung, Bewertung, Garantie, Finanzierungszusage oder Darlehensofferte.',
        scope: {
          purchase:
            'Grunderwerbsteuer und Standardwerte stammen aus dem Annahmensatz. Von dir geänderte Werte sind eigene Eingaben.',
          financing:
            'Kaufkosten verwenden den Annahmensatz; Eigenkapital, Zinssatz, Tilgung und Zinsbindung sind deine nicht extern geprüften Eingaben.',
          repayment:
            'Tilgungsverläufe folgen der Berechnungsspezifikation. Sondertilgungen und Darlehenskonditionen sind deine Eingaben und werden nicht mit einem Vertrag abgeglichen.',
          refinancing:
            'Anschlusszinsen sind frei gewählte Stressannahmen, keine Marktprognosen oder Angebote. Gebühren und Kreditprüfung sind nicht enthalten.',
          owner:
            'Miete, Kostenwachstum, Wertentwicklung und Alternativrendite sind deine Szenarioannahmen und keine quellenbasierten Prognosen.',
          rental:
            'Miete, Leerstand, Kosten, Wertentwicklung und Verkauf sind deine Vor-Steuer-Annahmen; Steuer- und Rechtsfolgen sind nicht modelliert.',
          offer:
            'Preisgrenzen verwenden deine Zielwerte, Budgets und Vergleichswerte. Sie sind weder Wertgutachten noch Kauf- oder Finanzierungsangebot.',
          comparison:
            'Alle Szenarien werden mit derselben Spezifikation neu berechnet. Nutzereingaben und unterschiedliche Zeiträume bleiben ausdrücklich eigene Vergleichsgrundlagen.',
        },
      },
      privacy: {
        page: {
          eyebrow: 'Transparenz',
          title: 'Datenschutz und finanzielle Hinweise',
          summary:
            'Wie ImmoPilot DE deine Eingaben verarbeitet, welche Daten gespeichert oder geteilt werden und wo die Grenzen der Berechnungen liegen.',
        },
        status: {
          title: 'Stand dieser Hinweise',
          version: 'Version {{version}}',
          verified: 'Technisch geprüft am {{date}}',
        },
        warning: {
          title: 'Kein Ersatz für fachliche Beratung',
          body: 'ImmoPilot DE ist ein Lern- und Planungstool. Ergebnisse sind keine Finanzierungs-, Anlage-, Steuer-, Buchhaltungs- oder Rechtsberatung, kein Wertgutachten, Darlehensangebot, Vertrag oder Garantie. Prüfe wesentliche Werte bei qualifizierten Fachpersonen.',
        },
        sections: {
          purpose: {
            title: 'Welche Daten verarbeitet werden',
            body: 'Der Rechner verarbeitet Immobilien- und Finanzplanungswerte wie Kaufpreis, Bundesland, Eigenkapital, Zinsen, Tilgung, Miete und Kosten. Namen, genaue Privatanschriften, Kontodaten, Steuer-IDs oder Dokumente werden nicht benötigt und sollten nicht eingegeben werden.',
          },
          local: {
            title: 'Lokale Berechnung',
            body: 'Berechnungen laufen im Browser. Nicht gespeicherte Eingaben bleiben im aktuellen Arbeitsstand. Die Anwendung besitzt kein Benutzerkonto und kein eigenes Backend und sendet Szenariowerte nicht für Berechnung, Analyse, Werbung oder Fehlerberichte an den Betreiber.',
          },
          saved: {
            title: 'Speichern und löschen',
            body: 'Erst nach deiner Auswahl „Szenario speichern“ wird versioniertes Eingabe-JSON im localStorage dieses Browsers abgelegt. Du kannst einzelne Szenarien oder alle lokalen Daten löschen. Andere Personen mit Zugriff auf dasselbe Browserprofil können gespeicherte Daten möglicherweise sehen.',
          },
          sharing: {
            title: 'Freigabelinks und JSON-Dateien',
            body: 'Freigabelinks enthalten Eingaben nur im URL-Fragment; der Szenarioname wird ausgeschlossen. Jeder mit dem vollständigen Link kann die enthaltenen Finanzdaten lesen. Export und Import erfolgen lokal. Prüfe Links und Dateien vor dem Teilen und lösche Kopien, die nicht mehr benötigt werden.',
          },
          hosting: {
            title: 'GitHub-Pages-Hosting',
            body: 'GitHub Pages liefert die statischen Dateien aus. GitHub erklärt, dass dabei IP-Adressen zu Sicherheitszwecken protokolliert und gespeichert werden. Die allgemeine GitHub-Datenschutzerklärung beschreibt weitere mögliche Nutzungs- und Verbindungsdaten. Diese Hosting-Verarbeitung ist von deinen lokalen Szenariodaten getrennt.',
          },
          limits: {
            title: 'Quellen und Rechengrenzen',
            body: 'Quellenbasierte Standardwerte zeigen Version und Prüfdatum, sind aber keine Live-Daten. Zinsen, Mieten, Wachstum, Immobilienwerte, Kosten und Zielrenditen sind editierbare Nutzereingaben. Tatsächliche Steuern, Gebühren, Verträge, Risiken und Ergebnisse können abweichen.',
          },
          controls: {
            title: 'Deine Kontrolle',
            body: 'Setze den Arbeitsstand zurück, lösche gespeicherte Szenarien, entferne geteilte Daten aus der URL oder lösche die Website-Daten im Browser. Der Betreiber kann lokale Szenarien nicht einsehen, wiederherstellen oder aus der Ferne löschen.',
          },
        },
        sources: {
          title: 'Quellen und ausführliches Dokument',
          body: 'Die technischen Hosting-Aussagen wurden gegen die offiziellen GitHub-Unterlagen geprüft. Das ausführliche zweisprachige Dokument enthält zusätzliche rechtliche Grenzen und den Prüfvermerk für die Release-Freigabe.',
          githubPages: 'GitHub Pages: Datenerhebung',
          githubPrivacy: 'Allgemeine Datenschutzerklärung von GitHub',
          fullDocument: 'Vollständiger Finanz- und Datenschutzhinweis im Repository',
        },
      },
      metadata: {
        pages: {
          home: {
            title: 'ImmoPilot DE · Immobilien transparent planen',
            description:
              'Plane Kaufkosten, Finanzierung und langfristige Immobilienszenarien für Deutschland transparent im Browser.',
          },
          purchaseCosts: {
            title: 'Kaufnebenkosten berechnen · ImmoPilot DE',
            description:
              'Berechne Grunderwerbsteuer, Notar, Grundbuch, Makler und weitere Kaufbudgets mit transparenten Annahmen.',
          },
          financing: {
            title: 'Immobilienfinanzierung planen · ImmoPilot DE',
            description:
              'Plane Eigenkapital, Darlehen, Monatsrate, Zinsbindung, Restschuld und Sondertilgungen.',
          },
          results: {
            title: 'Immobilie auswerten · ImmoPilot DE',
            description:
              'Prüfe Finanzierung, Anschlussfinanzierung, Eigennutzung, Vermietung und Angebotspreise als transparente Szenarien.',
          },
          scenarios: {
            title: 'Szenarien speichern und teilen · ImmoPilot DE',
            description:
              'Speichere Immobilien-Szenarien lokal, importiere oder exportiere JSON und erstelle Freigabelinks ohne Backend.',
          },
          comparison: {
            title: 'Immobilien vergleichen · ImmoPilot DE',
            description: 'Vergleiche bis zu drei gespeicherte Immobilien-Szenarien nebeneinander.',
          },
          privacy: {
            title: 'Datenschutz und Hinweise · ImmoPilot DE',
            description:
              'Informationen zu lokaler Verarbeitung, Speicherung, Freigabelinks, GitHub Pages und den Grenzen der Berechnungen.',
          },
        },
      },
      property: { purchasePrice: 'Kaufpreis' },
      purchase: {
        additionalCosts: 'Kaufnebenkosten',
        page: {
          eyebrow: 'Kaufnebenkosten',
          summary:
            'Berechne Grunderwerbsteuer, Notar, Grundbuch und Maklerkosten für dein Bundesland mit transparenten, editierbaren Annahmen.',
        },
        section: {
          quickInputs: 'Schnelleingaben',
          postPurchaseBudgets: 'Budget nach dem Kauf',
          advancedInputs: 'Erweiterte Eingaben',
          results: 'Ergebnisse',
          nextSteps: 'Nächste Schritte',
        },
        stateLabel: 'Bundesland',
        states: {
          'DE-BW': 'Baden-Württemberg',
          'DE-BY': 'Bayern',
          'DE-BE': 'Berlin',
          'DE-BB': 'Brandenburg',
          'DE-HB': 'Bremen',
          'DE-HH': 'Hamburg',
          'DE-HE': 'Hessen',
          'DE-MV': 'Mecklenburg-Vorpommern',
          'DE-NI': 'Niedersachsen',
          'DE-NW': 'Nordrhein-Westfalen',
          'DE-RP': 'Rheinland-Pfalz',
          'DE-SL': 'Saarland',
          'DE-SN': 'Sachsen',
          'DE-ST': 'Sachsen-Anhalt',
          'DE-SH': 'Schleswig-Holstein',
          'DE-TH': 'Thüringen',
        },
        brokerToggle: 'Makler beteiligt',
        buyerBrokerRateLabel: 'Käuferprovision',
        financedAcquisitionCostShare: 'Finanzierter Anteil der Kaufnebenkosten',
        rateLabel: 'Satz',
        rateIntro:
          'Die Sätze sind transparente Planungsannahmen. Überschreibe sie nur, wenn dir ein passenderer Wert vorliegt.',
        budgetPlaceholder: 'Betrag in €',
        budgetIntro:
          'Gib einen Betrag ein oder bestätige ausdrücklich 0 €. Die Kaufnebenkosten werden sofort berechnet; die Gesamtkosten erst nach der Bestätigung beider Budgets.',
        budgetStatus: {
          label: 'Status für {{budget}}',
          notBudgeted: 'Noch nicht budgetiert',
          confirmedZero: 'Bestätigt: 0 €',
          budgeted: 'Budgetiert',
          notBudgetedBadge: 'Eingabe erforderlich',
          confirmedZeroBadge: 'Bestätigt',
          budgetedBadge: 'Budgetiert',
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
          stateRequired: 'Bitte wähle ein Bundesland.',
          calculationFailed: 'Berechnung fehlgeschlagen',
          field: 'Feld',
          code: 'Code',
        },
        warnings: {
          unconfirmedBudgets: 'Budgets nach dem Kauf noch nicht bestätigt',
          unconfirmedBudgetsMessage:
            'Die folgenden Budgets sind noch nicht bestätigt. Bitte setze sie auf „Bestätigt: 0 €“ oder gib ein Budget ein.',
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
          postPurchaseBudget: 'Budget nach dem Kauf',
          totalProjectCost: 'Gesamtkosten',
          purchasePricePlusAllCosts: 'Kaufpreis + alle Nebenkosten + Budget',
          sumOfAbove: 'Summe der obigen Positionen',
          renovationPlusMoving: 'Renovierung + Umzug/Einrichtung',
          assumptionSetVersion: 'Annahmen-Version',
          transferTaxRateSourceDate: 'Grunderwerbsteuer-Quelldatum',
          assumptions: 'Verwendete Annahmen',
          rate: 'Satz',
          enterPurchasePrice: 'Gib einen Kaufpreis ein, um die Kaufnebenkosten zu berechnen.',
        },
        origin: {
          'state-lookup': 'Staatlich',
          'assumption-default': 'Standard',
          'user-override': 'Benutzerdefiniert',
        },
        nextSteps: {
          message:
            'Die Kaufkosten stehen. Jetzt kannst du die Finanzierung planen oder Szenarien vergleichen.',
          continueToFinancing: 'Zur Finanzierung →',
          compareScenarios: 'Szenarien vergleichen →',
          financingSoon:
            'Die Kaufkosten sind berechnet. Der Finanzierungsrechner wird als nächster Schritt ergänzt.',
        },
      },
      finance: {
        equity: 'Eigenkapital',
        monthlyPayment: 'Monatliche Darlehensrate',
        page: {
          eyebrow: 'Finanzierung',
          summary:
            'Plane Eigenkapital, Darlehen und Annuitätenrate anhand deiner bereits berechneten Kaufkosten.',
        },
        section: {
          inputs: 'Finanzierung eingeben',
          results: 'Finanzierungsübersicht',
        },
        inputIntro:
          'Diese Eingaben bleiben nur für die aktuelle Browsersitzung im Arbeitsspeicher. Alle Ergebnisse werden aus den bestehenden Rechenmodulen neu berechnet.',
        allocationLegend: 'Wie soll dein Eigenkapital eingesetzt werden?',
        mode: {
          downPayment: 'Anzahlung selbst festlegen',
          downPaymentDescription:
            'Lege die Anzahlung auf den Kaufpreis fest; Kaufnebenkosten werden separat berücksichtigt.',
          availableEquity: 'Verfügbares Eigenkapital einsetzen',
          availableEquityDescription:
            'Verteile das verfügbare Eigenkapital automatisch zuerst auf Kaufnebenkosten und dann auf den Kaufpreis.',
        },
        availableEquity: 'Verfügbares Eigenkapital',
        downPayment: 'Anzahlung auf den Kaufpreis',
        availableEquityHint:
          'Die Anzahlung wird aus dem verfügbaren Eigenkapital nach den Kaufnebenkosten abgeleitet.',
        financedAcquisitionCostShare: 'Finanzierter Anteil der Kaufnebenkosten',
        nominalAnnualRate: 'Sollzinssatz p.a.',
        initialRepaymentRate: 'Anfängliche Tilgung p.a.',
        fixedInterestPeriod: 'Zinsbindung',
        fixedPeriod: {
          5: '5 Jahre',
          10: '10 Jahre',
          15: '15 Jahre',
          20: '20 Jahre',
          30: '30 Jahre',
        },
        additionalRepayment: {
          legend: 'Jährliche Sondertilgung',
          intro:
            'Lege einen festen Betrag fest, der einmal pro Darlehensjahr im ausgewählten Monat gezahlt wird.',
          annualAmount: 'Betrag pro Darlehensjahr',
          annualMonth: 'Monat im Darlehensjahr',
          amountPlaceholder: '5.000',
          selectMonth: 'Monat auswählen',
          monthOption: 'Monat {{month}}',
          negativeAmountError: 'Die jährliche Sondertilgung darf nicht negativ sein.',
          invalidAmountError:
            'Gib einen gültigen Eurobetrag mit höchstens zwei Dezimalstellen ein.',
          invalidMonthError: 'Wähle für einen positiven Betrag einen Monat von 1 bis 12.',
          guidance:
            'Die vertragliche Monatsrate bleibt unverändert. Prüfe zulässige Beträge, Gebühren und erforderliche Zustimmungen mit deinem Darlehensgeber.',
          oneTimeTitle: 'Einmalige Sondertilgungen',
          oneTimeIntro:
            'Füge feste Beträge für einzelne Darlehensmonate hinzu. Darlehensmonat 1 ist der erste monatliche Zahlungszeitraum.',
          addOneTime: 'Einmalzahlung hinzufügen',
          emptyOneTime: 'Noch keine einmalige Sondertilgung erfasst.',
          oneTimeRow: 'Einmalzahlung {{number}}',
          oneTimeAmount: 'Betrag',
          oneTimeAmountLabel: 'Betrag für Einmalzahlung {{number}}',
          oneTimeMonth: 'Darlehensmonat',
          oneTimeMonthLabel: 'Darlehensmonat für Einmalzahlung {{number}}',
          oneTimeMonthPlaceholder: 'z. B. 18',
          removeOneTime: 'Entfernen',
          removeOneTimeLabel: 'Einmalzahlung {{number}} entfernen',
          missingOneTimeAmountError: 'Gib für diese Einmalzahlung einen Betrag ein.',
          negativeOneTimeAmountError: 'Eine einmalige Sondertilgung darf nicht negativ sein.',
          missingOneTimeMonthError: 'Gib für diese Einmalzahlung einen Darlehensmonat ein.',
          invalidOneTimeMonthError: 'Der Darlehensmonat muss eine ganze Zahl von 1 bis 1.200 sein.',
          duplicateOneTimeMonthError:
            'Für diesen Darlehensmonat gibt es bereits eine einmalige Sondertilgung.',
          oneTimeGuidance:
            'Einmalige und jährliche Sondertilgungen dürfen im selben Monat liegen. Darlehensmonate müssen zwischen 1 und 1.200 liegen.',
          cashPurchaseDisabled:
            'Bei einem Kauf ohne Darlehen ist keine Sondertilgung möglich. Deine Eingaben bleiben für einen späteren Wechsel zur Finanzierung erhalten.',
        },
        results: {
          requiredEquity: 'Benötigtes Eigenkapital',
          cashForCostsAndDownPayment: 'Anzahlung, bar finanzierte Kaufnebenkosten und Budgets',
          loanAmount: 'Anfänglicher Darlehensbetrag',
          financingRatio: 'Finanzierung des Kaufpreises: {{value}}',
          totalProjectCost: 'Gesamtkosten',
          includesAllCosts: 'Kaufpreis, Kaufnebenkosten und bestätigte Budgets',
          monthlyPayment: 'Monatliche Darlehensrate',
          initialRepaymentPayment: 'Annuität aus Sollzins und anfänglicher Tilgung',
          firstMonthInterest: 'Zinsen im ersten Monat',
          firstMonthPrincipal: 'Tilgung im ersten Monat',
          remainingDebt: 'Restschuld',
          afterFixedPeriod: 'Nach {{years}} Jahren Zinsbindung',
          payoffProjection: 'Rechnerische Volltilgung',
          months: 'Monate ab Darlehensbeginn · keine garantierte Vertragslaufzeit',
          firstYearInterest: 'Zinsen im ersten Jahr',
          breakdown: {
            open: 'Detaillierten Tilgungsplan öffnen',
            intro:
              'Die Monatswerte stammen direkt aus dem Rechenmodell. Bei Sondertilgungen werden Basis- und Vergleichsverlauf getrennt gezeigt.',
            baseline: 'Tilgungsplan ohne Sondertilgung',
            withAdditionalRepayments: 'Tilgungsplan mit Sondertilgung',
            fixedPeriodOnly: 'Gezeigt werden {{months}} Monate innerhalb der Zinsbindung.',
            projectionBoundary:
              'Die rechnerische Volltilgung nach der Zinsbindung ist nur eine Projektion bei unverändertem Sollzins und keine garantierte Vertragslaufzeit.',
            scrollLabel: '{{title}} horizontal scrollen',
            month: 'Darlehensmonat',
            regularPayment: 'Reguläre Rate',
            interest: 'Zinsen',
            scheduledPrincipal: 'Reguläre Tilgung',
            additionalPrincipal: 'Sondertilgung',
            totalPayment: 'Gesamtzahlung',
            closingBalance: 'Restschuld',
          },
        },
        funding: {
          fundedTitle: 'Finanzierung gedeckt',
          fundedMessage: 'Nach dem Eigenkapitaleinsatz verbleiben {{value}}.',
          underfundedTitle: 'Eigenkapitallücke',
          underfundedMessage: 'Für diese Aufteilung fehlen {{value}} an Eigenkapital.',
        },
        cashPurchase: {
          title: 'Kauf ohne Darlehen',
          message:
            'Das gewählte Eigenkapital deckt das gesamte Projekt. Es fällt keine monatliche Darlehensrate an.',
        },
        unavailable: {
          purchaseCostsTitle: 'Kaufkosten zuerst vervollständigen',
          purchaseCostsMessage:
            'Bestätige Renovierungs- und Umzugskosten auf der Kaufkostenseite, bevor die Finanzierung berechnet werden kann.',
          paymentTitle: 'Darlehensrate nicht verfügbar',
          paymentMessage:
            'Prüfe Sollzinssatz und anfängliche Tilgung. Die gewählte Kombination muss das Darlehen amortisieren.',
          scheduleTitle: 'Tilgungsplan nicht verfügbar',
          scheduleMessage:
            'Mit diesen Eingaben kann kein vollständiger Tilgungsplan innerhalb des unterstützten Projektionszeitraums erstellt werden.',
        },
        backToPurchaseCosts: 'Kaufkosten bearbeiten',
        nextSteps: {
          title: 'Nächster Schritt',
          message:
            'Bewerte die Finanzierung, Anschlussfinanzierung und Nutzungsannahmen in einer Auswertung.',
          continueToResults: 'Zur Auswertung →',
        },
      },
      results: {
        page: {
          eyebrow: 'Immobilienauswertung',
          title: 'Eine Immobilie bewerten',
          summary:
            'Nutze deine Kaufkosten und Finanzierung als Grundlage für transparente Planungsannahmen und prüfe die wichtigsten Entscheidungen.',
        },
        units: { years: 'Jahre', yearNumber: 'Jahr {{value}}' },
        keyDecisions: {
          eyebrow: 'Dein Szenario',
          title: 'Wichtige Entscheidungen auf einen Blick',
          totalProjectCost: 'Gesamtkosten',
          totalProjectCostDetail: 'Kaufpreis, Nebenkosten und bestätigte Budgets',
          loan: 'Darlehensbetrag',
          loanDetail: 'Finanzierung zu Beginn',
          monthlyPayment: 'Monatliche Darlehensrate',
          paymentDetail: 'Regelmäßige Rate zu Beginn',
          cashPurchaseDetail: 'Kein Darlehen erforderlich',
          debt: 'Restschuld',
          debtDetail: 'Nach {{years}} Jahren Zinsbindung',
          debtAfterAdditionalRepaymentsDetail:
            'Nach Sondertilgung und {{years}} Jahren Zinsbindung',
        },
        assumptions: {
          title: 'Planungsannahmen',
          summary:
            'Alle Felder sind ausdrücklich editierbare Planungsannahmen. Sie werden nur im Arbeitsspeicher dieses Browsers gespeichert.',
          propertyUse: 'Wie soll die Immobilie genutzt werden?',
        },
        mode: {
          owner: 'Eigennutzung',
          ownerDescription: 'Miete und Kauf über denselben monatlichen Budgetrahmen vergleichen.',
          rental: 'Kapitalanlage',
          rentalDescription: 'Mietertrag, Cashflow, Verkauf und Angebotspreis bewerten.',
        },
        reasons: {
          purchaseCosts: 'Kaufkosten sind noch nicht vollständig.',
          financing: 'Finanzierung oder Darlehensrate ist noch nicht verfügbar.',
        },
        backToPurchaseCosts: 'Kaufkosten vervollständigen',
        editFinancing: 'Finanzierung bearbeiten',
        setupRequired: {
          title: 'Annahmen vervollständigen',
          message:
            'Ergänze {{count}} fehlende Planungsannahme(n), um dieses Ergebnis zu berechnen.',
        },
        unavailable: {
          title: 'Ergebnis nicht verfügbar',
          message:
            'Die Berechnung kann mit den aktuellen Eingaben nicht ausgeführt werden ({{reason}}).',
        },
        sondertilgung: {
          eyebrow: 'Tilgungswirkung',
          title: 'Sondertilgung im Vergleich',
          edit: 'Sondertilgung bearbeiten',
          summary:
            'Verglichen werden zwei identische Darlehensverläufe – einmal ohne und einmal mit deinen Sondertilgungen.',
          monthlyPayment: 'Vertragliche Monatsrate',
          monthlyPaymentDetail: 'In beiden Verläufen unverändert',
          additionalPrincipal: 'Zusätzliche Tilgung',
          fixedPeriodInterestSaved: 'Gesparte Zinsen',
          remainingDebtReduction: 'Niedrigere Restschuld',
          fixedPeriodDetail: 'Innerhalb von {{years}} Jahren Zinsbindung',
          remainingDebtDetail: 'Am Ende von {{years}} Jahren Zinsbindung',
          lifetimeInterestSaved: 'Projizierte Zinsersparnis gesamt',
          timeSaved: 'Projizierte Zeitersparnis',
          constantRateProjection:
            'Projektion bei konstantem Sollzins nach Ende der Zinsbindung – kein Vertragsangebot.',
          timeSavedValue: '{{years}} {{yearUnit}} · {{months}} {{monthUnit}}',
          duration: {
            year: 'Jahr',
            years: 'Jahre',
            month: 'Monat',
            months: 'Monate',
          },
          notApplicableTitle: 'Keine Sondertilgung anwendbar',
          notApplicableMessage:
            'Bei einem Barkauf gibt es kein Darlehen und damit keinen Tilgungsvergleich.',
          unavailableReason: 'Die Eingaben zur Sondertilgung sind unvollständig oder ungültig.',
          dependentProjectionUnavailable:
            'Der Tilgungsverlauf mit Sondertilgung ist unvollständig oder ungültig. Die abhängige Projektion wurde nicht berechnet.',
        },
        refinancing: {
          title: 'Anschlussfinanzierung unter Stress',
          assumptionsTitle: 'Zinsstress nach Zinsbindung',
          assumptionsDetail:
            'Diese Zukunftszinsen sind von dir gewählte Stressannahmen – keine Prognosen, Angebote, Zusagen oder Garantien. Anschlusskosten sind nicht enthalten.',
          initialRepaymentRate: 'Anfängliche Tilgung nach Zinsbindung',
          lowerRate: 'Niedriger Sollzins',
          baseRate: 'Basis-Sollzins',
          higherRate: 'Hoher Sollzins',
          disclaimer:
            'Vergleich mit derselben anfänglichen Tilgung. Die Rate basiert auf der Restschuld nach der letzten Zahlung der Zinsbindung.',
          principalBaseline: 'Refinanzierungsbasis: Restschuld {{value}} ohne Sondertilgung.',
          principalAfterAdditionalRepayments:
            'Refinanzierungsbasis: Restschuld {{value}} nach Sondertilgung.',
          additionalRepaymentUnavailable:
            'Der Tilgungsverlauf mit Sondertilgung ist nicht verfügbar.',
          paymentChange: 'Änderung gegenüber heute: {{value}} pro Monat',
          notApplicableTitle: 'Keine Anschlussfinanzierung erforderlich',
          notApplicableMessage:
            'Das Szenario ist ein Barkauf oder bis zum Ende der Zinsbindung zurückgezahlt.',
          scenario: {
            lower: 'Niedriges Szenario · {{rate}}',
            base: 'Basis-Szenario · {{rate}}',
            higher: 'Hohes Szenario · {{rate}}',
          },
        },
        projection: {
          constantInitialRate:
            'Projektion: Nach Ende der Zinsbindung wird die ursprüngliche Rate nur zur Orientierung fortgeschrieben; die Anschlussfinanzierung ist nicht enthalten.',
        },
        owner: {
          title: 'Mieten oder kaufen',
          assumptionsTitle: 'Annahmen für Eigennutzung',
          currentRent: 'Vergleichbare monatliche Kaltmiete',
          monthlyOwnerCosts: 'Monatliche Eigentümerkosten',
          analysisYears: 'Analysezeitraum',
          rentGrowth: 'Mietsteigerung p.a.',
          ownerCostGrowth: 'Kostensteigerung p.a.',
          propertyAppreciation: 'Wertentwicklung der Immobilie p.a.',
          alternativeReturn: 'Rendite der Alternativanlage p.a.',
          sellingCosts: 'Hypothetische Verkaufskosten',
          buyerWealth: 'Nettovermögen Käufer',
          renterWealth: 'Nettovermögen Mieter',
          wealthDifference: 'Käufer minus Mieter',
          breakEven: 'Erster Break-even',
          breakEvenDetail: 'Innerhalb des gewählten Zeitraums',
          notReached: 'Nicht erreicht',
          matchedBudgetDetail:
            'Verglichen wird ein gleicher monatlicher Budgetrahmen. Tilgung bleibt Vermögensaufbau und ist keine Ausgabe.',
          matchedBudgetAdditionalRepayments:
            'Verglichen wird ein gleicher monatlicher Budgetrahmen einschließlich aller Sondertilgungen. Tilgung bleibt Vermögensaufbau und ist keine Ausgabe.',
        },
        rental: {
          title: 'Kapitalanlage',
          assumptionsTitle: 'Annahmen für Vermietung',
          monthlyNetColdRent: 'Monatliche Nettokaltmiete',
          vacancyRate: 'Leerstandsquote',
          otherAnnualRentLoss: 'Sonstige Mietausfälle pro Jahr',
          nonRecoverableHausgeld: 'Nicht umlagefähiges Hausgeld pro Monat',
          reserve: 'Rücklage pro Monat',
          maintenance: 'Instandhaltung außerhalb Hausgeld pro Jahr',
          otherOwnerCosts: 'Weitere Eigentümerkosten pro Jahr',
          holdingYears: 'Haltedauer',
          rentGrowth: 'Mietsteigerung p.a.',
          ownerCostGrowth: 'Kostensteigerung p.a.',
          saleAppreciation: 'Wertentwicklung für Verkauf p.a. (optional)',
          saleCosts: 'Verkaufskosten (optional)',
          grossYield: 'Bruttomietrendite',
          grossYieldBasis: 'Jahresnettokaltmiete {{numerator}} ÷ Kaufpreis {{denominator}}',
          netYield: 'Nettomietrendite',
          netYieldBasis: 'Betriebsergebnis {{numerator}} ÷ Gesamtprojektkosten {{denominator}}',
          monthlyCashFlow: 'Monatlicher Cashflow vor Steuer',
          beforeExtra: 'Vor Sondertilgung',
          afterExtra: 'Nach Sondertilgung',
          additionalRepaymentsIncluded:
            'Cashflow, Restschuld, Schuldenabbau und Verkaufsergebnis berücksichtigen alle eingegebenen Sondertilgungen.',
          debtReduction: 'Schuldenabbau über Haltedauer',
          cashOnCash: 'Cash-on-Cash-Rendite',
          notAvailable: 'Nicht verfügbar',
          saleTitle: 'Hypothetischer Verkauf',
          saleDetail: 'Nettoerlös nach Verkaufskosten und Restschuld: {{proceeds}}',
        },
        offer: {
          title: 'Angebotspreis und Vergleichswerte',
          assumptionsTitle: 'Optionale Angebotsannahmen',
          assumptionsDetail:
            'Diese Angaben aktivieren nur die passenden Preisgrenzen. Ein Eröffnungsangebot wird ausschließlich aus deinen eingegebenen Abschlägen berechnet.',
          maximumMonthlyPayment: 'Maximale monatliche Darlehensrate',
          targetGrossYield: 'Ziel-Bruttorendite',
          targetNetYield: 'Ziel-Nettorendite',
          livingArea: 'Wohnfläche',
          askingPrice: 'Angebotspreis',
          proposedOffer: 'Dein Kaufangebot',
          comparableLow: 'Vergleichswert niedrig',
          comparableHigh: 'Vergleichswert hoch',
          largerDiscount: 'Größerer Abschlag für Eröffnungsangebot',
          smallerDiscount: 'Kleinerer Abschlag für Eröffnungsangebot',
          grossYieldCeiling: 'Preisobergrenze bei Bruttorendite',
          netYieldCeiling: 'Preisobergrenze bei Nettorendite',
          affordabilityCeiling: 'Preisobergrenze nach Budget',
          comparableRange: 'Vergleichbarer Wert',
          comparableRangeDetail: 'bis {{high}}',
          openingOfferRange: 'Eröffnungsangebot',
          openingOfferRangeDetail: 'bis {{high}}',
          offerDifference: 'Abweichung deines Angebots',
          notConfiguredTitle: 'Angebotsmethode auswählen',
          notConfiguredMessage:
            'Öffne die optionalen Angebotsannahmen und gib eine Zielrendite, ein maximales Monatsbudget oder vollständige Vergleichswerte ein.',
          missingTitle: 'Angebotsannahmen vervollständigen',
          missingMessage: 'Für die gewählte Angebotsmethode fehlen noch:',
        },
      },
    },
  },
  en: {
    translation: {
      language: { selectorLabel: 'Choose language', german: 'Deutsch', english: 'English' },
      brand: { homeLabel: 'ImmoPilot DE home', release: 'Version 1 · Release review' },
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
          results: 'Analysis',
          scenarios: 'Saved scenarios',
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
        ownerAction: 'Calculate for my own home',
        rentalAction: 'Evaluate a rental investment',
        documentation: 'Documentation',
      },
      preview: {
        label: 'Example calculation',
        title: 'Example scenario',
        status: 'Calculated',
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
      additionalRepaymentGuidance: {
        title: 'How ImmoPilot calculates additional repayments',
        intro:
          'These rules apply consistently to the amortization schedule, refinancing, owner-occupier analysis, rental analysis, and property comparison.',
        items: {
          timing: {
            term: 'Timing in the payment month',
            description:
              'Monthly interest and the regular payment are calculated first. The additional repayment is then deducted from the remaining balance at month-end.',
          },
          annual: {
            term: 'Annual amount',
            description:
              'The selected month repeats in every loan year. It identifies a loan month, not a calendar month.',
          },
          overlap: {
            term: 'Multiple payments',
            description:
              'Annual and one-time payments in the same month are combined and capped at the remaining balance. Payments after full repayment have no effect.',
          },
          payment: {
            term: 'Contractual monthly payment',
            description:
              'The regular monthly payment stays unchanged, so the loan is repaid earlier. A later payment reduction is not modelled.',
          },
          results: {
            term: 'Treatment in results',
            description:
              'Remaining debt, refinancing, and projections use the schedule with additional repayments. Lifetime values after the fixed period are clearly labelled constant-rate projections. Cash-on-cash return remains before discretionary additional repayments.',
          },
          contract: {
            term: 'Loan agreement',
            description:
              'ImmoPilot does not verify contractual rights, maximum amounts, fees, deadlines, or required lender approvals.',
          },
        },
        note: 'Planning note: check every additional repayment against your loan agreement. The calculation is neither a financing offer nor a recommendation.',
      },
      scenarios: {
        page: {
          eyebrow: 'Manage scenarios',
          title: 'Saved scenarios',
          summary:
            'Save your inputs locally, transfer them as JSON, or share them with a link. Results are always recalculated when loaded.',
        },
        current: {
          title: 'Current workspace',
          description: 'Only user inputs are saved—never calculated results.',
        },
        saved: {
          title: 'Locally saved scenarios',
          description: 'These scenarios remain in this browser only.',
          empty: 'No scenarios saved yet.',
          updated: 'Updated: {{date}}',
          deleteWarning: 'Permanently delete “{{name}}”?',
          clearAllWarning:
            'Permanently delete every locally saved scenario? This action cannot be undone.',
        },
        shared: {
          title: 'Shared scenario',
          valid: '“{{name}}” was safely read from the link. Choose whether to load or save it.',
        },
        share: {
          title: 'Share link',
          description: 'The link contains the versioned inputs. No data is sent to a server.',
          fieldLabel: 'Scenario share link',
        },
        privacy: {
          shareTitle: 'Share financial data in a link?',
          shareWarning:
            'Anyone with the full link can read the included financial data. The link may remain in browser history, clipboards, messages, screenshots, or synchronization services. The scenario name is excluded.',
          exportTitle: 'Export sensitive financial data?',
          exportWarning:
            'The JSON file can reveal purchase plans and financial circumstances. Review its contents before sharing and store it appropriately.',
        },
        fields: { name: 'Scenario name' },
        actions: {
          save: 'Save scenario',
          saveShared: 'Save locally',
          shareCurrent: 'Share current workspace',
          reset: 'Reset workspace',
          load: 'Load',
          rename: 'Rename',
          duplicate: 'Duplicate',
          delete: 'Delete',
          export: 'Export JSON',
          import: 'Import JSON',
          share: 'Share',
          compare: 'Compare',
          copyLink: 'Copy link',
          confirmShare: 'I understand, create link',
          confirmExport: 'I understand, export JSON',
          cancel: 'Cancel',
          removeSharedData: 'Remove shared data from URL',
          clearAll: 'Clear all local data',
          confirmClearAll: 'Permanently clear all',
          confirmDelete: 'Permanently delete',
          results: 'Open analysis →',
        },
        status: {
          saved: 'Scenario saved.',
          renamed: 'Scenario renamed.',
          duplicated: 'Scenario duplicated.',
          deleted: 'Scenario deleted.',
          cleared: 'All locally saved scenarios were deleted.',
          loaded: 'Scenario loaded. All results are recalculated.',
          reset: 'The current workspace was reset.',
          imported: 'Scenario imported and saved locally.',
          exported: 'Scenario exported as JSON.',
          linkReady: 'Share link created.',
          nameRequired: 'Enter a scenario name.',
          dataInvalid: 'The current inputs cannot be saved as a scenario.',
          urlCleared: 'The shared data was removed from the URL.',
          writeFailed: 'The scenario could not be saved locally.',
        },
        issues: {
          corrupted: {
            title: 'Invalid scenario data',
            message:
              'The data is corrupted or incomplete and was not loaded. Your current inputs remain unchanged.',
          },
          'unsupported-version': {
            title: 'Unsupported scenario version',
            message: 'This scenario uses an unsupported version and was not loaded.',
          },
          'storage-unavailable': {
            title: 'Local storage unavailable',
            message:
              'The browser blocked local storage. You can keep calculating and use share links.',
          },
        },
        copyName: '{{name}} (copy)',
      },
      comparison: {
        page: {
          eyebrow: 'Compare scenarios',
          title: 'Compare properties side by side',
          summary:
            'Compare up to three saved scenarios. Every value is recalculated from the saved inputs using the current calculation engine.',
        },
        empty: {
          title: 'No scenarios to compare yet',
          message: 'Save at least one scenario in this browser first.',
        },
        noSelection: {
          title: 'Add a scenario',
          message: 'Choose a saved scenario above to start comparing.',
        },
        picker: {
          title: 'Build your comparison',
          description: 'Add or remove properties and put them in the order you need.',
          label: 'Saved scenario',
          count: '{{count}} of {{max}} scenarios selected',
        },
        table: {
          title: 'Comparison metrics',
          description:
            'Missing inputs and values with different calculation bases are clearly marked.',
          metric: 'Metric',
          mobileHint: 'Swipe horizontally on small screens to see every property.',
        },
        mode: {
          'owner-occupier': 'Owner occupation',
          'rental-investment': 'Rental investment',
        },
        repayment: {
          additionalRepayments: 'With additional repayments',
          invalid: 'Invalid additional repayments',
        },
        groups: {
          purchase: 'Purchase',
          financing: 'Financing',
          performance: 'Return and cash flow',
          offer: 'Offer price',
        },
        metrics: {
          purchasePrice: 'Purchase price',
          acquisitionCosts: 'Acquisition costs',
          equity: 'Required equity',
          loan: 'Loan',
          monthlyPayment: 'Monthly payment',
          remainingDebt: 'Remaining debt',
          grossYield: 'Gross rental yield',
          netYield: 'Net rental yield',
          monthlyCashFlow: 'Monthly pre-tax cash flow',
          projectedReturn: 'Projected result',
          grossYieldCeiling: 'Gross-yield price ceiling',
          netYieldCeiling: 'Net-yield price ceiling',
          affordabilityCeiling: 'Affordability price ceiling',
          comparableValue: 'Comparable value',
          openingOffer: 'Opening offer',
        },
        status: {
          missingCount: '{{count}} input(s) missing',
          notConfigured: 'Not configured',
          notApplicable: 'Not applicable to this model',
          unavailable: 'Cannot be calculated',
        },
        value: {
          range: '{{low}} to {{high}}',
          yieldBasis: '{{numerator}} ÷ {{denominator}}',
          afterYears: 'after {{years}}-year fixed period',
          afterYearsWithAdditionalRepayments:
            'after additional repayments and a {{years}}-year fixed period',
          ownerReturn: 'advantage over renting after {{years}} years',
          rentalReturn: 'pre-tax profit after {{years}} years',
          additionalRepaymentsIncluded:
            'Additional repayments are included in their respective payment months.',
        },
        nonComparable: {
          remainingDebt: 'Different fixed-interest periods',
          projectedReturn: 'Different models or time horizons',
        },
        actions: {
          add: 'Add',
          remove: 'Remove',
          moveLeft: 'Move {{name}} left',
          moveRight: 'Move {{name}} right',
          openScenarios: 'Save scenarios',
          manageScenarios: 'Manage saved scenarios →',
        },
      },
      foundation: {
        eyebrow: 'Implemented workflows',
        title: 'From acquisition costs to property comparison.',
        summary:
          'Calculate acquisition costs and financing, plan additional repayments, assess owner occupation or rental investment, and compare up to three saved scenarios. Version 1 is in final release review.',
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
        privacyNotice: 'Privacy & notices',
        copyright: '© 2026 ImmoPilot DE',
      },
      provenance: {
        title: 'Calculation basis and limitations',
        scopeName: {
          purchase: 'Purchase costs',
          financing: 'Financing',
          repayment: 'Repayment and additional repayments',
          refinancing: 'Refinancing',
          owner: 'Owner occupation',
          rental: 'Rental investment',
          offer: 'Offer price',
          comparison: 'Scenario comparison',
        },
        fullNotice: 'Privacy & full notices',
        assumptionSet: 'Assumption set',
        verifiedOn: 'Defaults verified on',
        calculationSpecification: 'Calculation specification',
        limitation:
          'Results are non-binding planning estimates, not advice, a valuation, guarantee, financing approval or mortgage offer.',
        scope: {
          purchase:
            'Property transfer tax and defaults come from the assumption set. Values you edit are your own inputs.',
          financing:
            'Acquisition costs use the assumption set; equity, interest, repayment and fixed period are your inputs and are not externally verified.',
          repayment:
            'Schedules follow the calculation specification. Additional repayments and loan terms are your inputs and are not checked against a contract.',
          refinancing:
            'Future rates are user-selected stress assumptions, not market forecasts or offers. Fees and credit assessment are excluded.',
          owner:
            'Rent, cost growth, property appreciation and alternative return are your scenario assumptions, not source-backed forecasts.',
          rental:
            'Rent, vacancy, costs, appreciation and sale values are your pre-tax assumptions; tax and legal effects are not modelled.',
          offer:
            'Price limits use your targets, budgets and comparable values. They are neither a valuation nor a purchase or financing offer.',
          comparison:
            'Every scenario is recalculated with the same specification. User inputs and different time horizons remain explicit comparison bases.',
        },
      },
      privacy: {
        page: {
          eyebrow: 'Transparency',
          title: 'Privacy and financial notices',
          summary:
            'How ImmoPilot DE processes your inputs, what is saved or shared, and where the calculations have limits.',
        },
        status: {
          title: 'Notice status',
          version: 'Version {{version}}',
          verified: 'Technically verified on {{date}}',
        },
        warning: {
          title: 'Not a substitute for professional advice',
          body: 'ImmoPilot DE is an educational planning tool. Results are not financial, mortgage, investment, tax, accounting or legal advice, a valuation, mortgage offer, contract or guarantee. Check material figures with qualified professionals.',
        },
        sections: {
          purpose: {
            title: 'Information processed',
            body: 'The calculator processes property and financial planning values such as purchase price, federal state, equity, interest, repayment, rent and costs. Names, exact private addresses, bank details, tax IDs and documents are not required and should not be entered.',
          },
          local: {
            title: 'Local calculation',
            body: 'Calculations run in your browser. Unsaved inputs remain in the current workspace. The application has no user accounts or application backend and does not send scenario values to the operator for calculation, analytics, advertising or error reporting.',
          },
          saved: {
            title: 'Saving and deletion',
            body: 'Versioned input JSON is written to this browser’s localStorage only after you select “Save scenario”. You can delete individual scenarios or all local data. Other people with access to the same browser profile may be able to see saved data.',
          },
          sharing: {
            title: 'Share links and JSON files',
            body: 'Share links place inputs only in the URL fragment and exclude the scenario name. Anyone with the full link can read the included financial data. Export and import stay local. Review links and files before sharing and delete copies you no longer need.',
          },
          hosting: {
            title: 'GitHub Pages hosting',
            body: 'GitHub Pages serves the static files. GitHub states that visitor IP addresses are logged and stored for security. Its general privacy statement describes other possible usage and connection data. This hosting processing is separate from your local scenario data.',
          },
          limits: {
            title: 'Sources and calculation limits',
            body: 'Source-backed defaults show a version and verification date but are not live data. Interest rates, rents, growth, property values, costs and target returns are editable user inputs. Actual taxes, fees, contracts, risks and outcomes may differ.',
          },
          controls: {
            title: 'Your controls',
            body: 'Reset the workspace, delete saved scenarios, remove shared data from the URL, or clear the site data in your browser. The operator cannot inspect, restore or remotely delete local scenarios.',
          },
        },
        sources: {
          title: 'Sources and detailed document',
          body: 'The hosting statements were checked against official GitHub documentation. The detailed bilingual document records further legal limitations and the review note required for release approval.',
          githubPages: 'GitHub Pages: data collection',
          githubPrivacy: 'GitHub General Privacy Statement',
          fullDocument: 'Full financial and privacy notice in the repository',
        },
      },
      metadata: {
        pages: {
          home: {
            title: 'ImmoPilot DE · Plan property decisions transparently',
            description:
              'Plan acquisition costs, financing and long-term property scenarios for Germany transparently in your browser.',
          },
          purchaseCosts: {
            title: 'Calculate acquisition costs · ImmoPilot DE',
            description:
              'Calculate property transfer tax, notary, land-register, broker and other purchase budgets with transparent assumptions.',
          },
          financing: {
            title: 'Plan property financing · ImmoPilot DE',
            description:
              'Plan equity, mortgage amount, monthly payment, fixed interest, remaining debt and additional repayments.',
          },
          results: {
            title: 'Evaluate a property · ImmoPilot DE',
            description:
              'Review financing, refinancing, owner occupation, rental investment and offer-price scenarios transparently.',
          },
          scenarios: {
            title: 'Save and share scenarios · ImmoPilot DE',
            description:
              'Save property scenarios locally, import or export JSON, and create share links without an application backend.',
          },
          comparison: {
            title: 'Compare properties · ImmoPilot DE',
            description: 'Compare up to three saved property scenarios side by side.',
          },
          privacy: {
            title: 'Privacy and notices · ImmoPilot DE',
            description:
              'Learn about local processing, storage, share links, GitHub Pages hosting and calculation limitations.',
          },
        },
      },
      property: { purchasePrice: 'Purchase price' },
      purchase: {
        additionalCosts: 'Acquisition costs',
        page: {
          eyebrow: 'Acquisition costs',
          summary:
            'Calculate property transfer tax, notary, land-register and broker costs for your federal state with transparent, editable assumptions.',
        },
        section: {
          quickInputs: 'Quick inputs',
          postPurchaseBudgets: 'Post-purchase budget',
          advancedInputs: 'Advanced inputs',
          results: 'Results',
          nextSteps: 'Next steps',
        },
        stateLabel: 'Federal state',
        states: {
          'DE-BW': 'Baden-Württemberg',
          'DE-BY': 'Bavaria',
          'DE-BE': 'Berlin',
          'DE-BB': 'Brandenburg',
          'DE-HB': 'Bremen',
          'DE-HH': 'Hamburg',
          'DE-HE': 'Hesse',
          'DE-MV': 'Mecklenburg-Western Pomerania',
          'DE-NI': 'Lower Saxony',
          'DE-NW': 'North Rhine-Westphalia',
          'DE-RP': 'Rhineland-Palatinate',
          'DE-SL': 'Saarland',
          'DE-SN': 'Saxony',
          'DE-ST': 'Saxony-Anhalt',
          'DE-SH': 'Schleswig-Holstein',
          'DE-TH': 'Thuringia',
        },
        brokerToggle: 'Broker involved',
        buyerBrokerRateLabel: 'Buyer broker commission',
        financedAcquisitionCostShare: 'Financed acquisition-cost share',
        rateLabel: 'Rate',
        rateIntro:
          'These rates are transparent planning assumptions. Override them only when you have a more suitable figure.',
        budgetPlaceholder: 'Amount in €',
        budgetIntro:
          'Enter an amount or explicitly confirm €0. Acquisition costs are calculated immediately; total project cost becomes available after both budgets are confirmed.',
        budgetStatus: {
          label: 'Status for {{budget}}',
          notBudgeted: 'Not yet budgeted',
          confirmedZero: 'Confirmed: €0',
          budgeted: 'Budgeted',
          notBudgetedBadge: 'Input required',
          confirmedZeroBadge: 'Confirmed',
          budgetedBadge: 'Budgeted',
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
          enterPurchasePrice: 'Enter a purchase price to calculate acquisition costs.',
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
          financingSoon:
            'Acquisition costs are calculated. The financing calculator will be added as the next step.',
        },
      },
      finance: {
        equity: 'Equity',
        monthlyPayment: 'Monthly mortgage payment',
        page: {
          eyebrow: 'Financing',
          summary:
            'Plan equity, loan amount and monthly mortgage payment from your calculated acquisition costs.',
        },
        section: {
          inputs: 'Enter financing',
          results: 'Financing overview',
        },
        inputIntro:
          'These inputs remain only in memory for the current browser session. Every result is recalculated through the existing calculation modules.',
        allocationLegend: 'How should your equity be allocated?',
        mode: {
          downPayment: 'Set a down payment',
          downPaymentDescription:
            'Set the purchase-price down payment yourself; acquisition costs are considered separately.',
          availableEquity: 'Use available equity',
          availableEquityDescription:
            'Allocate available equity automatically to acquisition costs first and then to the purchase price.',
        },
        availableEquity: 'Available equity',
        downPayment: 'Purchase-price down payment',
        availableEquityHint:
          'The down payment is derived from available equity after acquisition costs.',
        financedAcquisitionCostShare: 'Financed acquisition-cost share',
        nominalAnnualRate: 'Nominal annual interest rate',
        initialRepaymentRate: 'Initial repayment rate',
        fixedInterestPeriod: 'Fixed-interest period',
        fixedPeriod: {
          5: '5 years',
          10: '10 years',
          15: '15 years',
          20: '20 years',
          30: '30 years',
        },
        additionalRepayment: {
          legend: 'Annual additional repayment',
          intro:
            'Set a fixed amount paid once in every loan year during the selected loan-year month.',
          annualAmount: 'Amount per loan year',
          annualMonth: 'Month in the loan year',
          amountPlaceholder: '5,000',
          selectMonth: 'Select a month',
          monthOption: 'Month {{month}}',
          negativeAmountError: 'The annual additional repayment cannot be negative.',
          invalidAmountError: 'Enter a valid euro amount with no more than two decimal places.',
          invalidMonthError: 'Select a month from 1 through 12 for a positive amount.',
          guidance:
            'The contractual monthly payment remains unchanged. Confirm permitted amounts, fees and required approval with your lender.',
          oneTimeTitle: 'One-time additional repayments',
          oneTimeIntro:
            'Add fixed amounts for individual loan months. Loan month 1 is the first monthly payment period.',
          addOneTime: 'Add one-time repayment',
          emptyOneTime: 'No one-time additional repayments have been added.',
          oneTimeRow: 'One-time repayment {{number}}',
          oneTimeAmount: 'Amount',
          oneTimeAmountLabel: 'Amount for one-time repayment {{number}}',
          oneTimeMonth: 'Loan month',
          oneTimeMonthLabel: 'Loan month for one-time repayment {{number}}',
          oneTimeMonthPlaceholder: 'e.g. 18',
          removeOneTime: 'Remove',
          removeOneTimeLabel: 'Remove one-time repayment {{number}}',
          missingOneTimeAmountError: 'Enter an amount for this one-time repayment.',
          negativeOneTimeAmountError: 'A one-time additional repayment cannot be negative.',
          missingOneTimeMonthError: 'Enter a loan month for this one-time repayment.',
          invalidOneTimeMonthError: 'The loan month must be a whole number from 1 through 1,200.',
          duplicateOneTimeMonthError:
            'A one-time additional repayment already exists for this loan month.',
          oneTimeGuidance:
            'One-time and annual additional repayments may fall in the same month. Loan months must be between 1 and 1,200.',
          cashPurchaseDisabled:
            'Additional repayment does not apply to a cash purchase. Your entries are retained if you switch back to loan financing.',
        },
        results: {
          requiredEquity: 'Required equity',
          cashForCostsAndDownPayment: 'Down payment, cash-funded acquisition costs and budgets',
          loanAmount: 'Initial loan amount',
          financingRatio: 'Purchase-price financing: {{value}}',
          totalProjectCost: 'Total project cost',
          includesAllCosts: 'Purchase price, acquisition costs and confirmed budgets',
          monthlyPayment: 'Monthly mortgage payment',
          initialRepaymentPayment: 'Annuity from nominal interest and initial repayment',
          firstMonthInterest: 'First-month interest',
          firstMonthPrincipal: 'First-month principal repayment',
          remainingDebt: 'Remaining debt',
          afterFixedPeriod: 'After {{years}} years of fixed interest',
          payoffProjection: 'Projected full repayment',
          months: 'months from loan start · not a guaranteed contractual term',
          firstYearInterest: 'First-year interest',
          breakdown: {
            open: 'Open detailed amortization schedule',
            intro:
              'Monthly values come directly from the calculation engine. When additional repayments are configured, the baseline and comparison schedules are shown separately.',
            baseline: 'Schedule without additional repayments',
            withAdditionalRepayments: 'Schedule with additional repayments',
            fixedPeriodOnly: '{{months}} months within the fixed-interest period are shown.',
            projectionBoundary:
              'Projected full repayment after the fixed-interest period assumes the original rate remains unchanged and is not a guaranteed contractual term.',
            scrollLabel: 'Scroll {{title}} horizontally',
            month: 'Loan month',
            regularPayment: 'Regular payment',
            interest: 'Interest',
            scheduledPrincipal: 'Scheduled principal',
            additionalPrincipal: 'Additional principal',
            totalPayment: 'Total payment',
            closingBalance: 'Remaining debt',
          },
        },
        funding: {
          fundedTitle: 'Funding covered',
          fundedMessage: '{{value}} remains after the equity contribution.',
          underfundedTitle: 'Equity gap',
          underfundedMessage: '{{value}} of additional equity is needed for this allocation.',
        },
        cashPurchase: {
          title: 'Cash purchase',
          message:
            'The selected equity covers the whole project. No monthly mortgage payment is due.',
        },
        unavailable: {
          purchaseCostsTitle: 'Complete purchase costs first',
          purchaseCostsMessage:
            'Confirm the renovation and moving budgets on the purchase-costs page before financing can be calculated.',
          paymentTitle: 'Mortgage payment unavailable',
          paymentMessage:
            'Check the nominal interest and initial repayment rate. Their combination must amortize the loan.',
          scheduleTitle: 'Amortization schedule unavailable',
          scheduleMessage:
            'These inputs cannot produce a complete amortization schedule within the supported projection period.',
        },
        backToPurchaseCosts: 'Edit purchase costs',
        nextSteps: {
          title: 'Next step',
          message:
            'Review the financing, refinancing stress and property-use assumptions in one analysis.',
          continueToResults: 'Open analysis →',
        },
      },
      results: {
        page: {
          eyebrow: 'Property analysis',
          title: 'Evaluate one property',
          summary:
            'Use your acquisition costs and financing as a transparent base for planning assumptions and the decisions that follow.',
        },
        units: { years: 'years', yearNumber: 'Year {{value}}' },
        keyDecisions: {
          eyebrow: 'Your scenario',
          title: 'Key decisions at a glance',
          totalProjectCost: 'Total project cost',
          totalProjectCostDetail: 'Purchase price, acquisition costs and confirmed budgets',
          loan: 'Loan amount',
          loanDetail: 'Financing at the start',
          monthlyPayment: 'Monthly mortgage payment',
          paymentDetail: 'Regular payment at the start',
          cashPurchaseDetail: 'No mortgage required',
          debt: 'Remaining debt',
          debtDetail: 'After {{years}} years of fixed interest',
          debtAfterAdditionalRepaymentsDetail:
            'After additional repayments and {{years}} years of fixed interest',
        },
        assumptions: {
          title: 'Planning assumptions',
          summary:
            'Every field is an explicitly editable planning assumption. They remain only in this browser’s in-memory workspace.',
          propertyUse: 'How will the property be used?',
        },
        mode: {
          owner: 'Owner occupation',
          ownerDescription: 'Compare renting and buying on the same monthly budget.',
          rental: 'Rental investment',
          rentalDescription: 'Assess rent, cash flow, a sale scenario and the offer price.',
        },
        reasons: {
          purchaseCosts: 'Purchase costs are not complete yet.',
          financing: 'Financing or the mortgage payment is not available yet.',
        },
        backToPurchaseCosts: 'Complete purchase costs',
        editFinancing: 'Edit financing',
        setupRequired: {
          title: 'Complete the assumptions',
          message: 'Add {{count}} missing planning assumption(s) to calculate this result.',
        },
        unavailable: {
          title: 'Result unavailable',
          message: 'The calculation cannot run with the current inputs ({{reason}}).',
        },
        sondertilgung: {
          eyebrow: 'Repayment impact',
          title: 'Additional repayment comparison',
          edit: 'Edit additional repayments',
          summary:
            'This compares two otherwise identical loan schedules: one without and one with your additional repayments.',
          monthlyPayment: 'Contractual monthly payment',
          monthlyPaymentDetail: 'Unchanged in both schedules',
          additionalPrincipal: 'Additional principal repaid',
          fixedPeriodInterestSaved: 'Interest saved',
          remainingDebtReduction: 'Lower remaining debt',
          fixedPeriodDetail: 'During the {{years}}-year fixed-interest period',
          remainingDebtDetail: 'At the end of {{years}} years of fixed interest',
          lifetimeInterestSaved: 'Projected lifetime interest saved',
          timeSaved: 'Projected time saved',
          constantRateProjection:
            'Constant-rate projection after the fixed-interest period — not a contractual offer.',
          timeSavedValue: '{{years}} {{yearUnit}} · {{months}} {{monthUnit}}',
          duration: {
            year: 'year',
            years: 'years',
            month: 'month',
            months: 'months',
          },
          notApplicableTitle: 'Additional repayment does not apply',
          notApplicableMessage:
            'A cash purchase has no mortgage and therefore no repayment comparison.',
          unavailableReason: 'The additional-repayment inputs are incomplete or invalid.',
          dependentProjectionUnavailable:
            'The amortization schedule with additional repayments is incomplete or invalid. The dependent projection was not calculated.',
        },
        refinancing: {
          title: 'Refinancing stress test',
          assumptionsTitle: 'Post-fixed-period rate stress',
          assumptionsDetail:
            'These future rates are stress assumptions that you choose – not forecasts, offers, approvals or guarantees. Refinancing fees are excluded.',
          initialRepaymentRate: 'Initial repayment after the fixed period',
          lowerRate: 'Lower nominal rate',
          baseRate: 'Base nominal rate',
          higherRate: 'Higher nominal rate',
          disclaimer:
            'All scenarios use the same initial repayment rate. Payment is based on the remaining debt after the final fixed-period payment.',
          principalBaseline:
            'Refinancing basis: remaining debt of {{value}} without additional repayments.',
          principalAfterAdditionalRepayments:
            'Refinancing basis: remaining debt of {{value}} after additional repayments.',
          additionalRepaymentUnavailable:
            'The amortization schedule with additional repayments is unavailable.',
          paymentChange: 'Change from today: {{value}} per month',
          notApplicableTitle: 'No refinancing is required',
          notApplicableMessage:
            'The scenario is a cash purchase or is repaid by the end of the fixed period.',
          scenario: {
            lower: 'Lower scenario · {{rate}}',
            base: 'Base scenario · {{rate}}',
            higher: 'Higher scenario · {{rate}}',
          },
        },
        projection: {
          constantInitialRate:
            'Projection: after the fixed-interest period, the original rate is extended only for orientation; refinancing is not included.',
        },
        owner: {
          title: 'Rent or buy',
          assumptionsTitle: 'Owner-occupier assumptions',
          currentRent: 'Comparable monthly cold rent',
          monthlyOwnerCosts: 'Monthly owner costs',
          analysisYears: 'Analysis horizon',
          rentGrowth: 'Annual rent growth',
          ownerCostGrowth: 'Annual owner-cost growth',
          propertyAppreciation: 'Annual property appreciation',
          alternativeReturn: 'Annual alternative-investment return',
          sellingCosts: 'Hypothetical selling costs',
          buyerWealth: 'Buyer net wealth',
          renterWealth: 'Renter net wealth',
          wealthDifference: 'Buyer minus renter',
          breakEven: 'First break-even',
          breakEvenDetail: 'Within the selected horizon',
          notReached: 'Not reached',
          matchedBudgetDetail:
            'Both options use an equal monthly budget. Principal repayment remains wealth creation, not an expense.',
          matchedBudgetAdditionalRepayments:
            'Both options use an equal monthly budget including every additional repayment. Principal repayment remains wealth creation, not an expense.',
        },
        rental: {
          title: 'Rental investment',
          assumptionsTitle: 'Rental assumptions',
          monthlyNetColdRent: 'Monthly net cold rent',
          vacancyRate: 'Vacancy rate',
          otherAnnualRentLoss: 'Other annual rental losses',
          nonRecoverableHausgeld: 'Monthly non-recoverable service charge',
          reserve: 'Monthly reserve contribution',
          maintenance: 'Annual maintenance outside service charge',
          otherOwnerCosts: 'Other annual owner costs',
          holdingYears: 'Holding period',
          rentGrowth: 'Annual rent growth',
          ownerCostGrowth: 'Annual owner-cost growth',
          saleAppreciation: 'Annual sale-value appreciation (optional)',
          saleCosts: 'Selling costs (optional)',
          grossYield: 'Gross rental yield',
          grossYieldBasis: 'Annual net cold rent {{numerator}} ÷ purchase price {{denominator}}',
          netYield: 'Net rental yield',
          netYieldBasis: 'Net operating income {{numerator}} ÷ total project cost {{denominator}}',
          monthlyCashFlow: 'Monthly pre-tax cash flow',
          beforeExtra: 'Before additional repayment',
          afterExtra: 'After additional repayment',
          additionalRepaymentsIncluded:
            'Cash flow, remaining debt, debt reduction, and sale results include every configured additional repayment.',
          debtReduction: 'Debt reduction over holding period',
          cashOnCash: 'Cash-on-cash return',
          notAvailable: 'Not available',
          saleTitle: 'Hypothetical sale',
          saleDetail: 'Net proceeds after selling costs and remaining debt: {{proceeds}}',
        },
        offer: {
          title: 'Offer price and comparable values',
          assumptionsTitle: 'Optional offer assumptions',
          assumptionsDetail:
            'These inputs enable only the corresponding ceilings. An opening offer is calculated solely from the discounts you enter.',
          maximumMonthlyPayment: 'Maximum monthly mortgage payment',
          targetGrossYield: 'Target gross yield',
          targetNetYield: 'Target net yield',
          livingArea: 'Living area',
          askingPrice: 'Asking price',
          proposedOffer: 'Your purchase offer',
          comparableLow: 'Lower comparable value',
          comparableHigh: 'Higher comparable value',
          largerDiscount: 'Larger opening-offer discount',
          smallerDiscount: 'Smaller opening-offer discount',
          grossYieldCeiling: 'Gross-yield price ceiling',
          netYieldCeiling: 'Net-yield price ceiling',
          affordabilityCeiling: 'Budget price ceiling',
          comparableRange: 'Comparable value',
          comparableRangeDetail: 'to {{high}}',
          openingOfferRange: 'Opening offer',
          openingOfferRangeDetail: 'to {{high}}',
          offerDifference: 'Your offer difference',
          notConfiguredTitle: 'Choose an offer method',
          notConfiguredMessage:
            'Open the optional offer assumptions and enter a target yield, a maximum monthly budget, or a complete set of comparable values.',
          missingTitle: 'Complete the offer assumptions',
          missingMessage: 'The selected offer method still requires:',
        },
      },
    },
  },
} as const

export type SupportedLanguage = keyof typeof resources

export const supportedLanguages = Object.keys(resources) as SupportedLanguage[]
