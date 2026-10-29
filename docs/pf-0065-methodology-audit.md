# PF-006.5 — Report methodology and provenance audit

**Scope:** Frozen report captures produced by PF-006.2, rendered by PF-006.3 and PF-006.4. This audit changes only presentation and disclosure. It introduces no mortgage, acquisition, rental, offer, or tax formulas.

## Source-of-truth matrix

| Information | Authoritative source | Report behavior |
| --- | --- | --- |
| Report contract | `REPORT_CONTRACT_VERSION` | Captured version, not inferred from build time |
| Scenario input | `SCENARIO_SCHEMA_VERSION` and saved source schema | Both versions, input locale and migration metadata |
| Calculation specification | `calculationMetadata.calculationSpecificationVersion` | Embedded unchanged from the captured snapshot |
| Assumption data | `data/assumptions/de-2026.09.json` | Assumption-set and schema versions, effective date and verified-on date |
| Applicable state transfer tax | The chosen `transferTax.states[].effectiveFrom` | Per-property rate effective date, never a report-generation date |
| Transfer-tax source | `transferTax.rateSourceDate` | Separate source as-of date |
| Underlying references | Captured `property.provenance.sources` | Exact source title, URL, publisher, source date (or explicitly not provided), verification date |
| Applied acquisition rates | Captured `appliedAcquisitionAssumptions` | Effective rate and whether state lookup, planning default or user override |
| Application identity | Captured release build identity | SHA where available; otherwise explicit unavailable state |

No report date is presented as a fresh legal/source verification. The app never updates the bundled assumptions or makes a network call to research market rates while rendering a report. Statutory rates remain distinct from planning proxies. User overrides are not independently verified by the application.

## Calculation boundaries

- **Acquisition:** Transaction costs and total project costs reuse the engine; no new percentages or arithmetic in report presentation. Rates retain source and override labels.
- **Financing:** Monthly payments, equity and funding status come from the captured domain result. Refinance stresses remain hypothetical, not bank quotes.
- **Repayment:** Savings and debt reduction **through Zinsbindung** are distinguished from lifetime interest and payoff projections. The full amortization appendix may extend past the fixed-interest period; the initial-rate extrapolation warning is shown only when an included amortization schedule actually extends beyond that boundary. Loan months and zero-balance tails never imply further payments.
- **Owner occupier:** Buyer-minus-renter is a matched-budget, scenario-based wealth difference. Principal is part of equity and must not be deducted twice. No claim that an interest scenario is contractually guaranteed.
- **Rental investment:** Gross-yield denominator is purchase price; net-yield denominator is total investment cost, with the domain's exact numerators. Reserves affect cash flow but are not the same as economic expense. Returns and sale-profit estimates are **before personal taxes**; no tax-saving estimate is created.
- **Offer range:** User-provided comparables and target assumptions do not establish a formal valuation or recommended price.
- **Comparison:** Reuses each selected property's sources, tax effective date, versions and original assumptions independently; heterogeneous horizons and repayment bases are preserved.

## Limitations / follow-ups

This is an **evidence-and-label audit**, not new primary legal verification. Bundled `sourceDate` can be null and is displayed as not provided rather than fabricated. The analysis avoids claiming current official rates or current source validity as of the generation date.

PF-006.6 still owns snapshot-scoped acknowledgement, controlled print root and browser Print / Save as PDF. PF-006.7 owns actual three-engine PDF and accessibility verification. The independent Version 1 release gates are not closed by this task.

## Regression checks

`reportMethodology.test.tsx` asserts:
1. Frozen schema/assumption/specification versions, state effective date, source as-of and verification dates in both languages.
2. No false post-Zinsbindung projection warning for loans paid off within fixation; a projected schedule remains explicitly warned.
3. Different Bundesland dates remain correctly attached to different properties in a comparison.
4. Rental yield basis labels and before-tax/no-tax-savings wording remain visible.

Existing snapshot, chart, locale, privacy, complete/incomplete and three-browser comparison suites remain mandatory release checks.
