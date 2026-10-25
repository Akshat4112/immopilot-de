# Bilingual property report

Original tracker **PF-006.3**, built on the immutable PF-006.2 snapshot and
[report content/privacy contract](report-content-and-privacy-contract.md).

The results workspace offers an explicit report preview. Output language and the complete monthly
appendix are deliberate options. Capture validates copied workspace inputs and recalculates through
the existing adapters; rendering consumes that frozen snapshot. Changing inputs, interface language
or preview options discards the preview. Closing discards it and restores the trigger's focus.
No report is persisted, encoded into a URL, or uploaded. There is no report-driven resource fetch.

`PropertyReport` is a standalone semantic document, with its own captured `lang` and localized
currency, percentage and number formatting. It includes acquisition, financing, requested/applied
additional repayments, fixed-period and projected savings, amortization, refinancing stress,
the applicable owner/rental decision, offer methods, inputs and bundled provenance. Missing,
unavailable, not-requested and cash-purchase states remain explicit. Inactive analysis inputs and
unused broker assumptions are excluded. Optional names supplied by a snapshot render as plain text.

The presentation models now accept only the immutable schedule fields they actually consume.
Their arithmetic and domain APIs are unchanged. Reports reuse these exact period/chart models:

- Annual selected-schedule rows include every actual month through payoff, independent of explorer
  pagination. Balance columns use endpoints; flow columns sum cents with safe-money checks.
- Both static inline SVG charts share the full horizon, distinguish schedules/components without
  colour alone and mark the fixed-interest cutoff and projected region.
- Complete native chart data tables accompany each SVG. Remaining debt can have labelled zero
  tails; payment tables/bars include actual payment periods only.
- The optional appendix contains every monthly row of every included schedule, including the
  1,200-month limit. It never extrapolates a partial payoff year or silently truncates rows.
- Unsafe annual aggregation preserves debt data and explains monthly recovery. It does not emit
  an unsafe total or silently substitute a baseline for an unavailable selected plan.

Screen tables scroll inside their own keyboard-focusable regions. Print styling uses A4 portrait,
fixed-width tables, repeated native headers, wrapping values/URLs, light backgrounds, page-safe
rows/headings and scalable inline figures. The preview container is intentionally hidden from
ordinary browser printing: **PF-006.6** owns the separately authorized print root, acknowledgement,
generic title and print/cancel lifecycle. This task supplies the reusable document and layout;
comparison report assembly remains **PF-006.4**, full transparency verification **PF-006.5**, and
the final browser/PDF matrix **PF-006.7**. It does not declare those tasks or release gates complete.

## Verification

Component/model regressions cover both modes and languages, source isolation, exact annual cents,
partial years, capped payoff, zero interest, 1,200-month appendices, negative rental cash flow,
cash/incomplete/unavailable states, real annual overflow, input locales, name escaping and preview
focus/reset behavior. Browser journeys exercise actual workspace-to-capture rendering, DE/EN
options, mobile keyboard scrolling, expanded-report axe, print protection, unchanged storage and
the complete long-loan appendix in Chromium, Firefox and WebKit. CI retains DE/EN owner/rental
viewport captures at 360 and 1440 pixels for seven days.

## Baseline repairs required for verification

After PR #71 merged, current main included PR #72. That commit replaced the established financing
workspace, removed most existing translations/styles, added broad UI coverage exclusions and left
an unused import that failed strict TypeScript. A separate commit in this PR restores those seven
files to the previously tested workspace, retaining all merged snapshot work and domain changes.
The complete pre-existing 437-test suite passes after restoration. This preserves the scenario,
Sondertilgung and amortization flows the report depends on.

Current dependency audits also require patched packages. Exact patch releases update Vite,
Vitest/its matching coverage package and Zod, plus the vulnerable transitive Undici package. Audit
thresholds and coverage requirements are preserved; final commands, versions, commit identity and
CI results are recorded in the PR description.
