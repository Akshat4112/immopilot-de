# UX-025 — Reconciled household cash-flow Sankey

## Core principle

The diagram is a view of the **existing** `familyMonthly(x, sim, tax, rent)` cash ledger. It does not calculate another version of household income, rental tax, or loan amortization. The source components sum exactly to the allocations, with the current free-cash value represented as a positive allocation when nonnegative, or a **funding-gap source** when the budget is negative.

```
Net household cash + ETF share-sales proceeds + net rental receipts - optional rental tax provision
= home operating/rent costs + mortgage interest + mortgage principal + extra repayments
  + living costs + other debt payments + ETF contributions + cash savings + residual cash.
```

### Modeling details
- Household **take-home** is the input, not gross pay; payroll taxes/social charges were already applied by the salary engine. No double-counted tax stream is drawn.
- ETF sales are inflows of existing investment principal/value, **not salary**.
- Mortgage debt service is decomposed from `c.housing - x.owner` into the current month's interest `min(payment, loan × rate / 1200)` and paid principal. Voluntary `x.extra / 12` is added to debt reduction, not living expenses.
- Rent and owner operating costs are distinct from mortgage amortization.
- Other debt payments are kept as one modeled bucket; the current engine does not support splitting their interest and principal.
- Rental `c.rentalCash` can be either receipts (source) or a deficit (allocation). The separate `c.taxProvision` can be a positive provision (allocation) or timing credit (source).
- Positive free cash is an allocation; **negative free cash** is an explicitly labeled, non-income funding-gap source.
- Signed and zero values are not silently converted to positive ribbons. Values under €0.00001 are omitted solely as numerical noise. A discrepancy above that level blocks the diagram and displays a warning with a table.
- The central node pools household cash. Ribbons **do not claim** that a particular euro of salary funds a specific expense.

## Accessibility and interaction
- The Sankey runs as an isolated inline JavaScript module inside the existing generated standalone `public/wealth-planner.html` artifact. It does not fetch additional scripts, libraries, account data or analytics.
- Sources and allocations form two banks, joined through pooled cash. Ribbons are proportional to **positive** flow values, contain text labels/amounts and SVG titles, and respond to pointer, click, keyboard focus, Enter and Space. The detail description below the chart gives a full explanation.
- Diagram/Table switch; the semantic HTML detail table is the default at viewport widths 600px or below. The desktop chart can be scrolled horizontally and is keyboard focusable.
- Monthly vs Annual run-rate multiplies current monthly values by twelve; it is **not** the year-by-year projection and does not infer future income growth or rental tax settlement dates.
- Rows and total amounts remain available in the table regardless of chart visibility. `data-in`, `data-out`, and `data-balanced` on the reconciliation status enable automated accuracy checks.
- The user can switch investment configurations without losing any financial input; the same chart updates on the canonical render call.

## Test plan
1. Check two-sided Sankey total equality against the canonical household ledger.
2. Check mortgage interest and principal, ETF contributions, and allocation flow labels.
3. Check yearly run-rate equals exactly 12 × the current monthly calculation; toggling presentation does not modify inputs.
4. Set an extreme monthly expense; verify funding-gap source appears and totals remain balanced.
5. ETF-only mode removes newly purchased home mortgage flows; all three assets restore them.
6. Narrow mobile viewport defaults to a table; select a link using keyboard and verify detailed feedback.
7. Manual review on light/dark, keyboard-only, screen reader, and widths 320, 375, 768, 1024 and 1440. Validate PDF print.

## Important limitation
The chart shows a **single current-period household budget**. It is not a Sankey of lifetime wealth, audited gross-to-net German payroll calculation, or multi-year tax settlement. Rental income and tax remain hypothetical as elsewhere in the calculator; all household costs should be reviewed for double-counted utilities/heating. This task does not integrate the separate ETF Vorabpauschale draft engine.

Tracks UX-025 in [backlog issue #93](https://github.com/Akshat4112/immopilot-de/issues/93).
