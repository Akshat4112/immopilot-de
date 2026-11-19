# UX-032 — Accessible chart data contract

## Current implementation

The shared `chartRowsToCsv(headers, rows)` serializer is available in `src/utils/chartData.ts` with Vitest coverage. It is **not yet wired to the rendered financial charts**. Do not describe UX-032 as released on the basis of passing serializer tests alone.

## Integration contract

- Reuse the **same canonical row array** for the visible data table, the chart, the screen-reader summary, and CSV export. Do not recompute tax, cost basis, interest, amortization or investment balances in the export path.
- Preserve full numeric precision in exported cells; apply localized EUR formatting only in the human-readable table. Label units and annual/monthly timing explicitly in headers.
- Represent unsupported or uncomputed figures as blank cells with an adjacent textual explanation; never silently substitute zero, a fictional tax rate, or an inferred ETF liquidation value.
- Provide a visible **Download CSV** control adjacent to each chart/table toggle. Use an accessible name identifying the dataset; keep the button keyboard-operable with a visible focus indicator.
- Offer a semantic `<table>` with `<caption>`, scoped column headers, row labels and readable negative values. Ensure the chart's visual color encodings also have text labels or patterns. Include a concise text summary of the trend.
- Use `chartRowsToCsv` for every download: it rejects non-finite numbers, enforces row width, escapes quotes/newlines, neutralizes spreadsheet formulas in string cells and emits a UTF-8 BOM. Do not bypass the serializer with ad hoc string concatenation.
- Avoid putting private financial data into network requests, telemetry, logs, URLs or remote export services. The CSV download must be client-side.

## Verification before merge

1. Add a browser test for at least the ETF annual table and the rental cash-flow visualization: keyboard-only toggle and download, matching row counts and values, and CSV content including negative amounts.
2. Test mobile widths 320 and 375 px; confirm no clipped controls, inaccessible horizontal scroll or focus traps.
3. Run pinned formatting, lint, strict TypeScript, unit/coverage, production build, dependency audits, and Playwright against the **exact final head SHA**.
4. Inspect manual keyboard focus, accessible names, screen-reader table summaries and dark/print modes. Keep the PR draft until integration and required reviews are complete.

**Financial safety:** UX-031 deliberately leaves Vorabpauschale and after-tax ETF full-liquidation outputs unavailable. UX-032 must preserve that boundary. See `docs/ux-031-etf-tax-transparency.md` and issue #93.

## Integration architecture decision (2026-11-19)

The deployed wealth planner is `public/wealth-planner.html`, while `AccessibleChartData` is a React component under `src/components`. Passing React component tests does **not** make the toolkit available inside the standalone planner. Before claiming ETF/rental chart integration, choose and test one explicit bridge: (a) mount a bundled React island into a stable planner container with a documented build/deployment path, or (b) extract a framework-neutral chart-data adapter and render the semantic table and download controls using the planner's existing DOM lifecycle. Do not paste a TSX import into the standalone HTML or add a parallel financial calculation.

For both integrations, capture the **same yearly ledger rows already used by the visible chart**; use that array for chart, table and CSV. Confirm that switching strategy, year, language or scenario invalidates and rebuilds all three together. In particular, preserve `null`/unavailable liquidation values and show the caveat in the accessible description. A unit test of the React component is insufficient: a Playwright test must visit the deployed planner route and operate the real controls.

**Verified baseline:** head `2e91fe4d57997d972505e16f5014383cdf279ca2` passed CI run `44538406699` (Quality and build; Playwright smoke test). This is a baseline only; subsequent commits require their own exact-head CI verification. No reviews were recorded at this baseline.
