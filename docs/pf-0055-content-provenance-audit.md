# PF-005.5 content and provenance audit

**Scope:** REL-007 and REL-009  
**Review date:** 30 September 2026  
**Release state:** Version 1 candidate; not a release declaration

## Result provenance

The shared `CalculationProvenance` treatment is displayed for purchase costs, financing,
Sondertilgung, refinancing, owner occupation, rental investment, offer-price results and property
comparison. Every instance shows:

- assumption set `de-2026.09`;
- the assumption-set verification date from the published JSON (`2026-09-13`);
- calculation specification `1.0.0`;
- a module-specific statement that separates source-backed defaults from user-entered assumptions;
- the non-advisory and non-offer boundary; and
- a link to the in-application privacy and financial notice.

The values come from one typed metadata adapter over `data/assumptions/de-2026.09.json`, preventing
the interface from silently drifting away from the shipped assumption document.

## Legal, privacy and hosting content

The footer links to `/privacy` from every route. The German and English notice describes local
calculation, deliberate local storage, deletion controls, fragment-based sharing, local JSON
import/export, GitHub Pages hosting, calculation limits and the distinction between local scenarios
and hosting connection data.

GitHub's official Pages documentation was rechecked on 30 September 2026 and still states that a
visitor IP address is logged and stored for security purposes. GitHub's General Privacy Statement,
effective 27 April 2026, was rechecked for the described service-usage, website-usage and transfer
context. The in-app notice links to both official sources and the complete bilingual repository
document.

The repository document remains explicitly marked as a legal draft. Verified operator details, any
required Impressum and German legal review remain release blockers and must not be inferred from this
technical content review.

## Public metadata and landing copy

- The obsolete `Grundlage · 0.1` / `Foundation · 0.1` label is removed.
- The landing page describes the workflows that exist and accurately says Version 1 is in release
  review.
- Route- and language-aware titles and descriptions cover every public route.
- Open Graph title/description fallbacks and a restrictive referrer policy are present without
  claiming approval, guaranteed accuracy, valuation or release status.

## Regression evidence

- Shell tests prove the notice is reachable from a workflow route and switches language in place.
- Home/resource tests reject the stale foundation-stage copy in both languages.
- Result tests prove all five decision modules expose the common versions and module limitations.
- Formatter tests prove source dates are stable across time zones.
- The final PF-005.6 candidate must repeat the deployed network, cookie, metadata and full bilingual
  route inspection.

## Finding disposition

- **REL-007:** Closed for implementation; every applicable result surface now exposes consistent
  version, verification-date and limitation context.
- **REL-009:** Closed; the shell and home page describe the implemented product without claiming that
  Version 1 has shipped.
