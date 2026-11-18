# UX-027 — Financial Life-Event Timeline

## Goal

Allow a household to enter **year-specific hypothetical events** and compare its current plan's yearly *signed net position* with an event-adjusted result. This is a **what-if overlay**, not a replacement for the user's canonical baseline. The main Dashboard, the Wealth Timeline, rental analyses and the saved-scenario summary continue showing the original inputs; the new event panel shows baseline and event-adjusted values side by side.

## Events supported in this release

| Event | Form semantics | Effect on projections |
|---|---|---|
| Spendable net salary change | Signed € per month from selected year onward | Added to the annual cash projection **after** existing annual net-income growth. No new German payroll or annual income-tax assessment is inferred. |
| First-person ETF contribution change | Signed € per month from selected year onward | Changes first person's monthly fund purchases in `simulate` (including compounding, ETF withdrawals/capital gains when active) and removes/adds the same cash from the annual household budget. Contributions floor at €0. Not applicable when ETF strategy is disabled. |
| Own-home mortgage rate change | Replacement annual interest percentage from selected year onward | Changes the existing home loan's monthly interest and amortization in the same underlying `simulate` amortization loop, keeping entered monthly payment unchanged. **This assumes a legally and contractually possible refinancing** and does not guarantee that the lender permits the timing, or that payments still cover interest. It does not refinance separate rental mortgages. |
| One-time expense | Nonnegative € in selected year | Deducted from modeled household cash exactly once, without creating an asset or altering mortgage amortization. |
| Property purchase milestone | Named marker, annotation-only | Draws a vertical event marker and displays its name, **without** creating hypothetical property equity, rent, fees or debt. Delayed acquisition is not supported by the current combined housing/rental tax engine. Use the Property section to calculate a purchase **at the beginning** of a scenario. |

All events use integer projection years 1–40. A year's recurring changes take effect at the **start** of that modeled year; one-time costs affect that year's cash. Event order is deterministic: multiple monthly changes accumulate, while later-year rate changes supersede earlier ones. No effect is extrapolated beyond the selected projection horizon.

## Financial reconciliation

For every year `y`, both the baseline and event plan reuse:

- `simulate(x, events)`, which now accepts an **optional default-empty events argument**. When empty, it follows the existing model exactly.
- `householdCashProjection(x, tax, sim, rent, events)` with optional events and actual simulated annual ETF contribution totals and loan payments.
- **Unmodified** `rent.rows`, including rent, property prices, mortgage debts and estimated rental tax effect. This panel explicitly does not re-estimate future rental tax or acquire additional rentals at later dates.

The value compared each year is:

```
Net(y) = Home equity(y)
       + Selected rental equity(y)
       + ETF portfolio value(y) after modeled withdrawals
       + Signed modeled cash reserves(y)
Delta(y) = Net_with_events(y) - Net_baseline(y)
```

If a salary increase adds €500/month from year 3, the delta in year 3 is €6,000, assuming no other events. A €12,000 one-time cost in year 2 changes that year's cash and net position by **−€12,000**, carried forward unless offset by other events. An annotation-only milestone has zero financial impact.

Amounts are not inflation-adjusted or after-liquidation values; they exclude taxes on unrealized ETF gains, property selling costs, unknown income-tax changes from future gross salaries, unmodeled liabilities and delayed property acquisition.

## Persistence and compatibility

- Events are saved inside the **existing** working planner snapshot under optional `lifeEvents`, rather than in a disconnected browser key.
- Saving a named scenario, comparing its dirty state, loading it, one-step undo and JSON export/import preserve the events. Old v1/v2 scenario backups without events remain supported.
- Imported event lists are validated: maximum 15; allowed event types; bounded finite numeric amounts; integer year 1–40; safe ID and 60-character label. Invalid events reject the backup. On local storage load, malformed events are dropped rather than evaluated.
- Deleting or adding an event triggers the canonical planner render and the existing saved-plan dirty tracker.
- Resetting the calculator clears events with other inputs.

## Accessibility and UI

- Goal-first form with explicit event type, year, numerical amount, optional name and add action.
- Visually ordered, individually removable event chips, with accessible Remove labels.
- Baseline and event-adjusted net-position polylines, vertical event markers, clickable/focusable annual nodes with per-year detail.
- A full annual HTML table of baseline, adjusted position, signed difference and event names.
- Horizontal mobile scrolling, text descriptions, live warning for unavailable or annotation-only events.
- All content stays local: no third-party chart package, remote calls or account connection.

## Tests

Playwright acceptance checks:

1. Empty list leaves every year identical to baseline.
2. €500/month net salary change beginning year 3 produces no difference in year 2 and +€6,000 at year 3.
3. ETF purchases and home-loan refinancing alter only applicable future years and cannot change past projection rows.
4. €12,000 one-time expense reduces net cash by €12,000; deletion restores baseline.
5. Property milestone draws a marker but makes no financial changes, with prominent annotation warning.
6. Event survives page reload and saved scenario load; undo restores the previous unsaved event state.
7. Mobile can add/remove events and focus the annual chart.

Before release verify current financial formulas and existing seven strategies are unchanged with no events; validate desktop/mobile and dark mode, and check all CI, Playwright and GitHub Pages deployment gates.

Tracks [UX backlog issue #93](https://github.com/Akshat4112/immopilot-de/issues/93).

## Deferred

- Actual delayed home/rental acquisitions, ownership dates, vacancy shifts, mortgage product fees and contract amendments.
- Recalculating future payslip tax classes, allowances or annual income tax for salary events.
- Arbitrary new property/rental cash flow streams starting at a future year.
- Integration of unmerged ETF advance-tax projection work (ETF-001/002).
