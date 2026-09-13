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

## Approved application dependencies

FND-002 establishes the approved Version 1 dependency set. Versions are pinned
exactly in `package.json` and the complete reproducible graph is recorded in
`package-lock.json`.

| Area                     | Packages                                                         | Purpose                                                                |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Forms and validation     | `react-hook-form`, `@hookform/resolvers`, `zod`                  | Typed form state, validation and schema integration                    |
| Financial arithmetic     | `decimal.js`                                                     | Deterministic decimal calculations without binary floating-point drift |
| Routing                  | `react-router-dom`                                               | Client-side navigation compatible with static hosting                  |
| Internationalisation     | `i18next`, `react-i18next`                                       | German and English interface resources and React bindings              |
| Charts                   | `recharts`                                                       | Responsive financial charts built on React and SVG                     |
| Client state             | `zustand`                                                        | Small local scenario and interface state stores                        |
| Unit and component tests | `vitest`, `@vitest/coverage-v8`, Testing Library, `jsdom`        | Calculation, hook and accessible component tests with coverage         |
| Browser tests            | `@playwright/test`                                               | End-to-end checks for critical workflows and GitHub Pages behavior     |
| Code quality             | ESLint, TypeScript ESLint, React Hooks/Refresh plugins, Prettier | Static analysis and consistent formatting                              |

The interface will use semantic HTML and project-owned CSS, so no component or
CSS framework is approved at this stage. This keeps the initial bundle and design
surface small while the application shell and design tokens are still being
defined.

TypeScript is pinned to 5.9.3 because it is within the stable support range of
the approved TypeScript ESLint release. Node type definitions stay on major 24
to match the documented runtime. Configuration and npm scripts for linting,
testing, routing and internationalisation are introduced by their respective
follow-up tasks; FND-002 only approves and installs the shared packages.

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
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
npm run build
npm run preview
```

`npm run build` performs strict TypeScript project compilation before creating the
static `dist/` output. `npm run lint` applies the approved type-aware TypeScript,
React Hooks and React Refresh rules with zero warnings allowed. `npm run format:check`
checks the application and configuration files against the shared Prettier rules.
Normative financial specifications, versioned data fixtures and the npm-generated
lockfile are intentionally excluded from automatic formatting.

Automated test configuration, application architecture and GitHub Pages base-path
configuration are tracked as later foundation tasks.

## Deployment target

`https://akshat4112.github.io/immopilot-de/`

## Version 1 non-goals

- AI-generated advice
- Listing scraping
- Live mortgage-rate feeds
- User accounts or cloud storage
- Bank offers or financing approval
- Legal, tax or investment advice
