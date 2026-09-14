# ImmoPilot DE

[![CI](https://github.com/Akshat4112/immopilot-de/actions/workflows/ci.yml/badge.svg)](https://github.com/Akshat4112/immopilot-de/actions/workflows/ci.yml)

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
- [Application architecture](docs/architecture.md): source folders, dependency direction, public module APIs and testing conventions

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
npx playwright install chromium
npm run dev
```

Available foundation commands:

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
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

Vitest runs unit and component tests in `jsdom`. React Testing Library suites are
colocated with production code and use the shared setup and render utility in
`src/test/`. `npm run test:coverage` creates text, HTML and LCOV reports and enforces
an 80% baseline for statements, branches, functions and lines. Generated coverage
reports are excluded from version control and formatting.

Playwright runs browser tests against the production build using Chromium. `npm run
test:e2e` builds the application, starts an isolated Vite preview server and executes
the smoke suite at `/immopilot-de/`. The suite verifies that the application renders
under its router basename and that generated JavaScript and stylesheet URLs remain
under the repository path. Use `npm run test:e2e:ui` for the interactive runner and
`npm run test:e2e:report` to reopen the most recent HTML report. Traces, screenshots
and video are retained only according to the failure and retry policy in
`playwright.config.ts`.

The `CI` GitHub Actions workflow runs on every pull request and push to `main`. Its
quality job installs the locked dependency graph on the `.nvmrc` Node.js version,
then checks formatting, linting, strict types, unit coverage, the production build
and dependency audits. After those checks pass, a separate job installs Chromium and
runs the Playwright smoke test against the managed production preview. Browser
reports, traces, screenshots and videos are retained as short-lived artifacts when
the Playwright job fails.

## GitHub Pages deployment

The `Deploy GitHub Pages` workflow publishes the production `dist/` directory after
the `CI` workflow succeeds for a commit on `main`, preventing failed checks from
reaching production. It can also be started manually from the workflow's
`Run workflow` control in GitHub Actions. The build uses the pinned Node.js runtime
and lockfile, configures Pages, uploads a one-day Pages artifact, and deploys it
through the protected `github-pages` environment.

The workflow grants read-only repository access by default. Only the deployment job
receives `pages: write` and `id-token: write`; it also receives `actions: read` to
retrieve the uploaded artifact. Deployment concurrency is shared under the `pages`
group, and an in-progress production deployment is never cancelled.

The published environment URL is populated from the Pages deployment output and the
target site is:

`https://akshat4112.github.io/immopilot-de/`

Repository administrators must select **GitHub Actions** as the Pages source under
**Settings → Pages**. Production builds use `/immopilot-de/` as the Vite base path,
and React Router receives the same value through `import.meta.env.BASE_URL`. Local
development remains available at `/`, while production preview and Playwright use
`/immopilot-de/` to match the deployed project site.

## Localization

The interface uses `i18next` and `react-i18next`, defaults to German, and can be switched to
English from the header. Translation resources use stable, language-neutral keys in
`src/i18n/resources.ts`; financial labels follow the canonical mapping in
`docs/terminology.md`. Locale formatters render integer-cent euro amounts, decimal percentage
rates and numbers according to the active language without changing calculation inputs.

When interface terminology changes, update the German and English resources, the terminology
standard and the relevant unit and Playwright tests in the same pull request.

## Deployment target

`https://akshat4112.github.io/immopilot-de/`

## Version 1 non-goals

- AI-generated advice
- Listing scraping
- Live mortgage-rate feeds
- User accounts or cloud storage
- Bank offers or financing approval
- Legal, tax or investment advice
