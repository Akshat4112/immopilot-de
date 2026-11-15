# UX-030 — Rental cash-flow waterfall

## Purpose

Replace the simple first-year combined rental bridge in **Visual Insights** with an interactive waterfall, without creating a second rental finance or tax model. The waterfall is available under Overview and Properties. It supports **all rental apartments** or **one selected apartment**, any modeled **year 1–40**, **monthly/annualized** presentation, and an accessible signed reconciliation table.

The calculation begins with the exact rows from `rentalPortfolio(x,tax)`:

- For the entire rental portfolio: `rent.rows[year-1]` provides exact `cash`, `deltaTax`, `afterTax` and `collected`.
- For one property: `rent.perProperty[i].years[year-1]` provides `cash`, `collected`, `operating`, `payment`, `interest`, `principal`, etc. The tax value is calculated using the same existing `annualRentalTaxDelta` function for that property's ownership allocation and taxable income, including modeled one-time eligible maintenance for the chosen year.
- **Selected-property tax is standalone**: it means the estimated household tax difference *if that one apartment were rented*, not the marginal tax effect attributable to that property within a portfolio. It must not be summed to reconstruct portfolio tax, due to nonlinearity of German income tax.

## Reconciliation

Annual waterfall moves:

| Movement | Derivation |
|---|---|
| Scheduled cold rent | `kalt × 12 × (1 + rentGrowth)^(year-1)` |
| Tenant Nebenkosten advances | `tenantNk × 12 × (1 + rentGrowth)^(year-1)` |
| Vacancy loss | Negative combined scheduled receipts × `vacancy / 100` |
| Recoverable owner operating costs | Negative `recoverCost × 12 × (1 + costGrowth)^(year-1)` |
| Nonrecoverable owner costs | Negative `nonrecover × 12 × (1 + costGrowth)^(year-1)` |
| WEG reserve contributions | Negative `reserve × 12 × (1 + costGrowth)^(year-1)` |
| Recurring repairs | Negative `repairs × 12 × (1 + costGrowth)^(year-1)` |
| Mortgage interest paid in cash | Negative `min(accrued interest, scheduled payment)` **per rental** |
| Mortgage principal paid | Negative `max(0, scheduled payment − mortgage interest paid in cash)` per rental |
| Tax effect | Negative `deltaTax`; a modeled annual tax saving is a positive bridge |
| Final after-tax recurring cash | Exact `afterTax = cash − deltaTax` from source ledger |

Two reconciliation guards are required. The scheduled rent less vacancy must equal `collected` (within €0.05). The sum of cash expenses, receipts and payments must equal the **existing** pre-tax rental cash calculation. If the source engine deviates, a **clearly labeled ledger adjustment step** is shown; the chart carries a warning and `data-waterfall-balanced="false"`. The plotted final total is not silently "corrected" by changing the rental cash model.

For cases where accrued mortgage interest exceeds actual scheduled payment, the waterfall splits **only paid cash**: interest covered by the payment and principal actually repaid. Unpaid accrued interest is not portrayed as cash spent. The source rental model may assume a simplified (non-capitalizing) loan in such an underpayment; a prominent warning is shown. The separate Mortgage Explorer highlights related amortization issues.

## Interpretation

**Cash flow is not taxable profit or total wealth creation.**

- Nebenkosten advances are tenant **receipts**. Related recoverable expenses are property **cash outflows**. Do not describe advances as additional cold rental yield.
- Mortgage principal is a cash outflow and builds equity by lowering debt, but is **not** a deductible rental expense.
- WEG reserves are funded in cash; tax deductibility generally arises when qualifying expenses are actually paid.
- AfA depreciation changes modeled taxable profit but is not a recurring cash payment; it is deliberately **not** drawn as a cash waterfall bar.
- Property market appreciation and principal repayment can increase equity, but do not add spendable rental cash. Upfront deposits, purchase costs, renovation and acquisition-year cash are tracked elsewhere, not recurring cash waterfall flows.
- The household rental tax result is an **annual 2026-rule illustration**. A positive cash benefit from estimated tax relief is economic, **not proof of a monthly tax refund**; actual timing and allowance depend on the Finanzamt assessment. The cash/accrual household budgeting mode affects timing in the broader app, not this economic after-tax waterfall.
- Each year is a **full calendar-year model**, even if a property has a partial-year AfA start date. Date-specific rent proration is not modeled; the existing results warn about that.

## Interaction and accessibility

- Scope select: all rental apartments or a specific configured rental, with safe text-escaped property names; automatically resets to 'All' if a selected apartment is removed.
- Year select: `1 … x.years`; the selected year is clamped if the calculator's horizon is shortened.
- Monthly/annual selector: display is exactly `annual amount / 12` or the annual amount. Tax is always marked as an estimate; changing this selector does not change stored source inputs or results.
- Chart/table selector: mobile viewport starts with the accessible table. Waterfall SVG shows zero and signed negative running balances, connector lines and a final result column; tab-focusable component bars have descriptions. The HTML table lists each movement, running balance and explanation, with exact signed data attributes for testing.
- Source status attributes: `data-waterfall-status`, `data-waterfall-balanced`, `data-waterfall-collected`, `data-waterfall-before`, `data-waterfall-tax`, `data-waterfall-after`, and `data-waterfall-source`. Table rows expose unrounded annual `data-waterfall-value` and `data-waterfall-running` attributes for exact reconciliation tests.

No third-party visualization library, database, network request, source tax change or new scenario storage format is introduced.

## Regression acceptance

1. Full-portfolio year 1 components sum to `rent.first.afterTax` and reconcile `rent.first.cash − rent.first.deltaTax`.
2. Tenant advances, vacancy, recoverable costs, nonrecoverable costs, reserves, repairs, interest-paid and principal-paid appear as separate steps.
3. Monthly/annual unit change is a 12× display transformation, without changing rental inputs, income-tax estimates, the planning horizon or the planner.
4. Scope and year selection work; a selected property shows a **standalone** tax warning. A second rental increases all-properties collected income, while the first property's view remains unchanged; removed properties revert gracefully.
5. Switching household tax-timing mode does not change annual rental *economic* after-tax cash.
6. ETF-only / no-rental strategy shows a helpful empty state with no phantom receipts.
7. Narrow mobile viewport defaults to an accessible data table; keyboard step focus updates the explanation and switching to the chart works.

Tracks [ImmoPilot UX roadmap #93](https://github.com/Akshat4112/immopilot-de/issues/93). Next is UX-031 ETF tax visualizations.
