type FoundationArea = {
  readonly number: string
  readonly title: string
  readonly description: string
}

const foundationAreas: readonly FoundationArea[] = [
  {
    number: '01',
    title: 'Kaufnebenkosten',
    description: 'Bundesland, Notar, Grundbuch und Makler transparent aufschlüsseln.',
  },
  {
    number: '02',
    title: 'Finanzierung',
    description: 'Rate, Tilgung, Restschuld und Anschlussfinanzierung nachvollziehen.',
  },
  {
    number: '03',
    title: 'Entscheidungen',
    description: 'Eigennutzung, Vermietung und mehrere Szenarien konsistent vergleichen.',
  },
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  )
}

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ImmoPilot DE Startseite">
          <span className="brand-mark" aria-hidden="true">
            IP
          </span>
          <span>ImmoPilot DE</span>
        </a>
        <span className="release-tag">Foundation · 0.1</span>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Immobilienentscheidungen für Deutschland</p>
            <h1 id="hero-title">
              Zahlen verstehen.
              <br />
              Sicherer entscheiden.
            </h1>
            <p className="hero-summary">
              Ein transparenter Rechner für Kaufkosten, Finanzierung und langfristige
              Immobilienszenarien. Lokal im Browser und ohne Benutzerkonto.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#foundation">
                Projekt ansehen
                <ArrowIcon />
              </a>
              <a
                className="secondary-action"
                href="https://github.com/Akshat4112/immopilot-de"
              >
                Dokumentation
              </a>
            </div>
          </div>

          <aside className="preview-card" aria-label="Geplanter Beispielüberblick">
            <div className="preview-heading">
              <span>Beispielszenario</span>
              <span className="status-dot">Vorbereitet</span>
            </div>
            <p className="preview-price">250.000 €</p>
            <p className="preview-caption">Kaufpreis · Baden-Württemberg</p>
            <dl className="preview-metrics">
              <div>
                <dt>Eigenkapital</dt>
                <dd>66.250 €</dd>
              </div>
              <div>
                <dt>Monatliche Rate</dt>
                <dd>916,67 €</dd>
              </div>
              <div>
                <dt>Restschuld nach 10 J.</dt>
                <dd>152.188,73 €</dd>
              </div>
            </dl>
            <p className="preview-note">Geprüft gegen Berechnungsspezifikation 1.0.0</p>
          </aside>
        </section>

        <section className="trust-strip" aria-label="Projektgrundsätze">
          <span>Lokale Berechnung</span>
          <span>Keine Konten</span>
          <span>Quellenbasierte Annahmen</span>
          <span>Deutsch &amp; English</span>
        </section>

        <section className="foundation" id="foundation" aria-labelledby="foundation-title">
          <div className="section-intro">
            <p className="eyebrow">Version 1</p>
            <h2 id="foundation-title">Eine klare Grundlage für den Immobilienkauf.</h2>
            <p>
              Die fachlichen Regeln und deutschen Annahmen sind dokumentiert. Die
              interaktiven Rechner werden schrittweise auf dieser geprüften Grundlage gebaut.
            </p>
          </div>

          <div className="area-grid">
            {foundationAreas.map((area) => (
              <article className="area-card" key={area.number}>
                <span className="area-number">{area.number}</span>
                <h3>{area.title}</h3>
                <p>{area.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Nur unverbindliche Planungswerte. Keine Finanzierungs-, Steuer- oder Rechtsberatung
          und kein Darlehensangebot.
        </p>
        <span>© 2026 ImmoPilot DE</span>
      </footer>
    </div>
  )
}

export default App
