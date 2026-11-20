<p align="center">
  <img src="public/favicon.svg" alt="ImmoPilot house logo" width="76" height="76" />
</p>

<h1 align="center">ImmoPilot DE</h1>

<p align="center"><strong>One household. Multiple investment strategies. A complete financial picture.</strong></p>

<p align="center">
  <a href="https://akshat4112.github.io/immopilot-de/"><strong>Launch the wealth planner</strong></a> ·
  <a href="docs/README.md">Documentation</a> ·
  <a href="https://github.com/Akshat4112/immopilot-de/issues/93">Roadmap</a> ·
  <a href="https://github.com/Akshat4112/immopilot-de/issues">Report an issue</a>
</p>

[![CI](https://github.com/Akshat4112/immopilot-de/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Akshat4112/immopilot-de/actions/workflows/ci.yml)
[![Deployment](https://github.com/Akshat4112/immopilot-de/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/Akshat4112/immopilot-de/actions/workflows/deploy-pages.yml)

ImmoPilot DE is a browser-based household wealth and financial planning application for Germany. It brings income, living expenses, homeownership, mortgage financing, rental properties and ETF investing together in one interactive workspace. Explore alternative decisions, understand the trade-offs and project how a household's finances could evolve over time.

> **Status:** Public development preview. The application is available to try, but financial, accessibility and legal release gates remain open. It is an educational simulator, not a regulated advisory service or a tax filing tool.

## Why ImmoPilot?

Buying a home, investing in ETFs or purchasing a rental property affects the same household budget. ImmoPilot connects these choices instead of treating each as an isolated calculation.

- **One financial picture:** follow cash flow, investments, debt, property equity and modeled wealth together.
- **Comparable decisions:** compare alternative strategies using clearly stated starting capital, budgets and horizons.
- **German context:** model acquisition costs, financing, rental deductions and selected tax concepts with documented assumptions.
- **Local-first planning:** no account or backend is required to use the planner.

## Explore the planner

The overview connects monthly free cash, invested assets, property equity and projected financial outcomes. Interactive graphs and tables help explain how the figures change.

[View real desktop and mobile browser-test evidence and capture instructions](docs/screenshots/README.md).

### Core capabilities

- **Household finances:** income for one or two people, living expenses, current housing, savings capacity, cash reserves and a separate 2026 German payroll withholding checker.
- **Homeownership and mortgages:** purchase costs, down payment, repayment, interest, amortization, remaining debt, Sondertilgung, refinancing and property equity.
- **Rental properties:** multiple properties, rental income, vacancy, costs, estimated tax effects, AfA, renovation treatment and long-term cash flow.
- **ETF investing:** contributions, portfolio growth, planned withdrawals, sensitivity to market returns and transparent reporting of modeled tax evidence.
- **Wealth projections:** yearly assets, liabilities and equity, lifetime wealth timeline and modeled life events.
- **Decision studio:** compare rent versus buy, buying a rental versus investing equivalent cash in ETFs, and mortgage or return assumptions.
- **Interactive explanations:** cash-flow Sankey, wealth timeline, mortgage explorer, rental waterfall and annual ETF evidence.
- **Scenario workspace:** save, duplicate, rename and compare up to three saved plans; export and restore validated JSON backups; undo the last scenario load.

### Seven investment strategies

| Strategy                | ETFs  | Own home | Rental |
| ----------------------- | :---: | :------: | :----: |
| ETF investing           |  Yes  |    —     |   —    |
| Homeownership           |   —   |   Yes    |   —    |
| Rental investing        |   —   |    —     |  Yes   |
| ETFs + homeownership    |  Yes  |   Yes    |   —    |
| ETFs + rental investing |  Yes  |    —     |  Yes   |
| Homeownership + rental  |   —   |   Yes    |  Yes   |
| All three               |  Yes  |   Yes    |  Yes   |

Every strategy retains relevant household income, current housing and expenditure. ETF-only planning does not require a property purchase.

### Example questions

- How would buying an apartment change our monthly savings and long-term wealth compared with renting and investing?
- How do mortgage interest, repayment and refinancing affect the risk of homeownership?
- Can rental income cover operating costs, debt service and estimated taxes?
- What happens if we invest in ETFs, own a home and hold a rental portfolio at the same time?
- How do a salary change, a move or a change in investment contributions affect the modeled outcome?

Start with illustrative figures and replace them with your own assumptions. Projections are scenarios, not forecasts or guaranteed outcomes.

## Financial methodology and trust

ImmoPilot distinguishes estimates from verified inputs and market value from liquid or after-tax wealth. The repository contains documented calculation specifications, deterministic TypeScript financial modules, reference vectors and regression tests. The standalone planner also retains simulation logic that is being consolidated into shared modules; not every model uses the same engine yet.

| Topic                        | Documentation                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Property costs and financing | [Calculation specification](docs/calculation-specification.md) · [Acquisition cost assumptions](docs/acquisition-cost-assumptions.md) |
| German property transfer tax | [State rates, sources and effective dates](docs/grunderwerbsteuer-rates.md)                                                           |
| ETF taxation                 | [ETF tax assumptions](docs/etf-tax-2026.md) · [Projection limitations](docs/etf-002-projection-limitations.md)                        |
| Investment comparisons       | [Matched-budget rent/buy/ETF methodology](docs/ux-028-rent-buy-etf-explorer.md)                                                       |
| Reference scenarios          | [Fictional examples and golden vectors](docs/demo-scenarios.md)                                                                       |

**Important limits:** The live ETF visualizer deliberately leaves Vorabpauschale tax and full after-tax liquidation values unavailable. The separate annual projection module is not integrated into the production planner and must not be interpreted as a tax-grade ledger. Withdrawal tax is simplified. Source-backed assumptions are dated, not live market feeds. Notary and similar fees can be planning proxies rather than binding quotes. See [ETF transparency](docs/ux-031-etf-tax-transparency.md) and the [financial disclaimer](docs/legal-and-privacy.md).

## Privacy, security and accessibility

- Financial inputs and calculations remain in the browser in the intended local-first workflow. Saved plans use browser storage; JSON backups contain private financial data and should be handled accordingly.
- The static app requires no login or cloud account. GitHub Pages hosting may process standard request metadata such as IP addresses. See the [privacy documentation](docs/legal-and-privacy.md).
- The project uses dependency audits, validated inputs and release artifact verification. Please follow the [security reporting policy](SECURITY.md) for suspected vulnerabilities.
- The design targets usable desktop and mobile layouts, keyboard access and chart/table alternatives. German and English are supported across the project, but complete localization and accessibility conformance are not asserted.

## Architecture

The deployed planner uses a hybrid architecture. A React/TypeScript host loads the same-origin standalone HTML planner and supplies selected tested financial modules through a bridge. The payroll checker is an additive React component, not a replacement for the planning simulation.

```text
Browser
  └── React host (src/main.tsx)
        ├── Standalone wealth planner (public/wealth-planner.html)
        │     ├── Household, mortgage, ETF and rental simulations
        │     ├── Charts, scenarios and local storage
        │     └── Bridge to shared rental tax modules
        └── React payroll withholding checker
Shared TypeScript domain modules (src/domain/)
  └── Deterministic financial primitives and reference tests
```

The original React property calculator features remain in the repository; they are not all current entry-point routes. See the [architecture guide](docs/architecture.md) for actual runtime boundaries and migration principles.

### Technology stack

- React 19, TypeScript 5.9 and Vite 8
- Semantic HTML, CSS and JavaScript for the standalone planner
- Decimal.js for shared financial arithmetic; Zod for schema validation
- Vitest, Testing Library and Playwright
- GitHub Actions and GitHub Pages

Exact dependency versions are pinned in [package.json](package.json) and [package-lock.json](package-lock.json).

## Getting started

Use Node.js 24 and npm 11, with the exact Node runtime selected from [`.nvmrc`](.nvmrc).

```bash
git clone https://github.com/Akshat4112/immopilot-de.git
cd immopilot-de
nvm use
npm ci
npm run dev
```

Open the local Vite URL printed in the terminal. No backend or credentials are required.

### Testing and quality assurance

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Unit and component suites cover financial models, validation and UI behavior. Playwright runs the production planner on Chromium and selected cross-browser checks on Firefox and WebKit. CI also checks dependency advisories and verifies production artifact digests. Passing tests does not by itself establish financial or legal correctness.

### Deployment

GitHub Actions publishes `dist/` to GitHub Pages after successful CI on `main`. The build emits `release.json` with the source commit and SHA-256 inventory.

To verify a known deployed commit:

```bash
npm run release:verify -- EXACT_MAIN_SHA https://akshat4112.github.io/immopilot-de/
```

See [CI](.github/workflows/ci.yml), [Pages deployment](.github/workflows/deploy-pages.yml) and the [release contract](docs/version-1-release-contract.md). Artifact verification is not a substitute for a release audit.

## Documentation and roadmap

- [Documentation index](docs/README.md) — product guides, financial methodology, architecture and quality requirements.
- [UX roadmap](https://github.com/Akshat4112/immopilot-de/issues/93) — ongoing chart accessibility, actionable insights, performance and release testing.
- [Changelog](CHANGELOG.md) — important product changes and known limitations.
- [Contributing](CONTRIBUTING.md) — development and validation standards.
- [Security](SECURITY.md) — responsible reporting.

## License and disclaimer

A project-wide license has not yet been selected. Public repository visibility does not itself grant permission to reuse or redistribute the code. Third-party components retain their respective licenses.

ImmoPilot is intended for educational financial planning. It does not provide investment, financial, mortgage, legal or tax advice, financing approval or a guarantee of returns. Verify any material decision independently with qualified professionals.

[Full financial and privacy notice](docs/legal-and-privacy.md).
