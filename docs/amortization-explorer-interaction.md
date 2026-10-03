# Amortization explorer interaction contract

**Scope:** Original implementation tracker PF-005.1 — Define the amortization explorer interaction  
**Contract version:** 1.0.0  
**Status:** Interaction contract merged in PR #62; implementation proceeds in the original task sequence

The original tracker uses PF-005.1–PF-005.8 for the amortization explorer. The repository's
`version-1-release-contract.md` reuses PF-005.1–PF-005.7 for release readiness; the reconciled tracker
records that release sequence as RC-001–RC-007. This document addresses the original amortization
scope and does not change the release gates or mark the explorer implemented.

## Starting point and entry

The financing page already has a collapsed, bilingual monthly table through Zinsbindung in
`AmortizationBreakdown`. The domain engine already returns full monthly schedules, opening and closing
balances, capped additional principal and projected payoff. The explorer extends this disclosure in
the same location. It consumes domain results and does not calculate a second loan schedule.

The explorer remains collapsed until explicitly opened. Its introduction states that loan month 1
means the first monthly payment; no calendar start date is collected or inferred. Cash purchases show
a short “No mortgage schedule for a cash purchase” explanation rather than an empty loan table.

## Controls and default state

| Control    | Default                                           | Choices and behavior                                                                                                                                                                                    |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Horizon    | Fixed-interest period                             | Zinsbindung or full projected repayment. Zinsbindung uses exactly the selected fixed-interest month count. Full repayment uses the later payoff month of the available baseline and selected schedules. |
| Detail     | Annual                                            | Annual loan-year aggregates or monthly detail; the horizon remains the same when switching.                                                                                                             |
| Schedule   | Both, when a valid non-zero repayment plan exists | Baseline only, with additional repayments only, or both. Without a plan, show one baseline schedule and explain that there is no additional-repayment difference.                                       |
| Table page | First page                                        | At most 24 period rows per schedule per page, with previous/next controls, visible period range and total page count. No infinite scroll is required.                                                   |

Use native, labelled radio groups for horizon, detail and schedule. Opening the disclosure reveals all
controls; none requires a hover or a gesture. Settings are view state only, never scenario inputs,
stored results or share-link parameters. Changing an input recalculates from the existing workspace,
keeps a still-valid view choice, and resets pagination to page 1. Switching horizon/detail also resets
the page. A language change preserves the view and formats the same cents/months in the new locale.

When a plan is removed, fall back to the baseline view. If a plan becomes invalid, show the baseline
as a clearly labelled reference and explain that the additional-repayment schedule is unavailable;
never imply that this baseline is the selected outcome. Disable the unavailable schedule choice.
If the baseline itself fails, show the domain failure guidance and no numeric table or chart.

## Horizon, alignment and projection boundary

- Fixed-period detail includes actual rows through `min(payoffMonth, fixedInterestMonths)`. If payoff
  occurs first, show its final capped row and explain that debt is zero at the fixed-period end.
  Do not invent payment rows after payoff to fill the interval.
- Full repayment includes actual rows through payoff for each schedule. In the “both” view, use the
  same loan-month axis for the two schedules. Their independent payoff months remain visible.
- A full-horizon chart can keep a repaid balance at zero until the common axis ends; such points are
  presentation of an already repaid loan, not additional payment/interest rows or additional savings.
- Mark Zinsbindung's end at its exact loan month. If it lies beyond the displayed payoff horizon,
  state that the loan is repaid before Zinsbindung ends instead of moving the marker into the chart.
- Every full-repayment view and every lifetime/payoff summary carries **Projektion bei konstantem
  Sollzins** / **Constant-rate projection**: the initial nominal rate continues beyond Zinsbindung;
  no future lender rate or contractual maturity is predicted. A full view paid off within the fixed
  period explicitly notes that no displayed payment lies beyond that period.
- Annual buckets that straddle the boundary retain their actual totals and identify the fixed-period
  endpoint month in the caption. They must not relabel a mixed bucket wholly as contractual-period
  interest. Fixed-period summaries still come from the domain's exact monthly cutoff.

## Table columns and annual aggregation

Each displayed schedule has a caption and table heading identifying its basis and horizon. In the
“both” view, render separately captioned tables with common view controls; baseline and selected
schedule columns must never silently mix.

| Column               | Monthly value              | Annual loan-year value                                             |
| -------------------- | -------------------------- | ------------------------------------------------------------------ |
| Period               | Loan month number          | Loan year and included month range, e.g. year 2, months 13–24      |
| Opening debt         | `openingBalanceCents`      | Opening balance of the first included row                          |
| Regular payment      | `regularPaymentCents`      | Sum of actual regular payments, including any capped final payment |
| Interest             | `interestCents`            | Sum of included monthly interest                                   |
| Scheduled principal  | `scheduledPrincipalCents`  | Sum of included scheduled principal                                |
| Additional principal | `additionalPrincipalCents` | Sum of actual, capped additional principal                         |
| Total payment        | `totalPaymentCents`        | Sum of included actual total payments                              |
| Closing debt         | `closingBalanceCents`      | Closing balance of the last included row                           |

Annual buckets are loan months 1–12, 13–24 and so on, not calendar years. A partial final bucket shows
its actual month range. Opening and closing balances are endpoint stocks and must never be summed.
Aggregate integer cents without intermediate euro rounding, using the shared safe-money helpers.
Format only at rendering; no formatted string is parsed back into calculations. On each monthly or
annual row, opening minus scheduled and additional principal equals closing debt, and regular plus
additional principal equals total payment. Pagination does not affect totals, summaries or charts.

The table remains available without charts. Summaries identify their period and own-scenario baseline
as defined in `sondertilgung-product-contract.md`; a full-horizon selection must not replace the
fixed-period savings with lifetime savings under the same label.

## Chart handoff

The later chart tasks use the same schedules, horizon and period selectors as the tables:

| Chart               | Data and units                                                                             | Required distinctions                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remaining debt      | Closing debt in euros on a loan-month axis; include month 0 opening principal              | Baseline and selected paths have labelled solid/dashed strokes and distinct point shapes; mark fixed-period end and each payoff.                                       |
| Payment composition | Included period totals in euros for interest, scheduled principal and additional principal | Compare aligned loan periods; legend identifies each component with labels/patterns. Regular payment excludes additional principal; stack height equals total payment. |

Annual balance points use each bucket's closing debt, not an average or sum. Charts use all periods in
the selected horizon even when the table is on a later page. Keyboard focus and pointer inspection
show the same labelled loan period and exact formatted amounts. The equivalent data tables stay
available; selecting a chart point must not be required to retrieve a financial value. Hover must not
be the only way to inspect data. Animation is optional and disabled under reduced motion.

## Responsive and accessible interaction

At 360, 390, 768, 1024 and 1440 pixels, controls wrap within the page. Each wide table/chart sits in
its own labelled, focusable scrolling region; the document itself must not overflow horizontally.
On mobile, tables stack with their captions, schedule choice and period-range text still visible.
Native table semantics, column/row headers, visible keyboard focus and non-colour basis markers are
required. Arrow keys in radio groups and ordinary tab order work without a custom keyboard trap.
Pagination controls announce the active range without moving focus unexpectedly. Changing view must
not recreate every financial value as a live announcement. In print, expose the selected view's basis,
units, boundary warning and complete period data rather than printing only the current page.

## Acceptance and implementation handoff

This interaction task is complete after review when the default controls, horizon rules, table
columns, aggregation, chart units and mobile behavior above are unambiguous. It introduces no new
input schema, domain formula, persistence, lender constraint or release approval.

| Original tracker task | Implementation scope                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| PF-005.2              | Render opening debt and all actual payment periods, handle schedule availability and cash purchase, paginate the tables. |
| PF-005.3              | Add annual/monthly aggregation, horizon and schedule controls, common period basis and boundary labels.                  |
| PF-005.4              | Remaining-debt chart, fixed-period marker, baseline/selected alignment and payoff endpoints.                             |
| PF-005.5              | Payment-composition chart with exact period totals and component distinctions.                                           |
| PF-005.6              | Keyboard inspection, equivalent data views, contrast, focus and reduced-motion verification.                             |
| PF-005.7              | Reviewed DE/EN terms, partial-period captions, print and responsive polish.                                              |
| PF-005.8              | Unit, component and browser coverage for the completed explorer.                                                         |

Required regression cases include the approved 348-month baseline and 203-month annual €5,000 plan,
fixed-period month 120 versus a payment at month 121, a capped month-1 payoff, a partial final loan
year, zero-interest repayment, the 1,200-month limit, invalid/incomplete repayment plans, unavailable
baseline, cash purchase, removing a plan and equivalent German/English amounts. Verify annual sums
against the monthly cents and endpoint balances, page transitions, input recalculation, bilingual view
state and mobile keyboard access. Chart tests additionally inspect boundary/endpoint placement and
the accessible table equivalent. Existing fixed-period browser journeys must remain usable.

The interaction proposal does not claim those later implementation or QA tasks have passed. The
Version 1 release candidate must refresh affected evidence after the explorer is implemented.

## PF-005.2 implementation milestone

PF-005.2 extends the existing disclosure with complete monthly baseline and selected schedules,
opening debt, 24-row pagination, exact fixed-period/payoff markers and explicit cash/unavailable
states. Input revisions reset each table to page 1; a presentation-language change preserves its page.
Only actual domain rows are rendered, and each schedule stops at its own payoff. The original
contractual payment and financial calculation engine are unchanged.

At this milestone, the paginated tables expose the full monthly repayment horizon. The approved
fixed-period annual default, annual aggregation and horizon/schedule selectors are the next
PF-005.3 implementation. Charts and chart accessibility remain PF-005.4–PF-005.6; complete print and
bilingual polish remain PF-005.7. This milestone does not close those tasks or the release gate.

## PF-005.3 implementation milestone

The explorer now defaults to annual detail within Zinsbindung. Shared native radio groups choose
the fixed-interest or full projected repayment horizon, annual or monthly detail, and the baseline,
additional-repayment schedule or both. A valid plan defaults to both schedules. An absent, removed
or invalid plan falls back to the baseline and disables the unavailable choices; invalid plans retain
the explicit reference warning.

Annual rows sum actual integer-cent payment flows with the shared safe-money helpers. Opening and
closing debt come from the first and last included monthly rows. Fixed-interest detail is cut at
the exact boundary before grouping into loan years. Partial years expose their actual month range;
full-view years crossing a boundary identify the exact month and their mixed period basis. No rows
are created after payoff. Full views share the later available payoff horizon while each table ends
at its own payoff.

View settings remain transient and persist across language changes and closing/reopening the
disclosure. Input and control changes reset pagination. Removing or invalidating a selected plan
falls back to the baseline; repairing the plan enables its choices without silently reselecting it.
Financial summaries, mortgage formulas and saved-scenario/share schemas remain unchanged.

Charts, chart-specific accessibility, complete print behavior and final explorer QA remain the
separate PF-005.4–PF-005.8 milestones.

## PF-005.4 implementation milestone

The remaining-debt chart consumes the existing available domain schedules and the shared horizon,
detail and schedule controls. Month 0 is the opening principal; later points are actual closing debt.
Annual detail uses loan-year endpoints, with exact fixed-interest and payoff months added for alignment.
The tables remain independent and available below the chart; pagination never changes chart data.

Baseline paths are solid with circles; additional-repayment paths are dashed with diamonds. An exact
vertical marker identifies Zinsbindung, and a hatched region identifies the constant-rate projection.
Payoff points and their exact months are labelled. Full views retain the common available horizon;
repaid balances stay at zero as presentation only, without creating payment, interest or savings rows.
A fixed view paid off before Zinsbindung ends at the last displayed payoff and explains why the
fixed-period marker lies outside the chart. Cash purchases and unavailable baselines show no chart;
invalid selected plans preserve the baseline-reference warning and one baseline path.

A labelled native month selector inspects exact formatted balances using pointer or keyboard input.
It includes month-zero principal and identifies already repaid zero balances. Locale changes retain
inspection; input/control changes reset it. The chart uses a focusable local scroll region at narrow
widths and has no animation. No charting runtime, input schema or mortgage formula is added.

Payment composition remains PF-005.5; the complete chart-accessibility review, bilingual/print polish
and final explorer QA remain PF-005.6–PF-005.8. This milestone does not close those tasks or release gates.
