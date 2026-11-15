# UX-026 — Lifetime Wealth Timeline

## Scope

Replace the existing sampled 5-year stacked bar chart inside the **Visual insights** section with a continuous **year-by-year stacked area visualization** covering the selected planning horizon (up to 40 years), with signed net-position and property-debt lines, a mode switch, local 5/10/20/30-year ranges, and a semantically labeled data table.

**All values come from the existing calculation outputs** `simulate(x).rows`, `rentalPortfolio(x,tax).rows`, `householdCashProjection(x,tax,sim,rent)` and the live form inputs. This task does not introduce another tax, ETF or amortization model.

## Financial definitions

For each year `t`:

- **Own-home market value** = `sim.rows[t].homeEquity + sim.rows[t].mortgage`.
- **Own-home debt** = `sim.rows[t].mortgage`; **home equity** = value minus debt.
- **Rental value** = `rent.rows[t-1].homeVal` (for t≥1); opening value is the sum of selected rental purchase prices.
- **Rental debt** = `rent.rows[t-1].debt` (for t≥1); opening debt sums rental purchase price less down payment.
- **Rental equity** = rental value minus rental debt. This can be negative.
- **ETF holdings** = `sim.rows[t].portfolio`, **after any modeled share sales**; **not** ETF liquidation value net of German taxes.
- **Cash** = `householdCashProjection[t-1].balance`; at year 0, the editable cash-reserve assumption is used. This can be negative; it is not a verified bank balance.
- **Signed net position** = home equity + rental equity + ETF holdings + signed cash.
- **Gross positive assets** = own-home value + rental value + ETFs + positive cash; outstanding property loans are shown separately. Negative cash reduces net position without being represented as a positive asset.
- **Property debt** = own-home mortgage + total rental mortgages. It is **already** deducted when equity is calculated. Do not subtract it twice.

### Two chart interpretations

**Equity view** stacks positive home equity, rental equity, ETFs, and positive cash. Negative equity/cash does not enter the positive stack, but does affect the signed net-position line; an explicit warning identifies when this applies.

**Gross assets & debt view** stacks gross own-home and rental market values, ETF holdings, and positive cash. Property debt appears as a separate dashed line, not as a negative share of equity. The same signed net-position line remains for accurate comparison.

The chart does not currently offer an after-tax liquidation toggle because a validated ETF disposal/advance-tax, lot-accounting, and property-selling tax/cost engine is not yet integrated into the live planner. The figures must not be presented as realized or verified financial wealth.

## Interaction and accessibility

- The chart includes a point for **every modeled year**, including year 0 (the opening/purchase position).
- Range switch filters the *visualization* to the first 5/10/20/30 years or all modeled years; it never changes the calculator's investment horizon or saved scenarios.
- Hover, keyboard focus, Enter/Space or click on a year marker shows a fully textual breakdown; selection is kept within the active range.
- A semantic table provides every component for every year, including **negative balances and the two property loan categories**. Rows can be focused and selected via keyboard.
- Color-coded layers have textual legend entries; debt is visually distinguished with a dashed line. Users are never required to interpret colors to understand the totals.
- The chart canvas is horizontally scrollable on mobile; the table is an explicit alternative and is preserved for print as far as the surrounding report print rules permit.
- All calculations run locally; no third-party charting library, external account data or analytics call is added.

## Testing

Browser regression tests verify annual row count, signed decomposition, nonnegative loan balances, gross-vs-equity controls, range selection without changing source inputs, negative-cash preservation and warning, ETF-only zero-debt setup, and mobile keyboard/table access. Confirm no regressions to all seven investment strategies and saved plans.

Manual acceptance: compare year 0 and final-year net-position values against the existing Overview/financial projection, check light/dark, zoom at 200%, mobile widths 320 and 375px, and screen-reader descriptions.

Tracks [ImmoPilot UX roadmap #93](https://github.com/Akshat4112/immopilot-de/issues/93). Dependency: UX-020 through UX-025 merged to `main`.
