# ImmoPilot DE

ImmoPilot DE is a planned client-side application for evaluating residential property purchases and financing decisions in the German market.

> Status: foundation implementation. The application is not yet released.

## Version 1 scope

- German purchase-cost calculation
- Mortgage and amortization schedule
- Sondertilgung simulation
- Refinancing stress testing
- Rent-versus-buy comparison
- Rental-investment analysis
- Offer-price calculation
- Side-by-side scenario comparison
- German and English interfaces
- Static deployment on GitHub Pages

## Product principles

- **Deterministic calculations:** Financial outputs come from documented and tested formulas.
- **Transparent assumptions:** Rates, fees, timing conventions and limitations remain visible and editable.
- **Local processing:** Version 1 requires no account or backend. Calculation data remains in the browser.
- **German-market context:** Defaults reflect German acquisition and mortgage concepts and include source dates.
- **Accessible design:** Quick and advanced workflows must work on desktop and mobile in German and English.

## Target users

1. **Owner-occupiers** comparing rent, purchase costs, monthly financing and refinancing risk.
2. **Rental investors** evaluating yield, cash flow, debt reduction, long-term outcomes and offer limits.

## Product documentation

- [Product definition](docs/product-definition.md): approved scope, users and workflows
- [German–English terminology standard](docs/terminology.md): canonical interface terms, definitions and locale formatting
- [Grunderwerbsteuer rates](docs/grunderwerbsteuer-rates.md): verified rates, effective dates, legal basis and sources for all 16 Bundesländer
- [Acquisition-cost assumptions](docs/acquisition-cost-assumptions.md): editable defaults, legal rules, source dates and limitations for notary, land-register, broker, renovation and setup costs
- [Calculation specification](docs/calculation-specification.md): normative formulas, timing, precision, validation rules and golden test vectors
- [Versioned assumptions schema](docs/assumptions-schema.md): stable data types, defaults, provenance, migrations, examples and validation fixtures
- [Financial disclaimer and privacy statement](docs/legal-and-privacy.md): bilingual user notices and privacy requirements for local processing, sharing, export and GitHub Pages
- [Representative German property examples](docs/demo-scenarios.md): schema-valid owner-occupier and rental-investment demos with deterministic expected results

## Planned technology

- React
- TypeScript
- Vite
- Client-side financial calculation engine
- Vitest and Playwright
- GitHub Actions
- GitHub Pages

## Local development

The foundation uses Node.js 24.19.0 and npm 11.9.0. With `nvm` installed, select the
documented runtime and install the exact dependency graph from the lockfile:

```bash
nvm use
npm ci
npm run dev
```

Available foundation commands:

```bash
npm run typecheck
npm run build
npm run preview
```

`npm run build` performs strict TypeScript project compilation before creating the
static `dist/` output. Linting, automated tests, application architecture and GitHub
Pages base-path configuration are tracked as later foundation tasks.

## Deployment target

`https://akshat4112.github.io/immopilot-de/`

## Version 1 non-goals

- AI-generated advice
- Listing scraping
- Live mortgage-rate feeds
- User accounts or cloud storage
- Bank offers or financing approval
- Legal, tax or investment advice
