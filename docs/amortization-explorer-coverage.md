# Amortization explorer coverage

**Task:** Original tracker PF-005.8

**Audited baseline:** `3692bf9a5d3e93371581ea0c801bbad5c87cbdaf`, merged PR #68

**Scope:** Complete the regression coverage defined by the [interaction contract](amortization-explorer-interaction.md).

The audit found substantial domain, presentation-model, component and browser coverage already
present. This task adds missing browser journeys for the longest supported zero-interest loan,
capped early payoff and recovery from invalid, removed and unavailable inputs. It also reconciles
every period of both chart models and the schedule model to raw monthly cents across four fixtures
and all horizon/detail combinations. Mortgage formulas, application components, localization,
scenario schemas, dependencies and deployment configuration are unchanged.

## Requirement map

| Requirement                                                             | Domain/model and component evidence                                                                                                                                        | Browser evidence                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Approved 348-month baseline and 203-month annual €5,000 plan            | `amortization-fixtures.test.ts`, `additional-repayment-fixtures.test.ts`, `AmortizationBreakdown.test.tsx`, both chart test files                                          | `app.spec.ts`: full monthly schedules, horizon/detail/basis controls, aligned debt and payment-composition journeys                                                                                                                                                            |
| Exact fixed-interest cutoff and payment at month 120 versus 121         | `calculate-fixed-period.test.ts`, `calculate-additional-repayments.test.ts`, `amortizationPeriods.test.ts`, both chart model tests; new complete accounting contract       | New `explorer-coverage.spec.ts` boundary/recovery journey verifies €6,000 at month 120 and €2,000 at month 121, with month 121 excluded from fixed-period annual totals                                                                                                        |
| Capped month-1 payoff and independent schedule ends                     | Existing schedule/chart and accessible-alternative component cases; new complete accounting contract                                                                       | New early-payoff journey verifies actual €199,666.66 additional principal, €200,583.33 total payment, zero closing debt and one actual payment row/bar                                                                                                                         |
| Zero debt after payoff is distinct from absent payments                 | `RemainingDebtChart.test.tsx`, `PaymentCompositionChart.test.tsx`, `ChartAccessibility.test.tsx`                                                                           | New early-payoff journey inspects the common month-348 horizon. Debt has a labelled zero tail; payment inspection says already repaid and supplies no fabricated payment amounts                                                                                               |
| Partial final loan year and capped final regular payment                | `amortizationPeriods.test.ts`, `AmortizationBreakdown.test.tsx`, both chart test files, `AmortizationPolish.test.tsx`                                                      | Existing 203-month partial-year/payment inspection; new long-loan journey verifies monthly €162.67 and final annual €1,996.04                                                                                                                                                  |
| Zero interest, the 1,200-month limit and bounded rendering              | `calculate-amortization.test.ts`, both chart model tests, `ChartAccessibility.test.tsx`; new bilingual `AmortizationCoverage.test.tsx` covers both real alternatives       | New long-loan journey reaches month 1,200 in the schedule and both chart alternatives, with at most 24 records per table page. Debt has 1,201 records including month zero; payments have 1,200                                                                                |
| Annual cents, endpoint debt stocks and source immutability              | Existing aggregation/lifetime controls; new `amortizationExplorerCoverage.test.ts` checks every annual/monthly period for both schedules in all four fixtures              | Existing first-year/partial-year exact amounts; new long-loan and boundary journeys check independent fixed totals and capped final amounts                                                                                                                                    |
| Pagination, view controls and recalculation                             | `AmortizationBreakdown.test.tsx`, both chart tests, `ChartAccessibility.test.tsx`; new bilingual long-loan component cases                                                 | Existing control-change and input-change journeys; new long-loan journey moves to final pages and back to annual/fixed views. New recovery journey checks page/inspection resets and closed alternatives after input changes                                                   |
| Invalid/incomplete plans, repair, plan removal and unavailable baseline | Existing schedule/chart/input validation and workspace tests                                                                                                               | Existing cash/incomplete-plan journey plus new recovery journey. Invalid plans expose a baseline-reference warning and disable selected choices; repair enables choices without silently selecting them; removal and unavailable baseline clear stale tables/charts            |
| Cash purchase                                                           | `calculate-amortization.test.ts`, schedule and both chart component cases, bilingual polish cases                                                                          | Existing `app.spec.ts` cash/incomplete-plan journey in DE and EN                                                                                                                                                                                                               |
| German/English values and retained view state                           | `AmortizationBreakdown.test.tsx`, both chart tests, `ChartAccessibility.test.tsx`, `AmortizationPolish.test.tsx`; new bilingual long-loan component cases                  | Existing bilingual control/polish journeys; new long-loan journey preserves horizon, detail, inspection selections and independent final pages through DE → EN                                                                                                                 |
| Both charts and complete accessible data alternatives                   | `ChartAccessibility.test.tsx` covers native captions/headers, opening principal, exact boundary/payoff, actual payment components, pagination and inspection announcements | Existing complete-alternatives journey hides SVGs, uses selectors and visits every data page. New journeys exercise both equivalent tables at the long-loan and early-payoff extremes                                                                                          |
| Mobile keyboard operation and layout                                    | Existing native-radio and pagination focus cases; new component cases retain focus on unavailable last-page controls                                                       | Existing accessibility/polish journeys cover 320–1440px, focus, contrast, reduced motion, captions and large text. New journeys use native keyboard activation, inspection, pagination and horizontal scrolling at 360px, check document containment and expanded-explorer axe |
| Non-annual fixed boundary and safe-money overflow recovery              | Existing period/chart model and component fixtures cover month 14, mixed periods and annual overflow with monthly recovery                                                 | The financing UI offers whole-year fixed periods and cannot enter month 14. Artificial safe-money overflow remains a model/component case; ordinary browser inputs use the supported UI                                                                                        |

Test paths above are under `src/domain/mortgage`, `src/features/financing` and `e2e`.
The new accounting contract checks complete coverage of actual payment months, flow sums,
opening/closing endpoints, row identities, alignment and unmodified source schedules. Its expected
amounts come from raw domain rows, never another chart model or parsed localized strings.

## Verification and evidence

Run the full repository gates against one clean commit:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run release:verify -- "$(git rev-parse HEAD)"
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
```

The existing CI runs these gates and the Chromium, Firefox and WebKit journeys on the PR merge
candidate. Record the final branch commit, CI candidate, identical Git tree and workflow URL in the
PR description. A changed candidate requires fresh evidence. The workflow uploads explorer PNGs
for seven days. This task adds mobile/desktop viewport captures for the long-loan and early-payoff
journeys; review all twelve new captures across the three engines before updating the tracker.

Browser axe, keyboard and DOM checks provide regression evidence. They do not constitute a
screen-reader listening audit or whole-site accessibility certification. PF-005.8 completes the
original explorer coverage milestone. Print/report work belongs to PF-006; a refreshed Version 1
release decision and live deployment verification remain governed by the separate release gates.
