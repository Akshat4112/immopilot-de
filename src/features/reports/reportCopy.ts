import Decimal from 'decimal.js'

import { eurosToCents } from '../../domain/shared/money'
import { formatEuroFromCents, formatNumber, formatPercentage } from '../../i18n/formatters'
import type { SupportedLanguage } from '../../i18n/resources'

const german = {
  'Property comparison': 'Immobilienvergleich',
  'View comparison report': 'Vergleichsbericht ansehen',
  'Comparison summary': 'Vergleichsübersicht',
  'Saved properties are captured in the visible order. Names are omitted.':
    'Gespeicherte Immobilien werden in der sichtbaren Reihenfolge erfasst. Namen werden ausgelassen.',
  'The saved selection is missing, changed or unreadable. Reload the comparison and correct the selection before capturing again.':
    'Die gespeicherte Auswahl fehlt, wurde geändert oder ist nicht lesbar. Lade den Vergleich neu und korrigiere die Auswahl vor der erneuten Erfassung.',

  'Swipe horizontally for more table columns, or focus the table region and use the arrow keys.':
    'Wische waagerecht für weitere Tabellenspalten oder fokussiere den Tabellenbereich und nutze die Pfeiltasten.',
  'Purchase-price denominator': 'Kaufpreis als Nenner',
  'Annual net cold rent': 'Jährliche Nettokaltmiete',
  'Net operating income': 'Betriebsergebnis',
  'Cash-on-cash return before additional repayments':
    'Eigenkapital-Cashflow-Rendite vor Sondertilgungen',
  'Uncommitted changes': 'Nicht eingecheckte Änderungen',
  'Repayment basis': 'Tilgungsgrundlage',
  'Cash-on-cash return is undefined when required equity is zero.':
    'Ohne erforderliches Eigenkapital ist die Eigenkapital-Cashflow-Rendite nicht definiert.',
  'The configured price exceeds the supported price-search range.':
    'Der konfigurierte Preis überschreitet den unterstützten Suchbereich.',
  'The schedules and financing assumptions are incompatible.':
    'Die Tilgungsverläufe und Finanzierungsannahmen sind nicht miteinander vereinbar.',
  'Rental results are required for this price method.':
    'Für diese Kaufpreismethode werden Vermietungsergebnisse benötigt.',
  'Property report': 'Immobilienbericht',
  'Property 1': 'Objekt 1',
  'Report preview': 'Berichtsvorschau',
  'View property report': 'Immobilienbericht ansehen',
  'Close report': 'Bericht schließen',
  'Report language': 'Berichtssprache',
  'Include complete monthly appendix': 'Vollständigen monatlichen Anhang aufnehmen',
  Complete: 'Vollständig',
  Incomplete: 'Unvollständig',
  'Some results are missing or unavailable. Review the marked sections.':
    'Einige Ergebnisse fehlen oder sind nicht verfügbar. Prüfe die gekennzeichneten Abschnitte.',
  'Correct the required inputs before creating a report.':
    'Vervollständige oder korrigiere die erforderlichen Eingaben, bevor du einen Bericht erstellst.',
  'Captured state': 'Erfasster Stand',
  Generated: 'Erstellt',
  Currency: 'Währung',
  'Owner-occupier': 'Eigennutzung',
  'Rental investment': 'Vermietung',
  'Property and acquisition': 'Immobilie und Kaufkosten',
  Financing: 'Finanzierung',
  'Repayment and additional principal': 'Tilgung und Sondertilgung',
  Amortization: 'Tilgungsverlauf',
  'Refinancing stress': 'Anschlussfinanzierungs-Stresstest',
  'Rent versus buy': 'Mieten oder kaufen',
  'Rental performance before tax': 'Vermietungsergebnis vor Steuern',
  'Offer-price methods': 'Kaufpreis- und Angebotsmethoden',
  'Inputs and assumptions': 'Eingaben und Annahmen',
  'Methodology and sources': 'Methodik und Quellen',
  'Monthly appendix': 'Monatlicher Anhang',
  Baseline: 'Ohne Sondertilgung',
  'With additional repayments': 'Mit Sondertilgung',
  'Baseline reference only: the requested repayment plan is unavailable.':
    'Nur Ausgangsverlauf als Referenz: Der angeforderte Sondertilgungsplan ist nicht verfügbar.',
  'Cash purchase: no mortgage payments or repayment charts apply.':
    'Barkauf: Darlehenszahlungen und Tilgungsdiagramme entfallen.',
  Unavailable: 'Nicht verfügbar',
  'Not requested': 'Nicht angefordert',
  'Not applicable': 'Nicht anwendbar',
  'Not provided': 'Nicht angegeben',
  'Invalid input': 'Ungültige Eingabe',
  'Check the inputs for this section.': 'Prüfe die Eingaben für diesen Abschnitt.',
  'Required inputs are missing.': 'Erforderliche Eingaben fehlen.',
  'Confirm renovation and moving/setup budgets.':
    'Bestätige die Budgets für Renovierung und Umzug/Einrichtung.',
  'Equity does not cover the required funding.':
    'Das Eigenkapital deckt den Finanzierungsbedarf nicht.',
  'The requested repayment schedule is unavailable.':
    'Der angeforderte Tilgungsverlauf ist nicht verfügbar.',
  'The loan is already repaid.': 'Das Darlehen ist bereits vollständig getilgt.',
  'The supported repayment horizon is exceeded.':
    'Der unterstützte Tilgungszeitraum wird überschritten.',
  'The loan does not amortize with these payments.':
    'Das Darlehen wird mit diesen Zahlungen nicht getilgt.',
  'Annual totals exceed the safe money range. Use the complete monthly appendix.':
    'Die Jahressummen überschreiten den sicheren Geldbereich. Nutze den vollständigen monatlichen Anhang.',
  'Amounts sum actual monthly payments in cents; debt uses period endpoints.':
    'Beträge summieren tatsächliche Monatszahlungen centgenau; Restschulden verwenden die Periodenendpunkte.',
  'Projection beyond the fixed-interest period assumes the initial nominal rate remains unchanged. Payoff timing is not a contractual term.':
    'Die Projektion nach der Zinsbindung unterstellt einen unveränderten anfänglichen Sollzins. Die rechnerische Volltilgung ist keine vertraglich zugesicherte Laufzeit.',
  Year: 'Jahr',
  'Loan month': 'Darlehensmonat',
  Months: 'Monate',
  'Partial year': 'Teiljahr',
  'Within fixed interest': 'Innerhalb der Zinsbindung',
  'Fixed-interest boundary': 'Ende der Zinsbindung',
  Projection: 'Projektion',
  Payoff: 'Volltilgung',
  'Already repaid; no further payments': 'Bereits voll getilgt; keine weiteren Zahlungen',
  'Opening debt': 'Restschuld zu Beginn',
  'Regular payments (sum)': 'Reguläre Zahlungen (Summe)',
  'Regular payment': 'Reguläre Zahlung',
  Interest: 'Zinsen',
  'Scheduled principal': 'Reguläre Tilgung',
  'Additional principal': 'Sondertilgung',
  'Total payment': 'Gesamtzahlung',
  'Closing debt': 'Restschuld am Ende',
  'Remaining debt': 'Restschuld',
  'Payment composition': 'Zusammensetzung der Zahlungen',
  'Remaining-debt data': 'Daten zur Restschuld',
  'Payment-composition data': 'Daten zur Zahlungszusammensetzung',
  'Full projected repayment': 'Vollständige Rückzahlung (Projektion)',
  Schedule: 'Verlauf',
  Period: 'Zeitraum',
  'Purchase price': 'Kaufpreis',
  'Federal state': 'Bundesland',
  'Broker involved': 'Makler beteiligt',
  Yes: 'Ja',
  No: 'Nein',
  'Property-transfer tax': 'Grunderwerbsteuer',
  Notary: 'Notar',
  'Land register': 'Grundbuch',
  'Buyer broker commission': 'Käufer-Maklerprovision',
  'Transaction costs': 'Kaufnebenkosten',
  'Renovation budget': 'Renovierungsbudget',
  'Moving/setup budget': 'Umzugs-/Einrichtungsbudget',
  'Total project cost': 'Gesamtkosten des Vorhabens',
  'Available equity': 'Verfügbares Eigenkapital',
  'Required equity': 'Erforderliches Eigenkapital',
  'Down payment': 'Eigenkapital für den Kaufpreis',
  'Financed acquisition costs': 'Mitfinanzierte Kaufnebenkosten',
  'Loan amount': 'Darlehensbetrag',
  'Monthly payment': 'Monatliche Rate',
  'Funding shortfall': 'Finanzierungslücke',
  'Funding covered': 'Finanzierung gedeckt',
  'Fixed-interest months': 'Darlehensmonate der Zinsbindung',
  'Actual additional principal through fixed interest':
    'Tatsächliche Sondertilgung während der Zinsbindung',
  'Interest saved through fixed interest': 'Zinsersparnis während der Zinsbindung',
  'Debt reduction at fixed-interest end': 'Restschuldminderung am Ende der Zinsbindung',
  'Projected lifetime interest saved': 'Projizierte Zinsersparnis bis Volltilgung',
  'Projected actual additional principal': 'Projizierte tatsächlich angewandte Sondertilgung',
  'Baseline payoff month': 'Volltilgungsmonat ohne Sondertilgung',
  'Selected payoff month': 'Volltilgungsmonat des ausgewählten Verlaufs',
  'Projected time saved (months)': 'Projizierte Zeitersparnis (Monate)',
  'Requested additional repayments': 'Angeforderte Sondertilgungen',
  'Requested payments may be capped at the outstanding principal.':
    'Angeforderte Zahlungen werden gegebenenfalls auf die ausstehende Restschuld begrenzt.',
  'Future interest': 'Künftiger Sollzins',
  'Future initial repayment': 'Künftige anfängliche Tilgung',
  'Future monthly payment': 'Künftige Monatsrate',
  'Payment change': 'Änderung der Monatsrate',
  Lower: 'Niedriger',
  Base: 'Basis',
  Higher: 'Höher',
  'Scenarios, not lender quotes.': 'Szenarien, keine Kreditangebote.',
  'Analysis horizon (months)': 'Betrachtungszeitraum (Monate)',
  'Buyer net wealth': 'Nettovermögen des Käufers',
  'Renter net wealth': 'Nettovermögen des Mieters',
  'Buyer minus renter': 'Käufer abzüglich Mieter',
  'Break-even month': 'Erster Gleichstandsmonat',
  'Not reached within the analysis horizon': 'Im Betrachtungszeitraum nicht erreicht',
  'Matched budget including actual additional repayments; principal is counted in equity, not deducted twice.':
    'Gleiches verfügbares Budget einschließlich tatsächlicher Sondertilgungen; Tilgung bildet Eigenkapital und wird nicht doppelt abgezogen.',
  'Property value': 'Immobilienwert',
  'Selling costs': 'Verkaufskosten',
  'Buyer monthly housing outflow': 'Monatlicher Wohnungsabfluss des Käufers',
  'Renter monthly housing outflow': 'Monatlicher Wohnungsabfluss des Mieters',
  'Buyer alternative portfolio': 'Alternatives Anlagevermögen des Käufers',
  'Renter alternative portfolio': 'Alternatives Anlagevermögen des Mieters',
  'Gross rental yield': 'Bruttomietrendite',
  'Net rental yield': 'Nettomietrendite',
  'Annual numerator': 'Jährlicher Zähler',
  'Investment cost denominator': 'Investitionskosten als Nenner',
  'First-month pre-tax cash flow after additional repayments':
    'Vor-Steuer-Cashflow im ersten Monat nach Sondertilgungen',
  'First-year pre-tax cash flow before additional repayments':
    'Vor-Steuer-Cashflow im ersten Jahr vor Sondertilgungen',
  'First-year pre-tax cash flow after additional repayments':
    'Vor-Steuer-Cashflow im ersten Jahr nach Sondertilgungen',
  'Cash-on-cash return': 'Eigenkapital-Cashflow-Rendite',
  'Cumulative pre-tax cash flow': 'Kumulierter Vor-Steuer-Cashflow',
  'Debt reduction over holding period': 'Restschuldminderung im Haltezeitraum',
  'Net sale proceeds': 'Nettoverkaufserlös',
  'Estimated profit before tax': 'Geschätzter Gewinn vor Steuern',
  'Reserves are cash contributions, not economic expenses. Personal taxes and tax savings are not modeled.':
    'Rücklagen sind Liquiditätsbeiträge, keine wirtschaftlichen Kosten. Persönliche Steuern und Steuerersparnisse werden nicht modelliert.',
  'Gross-yield price ceiling': 'Kaufpreisgrenze nach Bruttorendite',
  'Net-yield price ceiling': 'Kaufpreisgrenze nach Nettorendite',
  'Affordability price ceiling': 'Kaufpreisgrenze nach Leistbarkeit',
  'Comparable value range': 'Vergleichswertspanne',
  'Opening-offer range': 'Erstangebotsspanne',
  'Asking price': 'Angebotspreis',
  'Proposed offer': 'Vorgeschlagenes Angebot',
  'No valuation or recommended purchase price is implied.':
    'Daraus folgt kein Wertgutachten und keine Kaufpreisempfehlung.',
  Input: 'Eingabe',
  Value: 'Wert',
  'Not budgeted': 'Nicht budgetiert',
  'Confirmed zero': 'Nullbetrag bestätigt',
  Budgeted: 'Budgetiert',
  'Nominal interest rate': 'Sollzinssatz',
  'Initial repayment rate': 'Anfänglicher Tilgungssatz',
  'Fixed interest (years)': 'Zinsbindung (Jahre)',
  'Financed acquisition-cost share': 'Mitfinanzierter Kaufnebenkostenanteil',
  'Annual additional repayment': 'Jährliche Sondertilgung',
  'Annual repayment month': 'Sondertilgungsmonat im Darlehensjahr',
  'One-time repayment': 'Einmalige Sondertilgung',
  'Financing mode': 'Finanzierungsmodus',
  'Selected down payment': 'Gewähltes Kaufpreis-Eigenkapital',
  'Use available equity': 'Verfügbares Eigenkapital verwenden',
  'Current comparable rent': 'Aktuelle vergleichbare Miete',
  'Monthly owner costs': 'Monatliche Eigentümerkosten',
  'Owner analysis years': 'Betrachtungszeitraum Eigennutzung (Jahre)',
  'Rent growth': 'Mietwachstum',
  'Owner-cost growth': 'Kostenwachstum des Eigentümers',
  'Property appreciation': 'Immobilienwertentwicklung',
  'Alternative investment return': 'Alternative Anlagerendite',
  'Selling-cost rate': 'Verkaufskostenquote',
  'Net cold rent': 'Nettokaltmiete',
  Vacancy: 'Leerstand',
  'Other annual rent losses': 'Sonstige jährliche Mietausfälle',
  'Non-recoverable Hausgeld excluding reserves': 'Nicht umlagefähiges Hausgeld ohne Rücklagen',
  'Monthly reserve contribution': 'Monatliche Rücklagenzuführung',
  'Maintenance outside Hausgeld': 'Instandhaltung außerhalb des Hausgelds',
  'Other annual owner costs': 'Sonstige jährliche Eigentümerkosten',
  'Holding years': 'Haltedauer (Jahre)',
  'Maximum monthly payment': 'Maximale Monatsrate',
  'Target gross yield': 'Ziel-Bruttorendite',
  'Target net yield': 'Ziel-Nettorendite',
  'Living area (m²)': 'Wohnfläche (m²)',
  'Comparable price low (EUR/m²)': 'Unterer Vergleichspreis (EUR/m²)',
  'Comparable price high (EUR/m²)': 'Oberer Vergleichspreis (EUR/m²)',
  'Larger opening discount': 'Größerer Erstangebotsabschlag',
  'Smaller opening discount': 'Kleinerer Erstangebotsabschlag',
  'Property-transfer tax rate': 'Grunderwerbsteuersatz',
  'Notary rate': 'Notarsatz',
  'Land-register rate': 'Grundbuchsatz',
  'Buyer broker rate': 'Käufer-Maklersatz',
  'User override': 'Eigene Änderung',
  'Assumption default': 'Standardannahme',
  'State lookup': 'Bundeslandtabelle',
  'Contract version': 'Berichtsvertragsversion',
  'Input schema': 'Eingabeschema',
  'Source schema': 'Ursprüngliches Schema',
  'Input locale': 'Zahlenformat der Eingabe',
  'Assumption set': 'Annahmensatz',
  'Assumption schema': 'Annahmenschema',
  'Transfer-tax source date': 'Stand der Grunderwerbsteuerquelle',
  'State tax rate effective from': 'Landessteuersatz gültig ab',
  'Source date': 'Quelldatum',
  'Acquisition cost defaults are planning estimates unless explicitly statutory; user overrides have not been independently verified.':
    'Die Standardwerte der Kaufnebenkosten sind Planungsannahmen, sofern nicht ausdrücklich gesetzlich festgelegt; eigene Änderungen wurden nicht unabhängig geprüft.',
  'Fixed-interest results and projected lifetime or payoff results use different calculation horizons; projections are not lender commitments.':
    'Werte innerhalb der Zinsbindung und projizierte Gesamtlaufzeit- oder Volltilgungswerte haben unterschiedliche Betrachtungszeiträume; Projektionen sind keine Kreditzusagen.',
  'Mortgage schedule ends within the fixed-interest period; no post-fixation rate is assumed.':
    'Die Rückzahlung endet innerhalb der Zinsbindung; es wird kein Sollzins nach der Zinsbindung unterstellt.',
  'Assumptions verified on': 'Annahmen geprüft am',
  'Calculation specification': 'Berechnungsspezifikation',
  'Effective from': 'Gültig ab',
  'Build identity': 'Build-Kennung',
  'Sources retain their recorded verification dates; generation does not renew them.':
    'Quellen behalten ihre dokumentierten Prüfdaten; die Berichtserstellung erneuert sie nicht.',
  'Verified on': 'Geprüft am',
  'Financial notice': 'Finanzieller Hinweis',
  'Privacy warning': 'Datenschutzhinweis',
  'Educational estimates only. Not financial, mortgage, investment, tax or legal advice, and not a financing offer or approval. Check current figures and obtain qualified advice before making a commitment.':
    'Nur unverbindliche Planungswerte. Keine Finanzierungs-, Anlage-, Steuer- oder Rechtsberatung und kein Darlehensangebot oder Finanzierungszusage. Prüfe aktuelle Werte und hole vor einer Entscheidung qualifizierten Rat ein.',
  'This report can reveal your property plans and financial circumstances. Review its contents before printing, saving or sharing. Generation happens in your browser; the application does not upload the report. Files and printouts may be accessible to other device users, backups, synchronization services or recipients. Deleting a saved scenario does not delete those copies.':
    'Dieser Bericht kann Ihre Immobilienpläne und finanziellen Verhältnisse offenlegen. Prüfen Sie den Inhalt vor dem Drucken, Speichern oder Teilen. Die Erstellung erfolgt in Ihrem Browser; die Anwendung lädt den Bericht nicht hoch. Dateien und Ausdrucke können für andere Gerätenutzer, Sicherungs- oder Synchronisierungsdienste und Empfänger zugänglich sein. Das Löschen eines gespeicherten Szenarios löscht diese Kopien nicht.',
} as const

export type ReportLabel = keyof typeof german
export const reportText =
  (language: SupportedLanguage) =>
  (key: ReportLabel): string =>
    language === 'de' ? german[key] : key

export function reportFormat(language: SupportedLanguage) {
  return {
    money: (value: number) => formatEuroFromCents(value, language),
    number: (value: number) => formatNumber(value, language),
    rate: (value: string) => formatPercentage(new Decimal(value).toNumber(), language),
  }
}

export function formatCapturedInput(
  value: string,
  kind: 'money' | 'rate' | 'number',
  inputLocale: 'de-DE' | 'en-GB' | 'canonical',
  language: SupportedLanguage,
) {
  const t = reportText(language)
  if (!value.trim()) return t('Not provided')
  const raw = value.replace(/[€%\s]/gu, '')
  const normalized =
    kind !== 'money'
      ? raw.replace(',', '.')
      : inputLocale === 'de-DE'
        ? raw.replace(/\./gu, '').replace(',', '.')
        : inputLocale === 'en-GB'
          ? raw.replace(/,/gu, '')
          : raw
  try {
    const amount = new Decimal(normalized)
    if (!amount.isFinite()) return t('Invalid input')
    return kind === 'money'
      ? reportFormat(language).money(eurosToCents(amount))
      : `${formatNumber(amount.toNumber(), language, 6)}${kind === 'rate' ? ' %' : ''}`
  } catch {
    return t('Invalid input')
  }
}
