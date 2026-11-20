# ImmoPilot documentation

Use this index as the entry point to product, engineering and financial documentation. Historical task specifications remain available for traceability, but not every original Version 1 workflow describes the current wealth planner.

## Product and user experience

- [Project overview and local setup](../README.md)
- [Original product definition](product-definition.md)
- [Workspace navigation and design](ux-020-workspace-shell.md)
- [Seven strategies and goal-first onboarding](ux-021-goal-onboarding.md)
- [Financial overview dashboard](ux-022-overview-dashboard.md)
- [Contextual inputs and glossary](ux-023-contextual-inputs.md)
- [Saving and comparing scenarios](ux-024-scenario-workspace.md)
- [Browser screenshots and reproduction](screenshots/README.md)

## Visualizations and decisions

- [Household cash-flow Sankey](ux-025-cashflow-sankey.md)
- [Lifetime wealth timeline](ux-026-lifetime-wealth-timeline.md)
- [Life-event timeline](ux-027-life-event-timeline.md)
- [Matched-budget comparison](ux-028-rent-buy-etf-explorer.md)
- [Mortgage and equity explorer](ux-029-mortgage-equity-explorer.md)
- [Rental waterfall](ux-030-rental-cashflow-waterfall.md)
- [ETF tax transparency and limitations](ux-031-etf-tax-transparency.md)

## Financial models and source evidence

- [Calculation specification and golden vectors](calculation-specification.md)
- [Calculation-engine conventions](calculation-engine-conventions.md)
- [Versioned assumptions and migrations](assumptions-schema.md)
- [Property transfer tax by state](grunderwerbsteuer-rates.md)
- [Acquisition cost assumptions](acquisition-cost-assumptions.md)
- [Sondertilgung contract](sondertilgung-product-contract.md)
- [ETF tax assumptions](etf-tax-2026.md)
- [ETF projection release constraints](etf-002-projection-limitations.md)
- [Fictional reference scenarios](demo-scenarios.md)
- [German/English terminology](terminology.md)

## Engineering

- [Current hybrid architecture and original module boundaries](architecture.md)
- [Shared financial domain](../src/domain/README.md)
- [Feature module conventions](../src/features/README.md)
- [Design tokens](design-tokens.md)
- [Contribution guide](../CONTRIBUTING.md)
- [Security policy](../SECURITY.md)

## Release, privacy and quality

- [Financial disclaimer and privacy](legal-and-privacy.md)
- [Version 1 release contract](version-1-release-contract.md)
- [Version 1 release audit](version-1-release-audit.md)
- [Candidate identity verification](pf-0056-release-candidate-verification.md)
- [Accessibility and responsive audit](pf-0054-accessibility-responsive-audit.md)
- [Financial methodology and provenance audit](pf-0065-methodology-audit.md)
- [Report content and privacy](report-content-and-privacy-contract.md)
- [Print and PDF browser validation](pf-0067-pdf-browser-validation.md)
- [Changelog](../CHANGELOG.md)
- [Current roadmap](https://github.com/Akshat4112/immopilot-de/issues/93)

## Maintenance

Keep user-facing documentation aligned with the actual shipped entry point and versioned financial sources. Do not label unsupported outputs as implemented or mark a release gate complete without evidence. Preserve dated historical decisions and update the index when new financial or architecture documents are published.
