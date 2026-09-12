# ImmoPilot DE

ImmoPilot DE is a planned client-side application for evaluating residential property purchases and financing decisions in the German market.

> Status: product definition. The application is not yet released.

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

## Planned technology

- React
- TypeScript
- Vite
- Client-side financial calculation engine
- Vitest and Playwright
- GitHub Actions
- GitHub Pages

## Deployment target

`https://akshat4112.github.io/immopilot-de/`

## Version 1 non-goals

- AI-generated advice
- Listing scraping
- Live mortgage-rate feeds
- User accounts or cloud storage
- Bank offers or financing approval
- Legal, tax or investment advice
