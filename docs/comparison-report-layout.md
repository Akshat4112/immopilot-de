# Comparison report layout

PF-006.4 implements the comparison document defined by the
[report content and privacy contract](report-content-and-privacy-contract.md), on top of the
merged PF-006.2 snapshot and PF-006.3 property report.

## Capture and source integrity

The comparison workspace offers an explicit preview for one to three selected saved scenarios.
It passes the visible left-to-right selection, without sorting or ranking. The capture button reads
and validates the library again, then checks the selected records against the visible source.
Missing, changed, corrupt, unsupported or inaccessible saved data blocks the whole capture with a
localized correction message. No requested property is silently dropped. Supported legacy documents
retain their original schema version in the snapshot; reading or previewing never rewrites storage.

The snapshot recalculates each selected scenario through `calculateSavedScenarioComparison` and
its recorded input locale. Only the selected allowlisted inputs, results, statuses and provenance
reach the report. Names are anonymous by default: Property 1–3 / Objekt 1–3. Unselected scenarios,
internal identifiers and saved timestamps are excluded. The renderer supports an explicitly opted-in
plain-text name in a future capture, always alongside its anonymous ordinal; the optional names UI
remains part of PF-006.6.

Changing the selection, workspace language, source records or report options clears the captured
preview. Storage events and returning focus to the window also discard it. Closing clears the
snapshot and restores focus to the capture button. Generation performs no network requests or
storage writes. The report does not alter saved inputs or comparison order.

## Summary and detail

`comparisonMetricGroups.ts` owns the shared five groups and 22 ordered metric IDs used by both
`ComparisonPage` and `ComparisonReport`. `ComparisonValue` formats both live and captured values
using an explicitly fixed output language. The summary preserves all money/rate/range/duration
representations, missing counts, not-applicable and unavailable states, yield fractions, repayment
bases and constant-rate projection warnings. Recorded mixed-basis metrics carry the same warning
as the application. The projected-result cell identifies owner advantage versus renting separately
from rental pre-tax sale profit, with the actual horizon. These values are not ranked or presented
as an interchangeable return measure.

Each property follows in the same order using `ReportPropertyDocument`, shared with the standalone
report. Each detail document retains its own status, acquisition, financing, requested/applied
Sondertilgung, complete annual schedule, both chart/table alternatives, refinancing, applicable
owner/rental results, offer methods, active inputs, versions, input locale and source dates. A cash
purchase has explicit not-applicable amortization. An invalid plan preserves the unavailable status
and labels any baseline as reference. The optional monthly appendix includes every actual row for
each included schedule, independently of live explorer pagination.

## Layout and delivery boundary

The summary is one semantic table with column and row headers, repeated print headers, and a
keyboard-focusable horizontal scroll region. Long values and method labels wrap without expanding
the page on mobile. Print styles use a named A4 landscape summary page and named portrait property
pages. The summary and each property begin on a new page. Both SVG chart models retain their own
unique IDs and non-colour distinctions. Each table scroll region includes the anonymous property
ordinal in its accessible name so equivalent sections remain distinct in landmark navigation.

As in PF-006.3, the preview is hidden during ordinary application printing. This task supplies the
comparison document and print layout, without claiming completion of the acknowledged print action
(PF-006.6), methodology audit (PF-006.5), or real print-dialog/PDF verification matrix (PF-006.7).

## Verification

Component and snapshot regression tests cover DE/EN output, one and three selections, exact metric
and property order, independent input locales, heterogeneous modes/fixed periods/horizons, incomplete
and cash results, zero values, partial payoff, full per-property monthly detail, escaped names,
unselected-data exclusion, unique chart IDs, captured-language stability, source mutations, missing
or corrupt libraries, option/reset events and focus restoration.

The tagged Playwright journeys run in Chromium, Firefox and WebKit. They create saved scenarios
through the real UI, reorder three properties, compare every summary cell with the live values,
check per-property annual charts and optional monthly tables, inspect both output languages at
360px and 1440px, check keyboard scrolling and accessibility, and exercise a standalone test-only
landscape/portrait style probe. They also verify one selection, a deleted saved library, zero
selections, no report-driven requests or writes, language invalidation and close/focus behavior.
The style probe does not open a print dialog or claim that a PDF was saved.
