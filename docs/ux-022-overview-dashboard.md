# UX-022 — Wealth Planner Overview dashboard

## Reconciliation contract

This task introduces a **presentation-only** Overview dashboard. It calls `renderOverviewDashboard(x,sim,rent,c,projectedCash)` with the **same objects** already created by the canonical Household Wealth Planner render function. No financial formulas, scenario schemas or stored browser values are changed.

The four KPI cards show:
1. **Monthly cash left**: `c.free`, after household cost, mortgage, other debt, planned ETF contributions, cash savings transfers and selected rental/tax cash timing; negative values remain negative.
2. **ETF value today**: `x.start`, zero when ETF strategy is inactive.
3. **Property equity at purchase / now**: `(x.price - x.loan)` for a modeled new/owned home plus `Σ(property.price - property.loan)` for selected rentals. The current renter case is zero. Planned purchases are **not** described as assets already owned. Loan balances are subtracted.
4. **Projected wealth position**: final-year `sim.last.homeEquity + sim.last.portfolio + rent.rows.at(-1).equity + projectedCash.at(-1).balance`. Uses signed cash and equity, **not** a post-tax liquidation value.

## Visual information
- Monthly allocation bars use existing `c.housing + x.extra/12`, `c.living + c.otherDebt`, `c.invested`, `c.monthlySaving`, and nonnegative `c.free`, and display each amount in EUR. Available cash `c.net + c.sold + c.rentalCash - c.taxProvision` accounts for rental receipts, ETF sales and optional tax provision; negative free cash is **reported** as a deficit, not converted to a positive bar.
- Starting investment composition compares positive ETF, own-home and rental equity separately. Negative equity remains visible as a signed value with a warning and zero positive-width bar. Bars indicate relative magnitude, not a guaranteed allocation or verified net-worth statement.
- Two contextual buttons jump to Household, Compare and Investments. They change only visible tabs.
- Every financial bar has an accessible label with its exact displayed euro value; values remain text if CSS/graphics are unavailable.

## Limitations
- Planned purchases, future asset prices, loan amortization and cash reserves are modeled assumptions.
- The cash reserve input is a **target**, not a confirmed bank account balance.
- Projected cash may be negative, representing a shortfall rather than spendable money.
- The long-term sum excludes possible ETF realization tax on holdings, property sale fees/taxes and unmodeled assets/liabilities. It is not a live bank-linked total and should **not** be called verified net worth.
- ETF-001/002 tax work remains in separate unmerged PRs; no speculative after-tax precision is introduced here.

## Verification
- Playwright: Overview money equals the existing KPI models and responds to horizon changes.
- All seven investment modes remain available (the existing suite also tests them).
- ETF-only renders zero modeled property purchase equity; inactive ETFs show zero.
- Negative free cash stays signed and receives a visible funding-gap explanation.
- Responsive cards are checked at 375px, alongside the UX-021 goal selector.
- Manual review before release: light/dark, 320/375/768/1024/1440 widths, 200% zoom, chart/tab keyboard navigation, print, English/German coverage and local saved scenario persistence.

Dependency chain: UX-020 PR #94 → UX-021 PR #95 → UX-022 (this branch/PR).

Tracks https://github.com/Akshat4112/immopilot-de/issues/93.
