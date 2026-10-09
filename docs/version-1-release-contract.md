# Version 1 release-readiness contract

**Status:** Approved audit and launch contract for PF-005  
**Established by:** PF-005.1  
**Release candidate:** ImmoPilot DE Version 1

## Purpose

PF-005 turns the current Version 1 feature set into a release candidate that can be evaluated and
published with reproducible evidence. Passing repository CI is necessary, but it is not sufficient to
declare the product released. The live GitHub Pages build, user journeys, calculation fixtures,
accessibility, responsive behavior, bilingual copy, privacy boundaries and release documentation must
all satisfy the gates in this contract.

This milestone may fix release blockers and documentation defects. It must not silently expand the
approved Version 1 product boundary or introduce a backend, accounts, live data feeds, tax advice or
new financial formulas.

## Release authority and state

The README is the public source of release state. Until every gate below passes, the application is a
**release candidate** and must not be described as a completed or production-grade Version 1 release.

The allowed states are:

| State | Meaning |
| --- | --- |
| Implementation | Approved Version 1 features are still being built. |
| Release readiness | Feature implementation is substantially complete; audit evidence or remediation remains. |
| Release candidate | All planned remediation is merged and the exact candidate commit is under final verification. |
| Released | Every mandatory gate passed for the tagged commit and the deployed artifact matches it. |

Only the final PF-005 release task may change the state to **Released**.

## Fixed Version 1 boundary

The release audit uses the approved boundary in [product-definition.md](product-definition.md). It
must verify these capabilities without adding new ones:

1. German purchase-cost calculation.
2. Mortgage payment and amortization.
3. Annual and one-time Sondertilgung.
4. Fixed-period debt and refinancing stress scenarios.
5. Owner-occupier rent-versus-buy analysis.
6. Rental-investment yield, cash-flow and sale analysis.
7. Offer-price ceilings and opening-offer range.
8. Local saved scenarios, JSON import/export and fragment-based share links.
9. Comparison of up to three scenarios.
10. German and English interfaces.
11. Client-only processing without accounts or a backend.
12. Static deployment under the `/immopilot-de/` GitHub Pages path.

Tax calculations, mortgage eligibility, live rates, property listings, cloud synchronization and
professional recommendations remain explicitly outside Version 1.

## Evidence rules

Every audit record must identify:

- the Git commit SHA and deployed URL under review;
- the audit date;
- the browser, operating system and viewport where relevant;
- the exact input scenario or fixture used;
- the expected result and actual result;
- a link to the automated test, screenshot or written finding; and
- the reviewer and final disposition.

Evidence from a different commit does not approve a later release candidate. A code change after a
gate passes invalidates only the affected evidence, but the final smoke suite must always run again on
the new candidate.

Generated screenshots, videos and traces may contain financial inputs. They must use documented demo
data, never private real-world scenario data.

## Severity and disposition

| Severity | Definition | Release effect |
| --- | --- | --- |
| Critical | Wrong financial result, data loss, sensitive-data disclosure, unusable core journey or broken deployment. | Blocks release. |
| Major | Approved Version 1 capability is missing, materially misleading, inaccessible or unusable in a supported locale/viewport. | Blocks release. |
| Minor | Localized presentation or usability defect with a safe workaround and no incorrect decision output. | Must be fixed or explicitly accepted with an owner and follow-up. |
| Advisory | Improvement outside the release boundary or a non-material polish opportunity. | Does not block release; record separately. |

A finding may be closed only by a merged fix with regression evidence, or by a written decision that
explains why it is not a Version 1 requirement. Critical and major findings cannot be waived.

## Mandatory release gates

### Gate 1 — Scope completeness

- Every item in the fixed Version 1 boundary has a reachable user workflow.
- Owner-occupier and rental-investment entry paths are understandable without hidden setup knowledge.
- Required outputs in the product definition are visible or the product definition is corrected through
  an explicit product decision before release.
- No placeholder or “coming soon” experience remains on a release path.

### Gate 2 — Calculation correctness and transparency

- All domain fixtures and unit tests pass on the release candidate.
- The owner-occupier and rental-investment demo scenarios reproduce their documented cent values.
- Baseline and Sondertilgung schedules preserve their documented timing, rounding and payoff rules.
- Fixed-period results are distinguished from constant-rate lifetime projections.
- Yield, cash flow, return, offer-price and refinancing results expose their relevant bases and
  assumptions.
- Missing or invalid inputs never appear as a valid zero.

### Gate 3 — Scenario integrity and privacy

- Saved scenarios store only versioned user inputs and recalculate results when loaded.
- Save, rename, duplicate, delete, reset, JSON export/import and share-link journeys work.
- Version 1.0.0 scenarios migrate safely to Version 1.1.0.
- Corrupted, malformed and unsupported data cannot replace the active workspace.
- Share data remains in the URI fragment and privacy confirmations precede share/export actions.
- Clearing the workspace and local library has visible, deterministic behavior.

### Gate 4 — German and English quality

- Every route, validation message, result label, warning and empty state is available in both languages.
- Locale-specific money, percentage and integer parsing and formatting are correct.
- Switching language preserves the active scenario.
- German and English terminology follows [terminology.md](terminology.md).
- No untranslated key, clipped label or mixed-language result is visible.

### Gate 5 — Accessibility

- All workflows are operable by keyboard without a trap.
- Focus order is logical and focus remains visible.
- Page titles, headings, landmarks, field labels, errors and status updates are programmatically
  meaningful.
- Dialog-like confirmations have an understandable focus and dismissal path.
- Essential information is not conveyed only through color, position or a chart.
- Automated checks report no serious or critical accessibility violation, followed by a manual keyboard
  and screen-reader-oriented review.

### Gate 6 — Responsive and browser behavior

- The complete workflow works at 375 px, 768 px and 1440 px widths without page-level horizontal
  overflow.
- Comparison tables retain an intentional contained scrolling affordance on small screens.
- Long German labels, validation messages and formatted monetary values remain readable.
- Current stable Chrome, Firefox and Safari receive a manual smoke pass; automated Chromium remains the
  required CI browser.

### Gate 7 — Deployment and routing

- CI passes formatting, lint, type-check, coverage, build, dependency audit and Playwright.
- Pages deployment runs only from a successful `main` CI result.
- The deployed artifact corresponds to the audited commit.
- Direct entry, reload and in-app navigation work under `/immopilot-de/` for every hash route.
- Static assets, favicon and metadata resolve under the Pages base path.
- A failed build or test cannot replace the last successful deployment.

### Gate 8 — Legal, privacy and content

- The educational nature and non-advisory boundary are visible where decisions are presented.
- Projection, lender-limit, tax and market-risk limitations match
  [legal-and-privacy.md](legal-and-privacy.md).
- No analytics event contains entered prices, equity, rent, loan values, scenario JSON or share payloads.
- Public metadata and documentation do not make unsupported accuracy, approval or valuation claims.
- Source dates and editable assumptions remain visible where required.

### Gate 9 — Release operations

- The README accurately states the product status and supported workflows.
- The release candidate has no critical or major findings and every minor finding has a disposition.
- A changelog summarizes Version 1 capabilities, limitations and migration behavior.
- The exact released commit receives the agreed semantic version tag.
- The deployed release is smoke-tested after tagging, and rollback means redeploying the last known-good
  tagged commit.

## Initial repository evidence snapshot

PF-005.1 records implementation evidence but does not mark the gates as passed.

| Area | Current repository evidence | PF-005 verification still required |
| --- | --- | --- |
| Purchase and financing | `/purchase-costs` and `/financing`; acquisition, financing, payment and mortgage domain modules | Live input, boundary and locale audit |
| Results | `/results`; refinancing, owner-occupier, rental and offer-price modules | Output-by-output product-definition audit |
| Sondertilgung | Approved contract, Version 1.1.0 schema, comparison integration and regression coverage | Live save/share/import and cross-browser evidence |
| Persistence | `/scenarios`, strict JSON/share parsing and unchanged local-storage key | Destructive-action, corruption and privacy audit |
| Comparison | `/comparison` with up to three scenarios and repayment-basis labels | Mobile, keyboard and mixed-basis audit |
| Localization | Synchronous German/English resources and locale formatters | Full route copy sweep in both languages |
| Quality | CI runs formatting, lint, type-check, coverage, build, audits and Playwright | Review thresholds and final candidate run |
| Deployment | Pages workflow deploys a successful `main` CI artifact | Commit-to-live-artifact verification and route smoke |

## Preliminary release risks

These observations require formal disposition during PF-005.2; they are not silently accepted:

1. The product definition promises distinct owner-occupier and rental-investment starts, while the home
   page currently exposes one general purchase-cost action.
2. The engine calculates full amortization rows, but the current financing page presents summary cards
   rather than a user-visible detailed amortization table or equivalent accessible breakdown.
3. The browser suite covers core persistence and Sondertilgung journeys, but JSON import requires an
   explicit release-level browser journey.
4. README release state, changelog, release tag and deployed-commit evidence do not yet exist for a
   Version 1 release.

PF-005.2 must confirm the severity of each item against the approved product definition and create a
testable remediation task for every release-blocking finding.

## PF-005 implementation sequence

| Task | Deliverable |
| --- | --- |
| PF-005.1 | Approve this release contract, gates, evidence rules, severity model and task sequence. |
| PF-005.2 | Audit the repository and deployed Pages application; publish the evidence-backed finding register. |
| PF-005.3 | Resolve approved-scope and critical-workflow blockers with regression coverage. |
| PF-005.4 | Complete accessibility, responsive, cross-browser and bilingual remediation. |
| PF-005.5 | Complete privacy, legal, metadata, source-date and release-documentation hardening. |
| PF-005.6 | Cut and verify an exact Version 1 release candidate across every mandatory gate. |
| PF-005.7 | Publish the changelog, tag Version 1, verify deployment and record rollback evidence. |

Each task is a standalone pull request. A later task may be split when findings are too large for one
reviewable change, but its acceptance criteria must continue to map back to this contract.

## PF-005.1 acceptance criteria

PF-005.1 is complete when:

- the Version 1 boundary and non-goals are frozen for release work;
- release states and the authority to declare a release are explicit;
- evidence requirements and finding severities are unambiguous;
- all nine mandatory release gates have testable conditions;
- preliminary repository risks are recorded without prematurely passing a gate;
- PF-005.2 through PF-005.7 have ordered, reviewable deliverables; and
- the README links this contract and identifies release readiness as the active phase.
