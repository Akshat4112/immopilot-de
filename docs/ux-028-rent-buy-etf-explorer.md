# UX-028 — Own-home rent vs buy vs ETF explorer

## Purpose

Compare three **mutually exclusive choices** for the same hypothetical self-used home and the same opening cash and annual spending-and-saving budget:

1. **Buy own home now**, starting with the modeled purchase price, mortgage, deposit and transaction fees. Any annual housing-budget saving is invested in ETFs; net position is property equity + sidecar ETF holdings.
2. **Continue renting + invest in ETFs**, starting with the **identical cash amount** that would otherwise be committed to the home deposit and buyer fees. Invest any lower annual housing outlay into ETFs as well.
3. **Continue renting + hold cash**, starting with that same acquisition cash and accumulating lower housing outlays without interest.

This is deliberately separate from the existing **rental property investment vs ETF** comparison. It is an incremental, isolated housing choice. **Common household salary, living expenses, existing ETF portfolio and selected rental investments are omitted from all three paths** rather than counted on only one side. The original main-application scenarios, calculations, tax engines, and saved projections remain unchanged. The panel works even when the user's active scenario is ETF-only, rent-only or a mixed strategy; it reads the *raw new-home form assumptions* for a hypothetical purchase.

## Matched starting capital

Use the new home inputs in the Properties section, regardless of active strategy:

```
Home mortgage = purchase price - deposit
Purchase fees = purchase price × purchase-cost percentage
Matched initial cash = deposit + purchase fees
Buy path opening net = home equity at purchase = deposit
Rent + ETF opening net = matched initial cash
Rent + cash opening net = matched initial cash
```

The buyer's fees disappear from financial net position on purchase; they are **not** an appreciating or recoverable asset. The renter does not pay the buyer's fees and can invest/retain that money. This matches the *cash outlay*, not the initial wealth amount, as intended. The new comparison input **Warm rent alternative** is independent of the active living arrangement and can be adjusted without changing the current budget. Annual rental growth is also configurable.

When available modeled capital **after** emergency cash and existing starting ETF allocations is smaller than the acquisition cash, a warning appears; the hypothetical graph remains available for exploration. Actual affordability (and other rental purchase requirements) must be checked in the main Household tab.

## Equal housing-and-savings budget

For every year `y`:

```
Buy housing outgo(y) =
  existing simulated own-home mortgage payments(y)
  + voluntary mortgage prepayments(y)
  + 12 × owner costs × (1 + expense growth)^(y−1)

Rent housing outgo(y) =
  12 × alternative warm rent × (1 + alternative rent growth)^(y−1)

Shared budget(y) = max(Buy housing outgo(y), Rent housing outgo(y))

Buy ETF surplus(y) = Shared budget(y) - Buy housing outgo(y)
Rent ETF/cash surplus(y) = Shared budget(y) - Rent housing outgo(y)
```

Every path spends **exactly the same total amount** each year on housing + saving. The positive difference is transferred into the alternative's ETF balance or cash, rather than disappearing. The buy mortgage is taken from the **existing** `simulate()` yearly amortization outputs, with its fixed-rate period, rate change, extra repayments and annual home appreciation; no independent loan calculator is introduced.

ETF savings accumulate with monthly compounding using the model's expected return after TER, and the same year-one negative crash assumption if selected. The rental **cash-holding** alternative earns no interest. The initial hypothetical ETF starting amount is separate from the household's existing ETF holdings.

### Metrics

- **Net wealth:** home equity + invested buy-side surplus; rent-side ETF capital + gains; or renter's cash.
- **Housing cash paid:** cumulative mortgage debt-service cash + owner operating costs versus cumulative warm rent. Mortgage principal **is included** here as a payment even though it builds equity.
- **Nonrecoverable housing costs:** buy-side acquisition fees + homeowner operating costs + accrued mortgage interest versus cumulative warm rent. Mortgage principal is **not** included in irrecoverable costs; unpaid/capitalized interest still counts as an economic financing cost.
- Every year from **0 to the user's projection horizon** is available as an interactive point, in the alternative year table, and in the signed-value plot. Optional 5/10/20/30-year viewing filters change only the comparison display, not the saved plan's horizon.
- The table exposes common-budget and savings identities using data attributes for automated numerical regression testing.

## Financial limits / disclosure

- Results are **marked to market before liquidation**. Property sale costs, any property gains tax, and ETF capital gains tax or advance-tax treatment are **not** deducted from the plotted wealth. No assertion is made that forecast ETF growth is spendable income.
- No rental portfolio or existing owned home is sold or altered; compare other combinations in the original planner.
- The ETF sidecars are hypothetical incremental allocations. The selected household's other existing ETF contributions, optional withdrawals and income-tax effects are **not** transferred to these isolated alternatives.
- A zero or implausible rent assumption is flagged. Insufficient mortgage amortization is flagged. Home valuation changes and ETF returns are assumptions rather than guaranteed outcomes.
- A negative marked-to-market position is displayed below zero; chart values are not silently clipped to positive figures.
- Annual housing budget can increase or decrease with the assumptions; comparing wealth also requires checking the expense and nonrecoverable-cost views.
- This is not a lender underwriting model, cash balance verified with a bank, investment advice or German tax return calculation.

## UX and access

Three final-year KPIs, editable rent and rent-growth inputs, year range selector, three metric views, semantic annual detail table, interactive SVG chart with accessible per-year focus/selection, and desktop/mobile responsive layout. Narrow screens open the table view by default. All calculations and data remain local, with no third-party scripts or backend added.

## Acceptance

1. Default €200,000 home, 0 deposit and 10% buyer fees implies a **€20,000 matched opening cash**. Buying starts with €0 home equity and renting starts with €20,000 of ETF/cash, rather than falsely equating opening equity.
2. Each year: buy housing outgo + buy ETF surplus **equals** the rent housing outgo + renter's ETF or cash surplus.
3. Changing warm rent or rent-growth impacts only the decision alternatives; neither current home price nor active housing rent is silently altered. New assumptions survive refresh and named scenario backup/load via existing field storage.
4. Zero ETF returns + zero TER imply rent-plus-ETF and rent-plus-cash totals coincide (monthly savings and initial cash are identical).
5. Negative appreciation resulting in negative home equity is shown as a signed negative net figure.
6. ETF-only current strategy still supports a hypothetical home purchase, and gives a scope warning.
7. Mobile starts in accessible table view; chart/time-period/metric toggles work without changing the main investment horizon.
8. Formatting, lint, TypeScript, unit tests, production build and Playwright are green before release; verify 320/375/768/1024/1440px, keyboard, dark theme, zoom and print.

Tracks [UX roadmap #93](https://github.com/Akshat4112/immopilot-de/issues/93).
