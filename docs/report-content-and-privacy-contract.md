# Report content and privacy contract

**Status:** Proposed implementation contract; effective when this PR is merged  
**Contract version:** 1.0.0  
**Established by:** Original tracker PF-006.1  
**Baseline:** PR #69 merged at `09e9ac07963b34a131ec9adc24ecc691c91e9573`

## Purpose and delivery boundary

PF-006 produces a readable, bilingual calculation report for one property or a comparison of up
to three saved properties. This contract fixes the sections, calculation bases, disclosure rules,
filename convention and local generation method for PF-006.2 through PF-006.7. It maps to the original
PF-007 report-design and PF-008 browser-side PDF-export requirements. The original PF-006.1 ID is
distinct from the release-readiness RC records and their historical PF-005 aliases.

The [calculation specification](calculation-specification.md),
[engine conventions](calculation-engine-conventions.md),
[Sondertilgung contract](sondertilgung-product-contract.md),
[explorer interaction](amortization-explorer-interaction.md) and
[financial and privacy notice](legal-and-privacy.md) remain normative. This document defines report
behavior, not new financial formulas or legal approval. Existing operator/legal release gates remain
open. This PR adds documentation only; the report model, interface and print action are follow-ups.

## Decisions

| Area | Version 1 decision |
| --- | --- |
| Single-property source | Explicit capture of the current workspace, including an unsaved draft; export must not save it implicitly. |
| Comparison source | One to three selected saved scenarios, in the visible comparison order. Zero selections cannot generate a report. |
| Language | Current interface language, German or English, frozen for each preview; stored input locale remains separate. |
| Format | Semantic, print-ready HTML with project-owned print CSS and inline SVG charts; browser printing provides paper output or Save as PDF. |
| Calculation | Recalculate a validated, copied input snapshot through existing adapters and domain APIs; never scrape the live DOM or reuse cached display strings. |
| Default amortization detail | Annual selected-schedule detail through projected payoff, plus fixed-period baseline/Sondertilgung summary and both charts. Monthly detail is an explicit optional appendix. |
| Privacy | Anonymous property labels by default; optional inclusion of saved scenario names requires a separate deliberate choice. |
| Storage | Preview and derived results in memory only. No report cache, implicit local save, encoded report URL, upload or remote PDF service. |
| Export action | Reviewable preview, mandatory sensitive-data acknowledgement and a separate Print / Save as PDF action. |

Browser PDF saving is the supported Version 1 PDF workflow. There is no direct binary-PDF download
promise, new PDF dependency, raster screenshot renderer or server endpoint. The same HTML is used
for preview and print. Generation must work after the required static application assets have loaded,
without a new network request. No new script, font, image or chart resource may be fetched for export.

## Snapshot, validation and provenance

PF-006.2 must define a report-specific transient model with:

- report contract version, report kind, output language and a generated-at ISO instant with timezone;
- application build identity from the existing release mechanism, or an explicit unavailable label;
- scenario input schema version actually used, including explicit migration from supported legacy input;
- assumption-set version and verified-on date, calculation-specification version, and applicable
  source identifiers, URLs, effective dates and verification dates from bundled configuration;
- allowlisted copied inputs, their original numeric input locale, effective defaults and overrides;
- selected repayment basis, analysis horizons and comparison order; and
- freshly calculated typed results and status/reason information for the lifetime of the preview.

The current schema constant is `SCENARIO_SCHEMA_VERSION` in
`src/storage/scenarioPersistence.ts` (1.1.0 at the baseline); version values must be obtained from
their authoritative constants rather than duplicated as implementation literals.
`src/config/releaseMetadata.ts` owns calculation provenance. Use source verification dates as recorded;
the generation date does not renew them or imply current market research.

Validate the input structure using the supported schema/migration path, then run the existing
calculation adapters and domain validation. Parse each scenario with its recorded input locale, not
the report language. An unsaved draft must carry its actual input locale into the same adapter path.
Schema validity alone does not establish complete or financially valid inputs. Unknown schemas,
malformed documents or unexpected calculation failures block generation with a localized correction
message; do not produce a partial artifact that looks complete after an unexpected failure.

Known incomplete or unavailable calculation sections may be reported with their explicit status and
reason. The preview must identify itself as incomplete when any requested result is missing or
unavailable; known not-applicable states do not make it incomplete. Preserve the remaining available
sections. Blank values, invalid values and valid zero must remain distinct.

Use `calculateScenarioDashboard` for workspace results and `calculateSavedScenarioComparison` for
saved comparisons. Reuse the period/chart models and cent/decimal formatters. Do not create a second
calculation engine, annualize rounded monthly displays, infer outputs from text, or mutate the source
workspace, saved scenarios or comparison selection. Saved scenario persistence remains inputs only.
Fresh derived values are allowed in the transient model and rendered report, but are never persisted
back into scenarios or a report cache.

Inputs, language, selection or report options changing after preview require a fresh snapshot and
new acknowledgement before export. A printable report represents one immutable captured state;
it must not mix old totals with updated assumptions. Closing the preview clears its transient state.

## Single-property sections, in order

| Section | Required content |
| --- | --- |
| 1. Identity and scope | ImmoPilot DE, localized report title, generated time/timezone, anonymous Property 1 label, owner-occupier or rental-investment mode, language, EUR units, complete/incomplete status and concise financial notice. |
| 2. Property and acquisition | Purchase price, Bundesland, broker involvement, applicable rates and user overrides, transfer tax, notary, land register, broker, transaction-cost total, renovation and moving/setup amounts with budget status, all-in acquisition cost and capital requirement. Floor area appears only when supplied for the existing offer method. |
| 3. Financing | Available versus required equity, financing mode, down payment when applicable, financed cost share, loan amount, funding status/shortfall, nominal interest, initial repayment, contractual monthly payment, fixed-interest duration and its loan-month boundary. Cash purchases are labelled explicitly. |
| 4. Repayment and Sondertilgung | Annual amount/payment month and ordered one-time amounts/loan months; baseline versus selected schedule; actual additional principal, fixed-period interest saving, debt reduction and remaining debt; projected lifetime interest saving, both payoff months and time saved, each with its basis. Requested extra payments and actually applied capped principal remain distinct. |
| 5. Amortization | Annual table, both remaining-debt and payment-composition charts, equivalent data tables, exact fixed-interest and payoff endpoints, partial-year month ranges and post-fixed-period projection warning. Optional monthly appendix follows the main report. |
| 6. Refinancing stress | Configured lower/base/higher future interest rates, future initial repayment, selected fixed-end debt, resulting payments and payment changes; not-configured/unavailable/not-applicable cases retain their reason. These are scenarios, not lender quotes. |
| 7. Mode-specific decision | Owner-occupier or rental section below, with actual horizon and repayment basis. Do not expose inactive-mode draft fields. |
| 8. Offer-price methods | Configured affordability and gross/net yield targets and ceilings, asking/proposed price, supplied area and comparable low/high prices, comparable value range, opening-offer discounts and range; retain per-method unavailable/not-requested states. No invented central comparable or recommended purchase price. |
| 9. Assumptions and methodology | Complete included input/assumption appendix, effective rates/defaults and overrides, versions/dates, calculation bases, source links, projection limits, financial disclaimer and export privacy note. |

### Owner-occupier decision section

Include comparable current rent, owner costs, rent/cost growth, property appreciation, alternative
investment return, selling cost rate and analysis horizon. Report buyer and renter net wealth,
buyer-minus-renter difference and break-even state on the existing matched-budget basis, with relevant
cash-flow and sale/debt components. Principal builds equity; it must not also be subtracted from final
wealth as an extra expense. Applied Sondertilgung is included in the matched cash budget according
to the existing engine. Show negative contributions/differences without hiding signs.

### Rental-investment decision section

Include net cold rent, vacancy, other rent losses, non-recoverable Hausgeld excluding reserve,
reserve contribution, maintenance outside Hausgeld, other owner costs, rent/owner-cost growth,
holding period, and optional appreciation/selling costs when configured. Distinguish economic
costs, reserve cash contributions, regular debt service and additional principal. Report gross/net
yield with exact numerator/denominator bases, first-month pre-tax cash flow after extra repayments,
cash-on-cash status/basis, cumulative cash flows and debt reduction over the selected horizon.
When sale assumptions are configured, include property value, selling costs, debt, net sale proceeds
and estimated pre-tax profit with its engine-defined basis. Missing sale assumptions do not invent
sale proceeds. Do not claim tax savings or an after-tax return; personal tax is outside this model.

### Amortization rules

Annual money columns sum actual monthly domain rows exactly in cents. Opening/closing balance
columns use endpoints rather than summing balances. Include opening debt, regular payment, interest,
scheduled principal, applied additional principal, total payment and closing debt. Never extrapolate
partial final years to twelve months. The regular-payment annual sum is not labelled as the monthly
rate. Loan months are relative payment periods, not invented calendar dates.

Both charts use the same full projected horizon and schedule basis described in the report. Retain
non-colour distinctions and exact cutoff/payoff markers. Show both baseline and Sondertilgung when
a valid non-zero plan exists; otherwise show the baseline. Cash purchases omit repayment charts
with an explicit not-applicable explanation. Invalid plans must mark dependent selected results
unavailable, not quietly present baseline results as the requested plan. A baseline may appear only
as a labelled reference. Post-payoff zero tails may appear in the remaining-debt chart for alignment;
they must not create fictitious payment rows or bars.

The annual table is complete, independent of explorer pagination, hidden disclosures or inspection
selection. The optional monthly appendix includes all actual rows up to the supported 1,200-month
domain horizon for each included schedule; no silent row truncation. Split long tables across pages
with repeated headers. Unsafe annual aggregation must show its explicit unavailable state and
direct the user to monthly detail; never output an unsafe total.

## Comparison report

Capture one to three saved properties in current left-to-right order. By default label them
Property 1 / Property 2 / Property 3 (Objekt 1 / Objekt 2 / Objekt 3), consistently throughout.
Do not sort by a metric, rank winners, require equal inputs or merge assumptions between properties.
One selected property is allowed and retains the comparison report layout.

The summary table must preserve all current comparison groups and metrics from
`src/features/comparison/comparisonCalculations.ts` and `ComparisonPage.tsx`:

| Group | Metric IDs, in order |
| --- | --- |
| Purchase | `purchasePrice`, `acquisitionCosts` |
| Financing | `equity`, `loan`, `monthlyPayment`, `remainingDebt` |
| Repayment | `additionalPrincipal`, `interestSaved`, `remainingDebtReduction`, `projectedInterestSaved`, `baselinePayoff`, `selectedPayoff`, `timeSaved` |
| Performance | `grossYield`, `netYield`, `monthlyCashFlow`, `projectedReturn` |
| Offer | `grossYieldCeiling`, `netYieldCeiling`, `affordabilityCeiling`, `comparableValue`, `openingOffer` |

Each value keeps its currency/rate/range/duration representation, source status, missing-input count,
repayment basis and any fixed-period or projection basis. Percentage values include numerator and
denominator when supplied by the engine. Show a mixed-basis warning using `hasMixedComparisonBasis`
where applicable. Different fixed periods, horizons, property uses and repayment plans stay explicit.
An owner buyer-minus-renter result and a rental estimated pre-tax profit must use distinct labels;
their shared `projectedReturn` row does not make them the same financial quantity.

Follow the summary with each property's acquisition, financing, applicable decision results and
assumptions in the same order, using the single-property section rules. Include per-property annual
amortization and charts; monthly detail remains optional. Shared methodology/disclaimer text may be
printed once, but per-property input, version, source and horizon differences must remain traceable.
Missing saved selections or corrupted/unsupported library data require correction and a new capture;
do not silently drop a requested property or export the rest under an unchanged report title.

## Allowlisted content and privacy controls

The report includes only the selected properties' calculation inputs, effective assumptions,
requested report options, calculation results/statuses and provenance listed above. It excludes
inactive-mode fields, unselected saved scenarios, scenario/library IDs, saved creation/update times,
the raw JSON payload, share fragments, query strings, browsing history, hidden browser state,
local-storage keys, clipboard content and device identifiers. It never requests personal documents,
contact details, precise addresses, bank details, salary evidence or authentication secrets.

Saved names are the only existing free-text field eligible for optional display. The default is
excluded. Provide an unchecked Include scenario names option with a reminder to remove personal
names or addresses; apply it only to this preview. Do not invent names for an unsaved draft.
Render allowed names as plain text, never HTML, filenames, link targets or document metadata.
Changing the option clears acknowledgement. Anonymizing labels is not anonymizing financial values.

Before opening the print dialog, show the preview and require an unchecked acknowledgement scoped
to the current snapshot. Cancel/close must not print, download, change saved inputs or overwrite files.
No acknowledgement may persist across sessions or be implied by saving a scenario or sharing a link.

Required bilingual warning copy:

> **English:** This report can reveal your property plans and financial circumstances. Review its
> contents before printing, saving or sharing. Generation happens in your browser; the application
> does not upload the report. Files and printouts may be accessible to other device users, backups,
> synchronization services or recipients. Deleting a saved scenario does not delete those copies.

> **Deutsch:** Dieser Bericht kann Ihre Immobilienpläne und finanziellen Verhältnisse offenlegen.
> Prüfen Sie den Inhalt vor dem Drucken, Speichern oder Teilen. Die Erstellung erfolgt in Ihrem
> Browser; die Anwendung lädt den Bericht nicht hoch. Dateien und Ausdrucke können für andere
> Gerätenutzer, Sicherungs- oder Synchronisierungsdienste und Empfänger zugänglich sein. Das Löschen
> eines gespeicherten Szenarios löscht diese Kopien nicht.

| Control | German | English |
| --- | --- | --- |
| Report title | Immobilienbericht / Immobilienvergleich | Property report / Property comparison |
| Optional names | Szenarionamen aufnehmen | Include scenario names |
| Acknowledgement | Ich habe den Inhalt und den Datenschutzhinweis geprüft. | I have reviewed the contents and privacy warning. |
| Action | Drucken / Als PDF speichern | Print / Save as PDF |

These supplement the approved financial notice; they do not replace it or claim encryption,
confidentiality, legal compliance certification or deletion control over copied files. Browser or
OS printing, selected printers and user-selected cloud PDF destinations are outside application
control. Explain that choice without promising that the chosen destination remains local.

## Filename and browser-print contract

Use a generic ASCII suggested document title/filename:

- `immopilot-de-property-report-{de|en}-YYYY-MM-DD.pdf`
- `immopilot-de-comparison-report-{de|en}-YYYY-MM-DD.pdf`

Derive the date from the captured generation instant in UTC and identify that date convention in
the preview. Never put names, addresses, prices, IDs or share payloads in the title or filename.
The browser controls the final save name, extension, location and collision handling; the UI must
describe these as suggestions, not guarantees. It must never overwrite an existing file itself.
Temporarily setting a generic document title for print must restore the application title on exit.

Keep the report in the loaded document under a dedicated print root rather than creating a
data-bearing URL or fetching a print page. Invoke browser printing only after deliberate action,
the frozen preview is ready and acknowledgement is checked. Printing the ordinary app route without
this authorized preview must not expose hidden report data. Clear the print root on closing and
restore application focus; preserve preview for a retry if the print dialog is cancelled.
Browser print completion events do not prove a file was saved or paper printed, so never announce
successful export from such an event alone. If printing is unavailable, retain the preview and
provide localized recovery instructions without a remote fallback.

Use A4 portrait for property pages and landscape where needed for comparison tables. Page breaks,
repeated table headers and light-background print styles must keep all columns, negative amounts,
long labels, source URLs and disclaimers readable. Do not print application navigation, editing
controls, disclosure buttons or pagination. Ensure headings, semantic tables and non-colour chart
meaning survive printing; do not promise PDF tagging/screen-reader behavior that depends on the
browser. Turn off browser-added URL headers/footers when needed, particularly if a share fragment
is present; the preview must explain that browser setting rather than claim control over it.

## Follow-up ownership and acceptance criteria

| Task | Required implementation and verification |
| --- | --- |
| PF-006.2 | Validated copied-input snapshot, recorded input/output locales and provenance, fresh calculations, status preservation, immutable capture, exclusion allowlist and no persistence/mutation. Verify DE/EN inputs, legacy migration, invalid schema, cash purchase, invalid plan, incomplete sections and changed input after preview. |
| PF-006.3 | Bilingual single-property HTML/print layout, annual amortization, both charts/data alternatives and optional complete monthly appendix. Verify both modes, partial-year/early payoff, zero interest, long loans, negative cash flow and overflow states. |
| PF-006.4 | One-to-three property report, exact selection/group/metric order, missing flags, heterogeneous horizons/modes and per-property assumptions. Verify a missing selected scenario blocks capture and unselected properties never leak. |
| PF-006.5 | Calculation bases, source/effective/verified dates, versions and approved financial/privacy text, including fixed-versus-projected and pre-tax limits. No fresh-source claim merely because the report was generated today. |
| PF-006.6 | Snapshot-scoped warning/acknowledgement, optional plain-text names, generic titles, local print root, cancel/retry/close behavior and no report-driven requests or storage writes. Verify no data in titles/URLs/logs and no print before acknowledgement. |
| PF-006.7 | End-to-end preview-to-print/PDF checks in Chromium, Firefox and WebKit, DE/EN layout/page breaks, three-property tables, 1,200-month appendices, keyboard/focus, name escaping, print cancellation, network observation and production-host behavior. Use the available browser print/PDF mechanisms and record unsupported browser capabilities explicitly. |

PF-006.1 is complete when this specification and its README entry are reviewed/merged. Subsequent
tasks are not completed by this contract. Report delivery does not itself close the independent
release/deployment gates or declare Version 1 released.
