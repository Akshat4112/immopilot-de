# PF-007.3 — In-app methodology and source metadata

**Task:** Publish a German/English, accessible methodology page for all major calculation modules.
**Canonical sources:** `docs/calculation-specification.md` (Version 1.0.0) and
`data/assumptions/de-2026.09.json` (bundled assumptions, with distinct effective and verified dates).

## Public route and navigation

`#/methodology` is linked from every calculation provenance panel and the site footer.
The route has localized document title and description and remains usable directly after a
GitHub Pages reload. No analytics or dynamically fetched source data is introduced.

## Explainers

Eight sections distinguish acquisition/transfer-tax assumptions, financing and equity,
monthly annuities, monthly extra-repayment ordering, matched-budget owner-occupier
comparisons, rental yields and cash flow, offer-price comparables, and hypothetical
projections and rounding.

In particular:

- **Gross rental yield:** annual net cold rent divided by *purchase price*, before vacancy,
  operating costs, financing and personal taxes.
- **Net rental yield:** net operating income divided by *purchase price + transaction
  closing costs + post-purchase budget*. Operating income reflects modelled vacancy and
  owner costs but excludes financing and personal taxes.
- **Cash-on-cash:** first-year pre-tax cash flow **before discretionary extra repayments**
  divided by required initial equity (unavailable if the denominator is not positive).
- **Owner-vs-renter:** compares liquidation-basis buyer wealth with the matched-budget
  renter investment portfolio. Principal adds to buyer equity; it is not a second expense.
- **Refinancing, future value and rent changes:** hypothetical scenarios, not rates or
  returns guaranteed by a lender or market forecast.

Each section contains a compact formula, explanation and explicit limitations. The
formula captions are explanatory summaries of Version 1; they do not replace the detailed
normative monthly cent-rounding specification or alter engine code.

## Source identity and date boundary

The app reads `assumptionSet.sources` directly rather than maintaining a second stale
reference list. Each source displays publisher, title, canonical URL, documentary date
(or explicitly *not provided*), and last verification date. The page separately displays
the assumption-set version, specification version, assumption verification date and
transfer-tax source as-of date. **These are historical records, not current live checks.**

The source list includes statutes, professional fee guidance and consumer-advice pages.
Notary and land-register default percentages are editable planning proxies. Broker cost
is contract-dependent, not a statutory uniform percentage. The state transfer-tax lookup
is sourced to the frozen data set; a buyer must verify current rules before acting.

No user inputs, saved scenarios or calculation results are sent outside the browser by
this page. Source links navigate only if the user deliberately opens them.

## Acceptance evidence

- Bilingual component checks for exact source/assumption versions, undefined source dates,
  source hyperlinks, formula labels, metadata and locale changes.
- Chromium/Firefox/WebKit browser test for route, language, source list, mobile overflow
  and serious/critical axe findings.
- Existing calculator/report golden vectors and provenance panels remain unchanged.

**Release:** This task is not independent legal confirmation of source updates and does not
close final manual, operator, legal or public Version 1 release gates.
