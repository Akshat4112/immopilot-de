# Changelog

This log summarizes meaningful product changes from merged work. It is not a declaration of a production release. Version 0.1.0 remains the package version.

## Unreleased

### Household wealth planner — November 2026

- Replaced the original property-calculator entry point with the integrated household wealth planner as the primary application.
- Added all seven combinations of ETFs, owner-occupied housing and rental investments; integrated selected German rental tax modules and a separate payroll withholding checker.
- Added goal-first setup, an overview dashboard, contextual inputs and an improved saved-scenario workspace.
- Added cash-flow Sankey, lifetime wealth and life-event timelines, matched-budget decision comparisons, mortgage and rental cash-flow explorers.
- Added ETF contributions and market-value evidence, with unsupported advance tax and full liquidation tax explicitly unavailable.
- Introduced and tested separate ETF tax/projection modules; the illustrative annual projection remains excluded from the deployed planner.

**Evidence:** [Planner entry point](https://github.com/Akshat4112/immopilot-de/pull/85) · [ETF tax primitives](https://github.com/Akshat4112/immopilot-de/pull/91) · [ETF projection](https://github.com/Akshat4112/immopilot-de/pull/92) · [UX roadmap](https://github.com/Akshat4112/immopilot-de/issues/93) · [ETF visualizer](https://github.com/Akshat4112/immopilot-de/pull/105).

### Earlier foundation

- German property acquisition and financing calculations, mortgage and amortization schedules, additional repayments, refinancing and rent-versus-buy comparisons.
- Property examples, saved scenario support, bilingual interface foundations, printable report infrastructure and financial source documentation.
- Automated CI, browser checks, build artifact identity verification and static deployment.

### Known limitations and ongoing work

- ETF full-sale and advance-tax outputs remain unavailable pending validated tax-year and FIFO accounting.
- Shared domain consolidation, chart accessibility, performance, and formal release testing continue.
- Final legal operator information, applicable legal review and project-wide license decision remain open.

For implementation history see the [merged pull requests](https://github.com/Akshat4112/immopilot-de/pulls?q=is%3Apr+is%3Amerged) and [roadmap](https://github.com/Akshat4112/immopilot-de/issues/93).
