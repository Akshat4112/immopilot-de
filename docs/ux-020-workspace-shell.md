# UX-020 — Modern Immopilot workspace shell

## Goal
Make the existing calculator easier to scan and navigate without changing its financial calculations, scenario storage, or seven investment strategies.

## What changed
- Unified light/dark semantic palette and focus tokens, responsive typography and spacing.
- Calm surface hierarchy: header, tab navigation, overview and KPI bar, property/investment cards.
- Better form target sizes, contrast, visible keyboard focus and scrollable mobile tabs.
- Maintained existing responsive table/chart scrolling and light print layout.
- Preserved all financial formulas, input identifiers, data-view switching, and local scenario persistence.

## Manual review before merge
1. At widths 320, 390, 768, 1024, 1440: confirm no clipped controls or horizontal page overflow; horizontal nav scrolling remains usable.
2. Check each Overview, Household, Properties, Investments, Compare, Reports tab and the seven strategies.
3. Toggle light/dark and check form labels, values, charts and hover/focus states.
4. Print report; ensure no sticky nav, dark background or clipped summary.
5. Verify EN labels and any DE-specific copy already supported; this task does not introduce language features.
6. Confirm saved scenarios survive refresh and mode changes; do not clear local storage.

## Deferred
- UX-021 goal-based onboarding
- UX-022 truly new dashboard component and KPI definitions
- UX-025+ Sankey and new charts
- React modularization of the standalone HTML page

Source: GitHub issue #93. CSS-only shell changes intentionally avoid tax/rental/ETF business logic.
