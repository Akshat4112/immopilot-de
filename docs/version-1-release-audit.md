# Version 1 release audit and finding register

**Task:** PF-005.2  
**Audit date:** 26 September 2026  
**Audited commit:** `e28ace2fac37cd0cc0e7293383f6f862fcce191e`  
**Deployed URL:** <https://akshat4112.github.io/immopilot-de/>  
**Reviewer:** Codex  
**Disposition:** **No-go for Version 1 release**

This audit applies the mandatory gates in
[version-1-release-contract.md](version-1-release-contract.md) to the repository and deployed GitHub
Pages application. It records release evidence and creates a testable owner for every gap; it does
not change product calculations or silently reduce the approved Version 1 scope.

## Audit evidence

### Repository and deployment

- Pull request #53 was merged as `e28ace2fac37cd0cc0e7293383f6f862fcce191e` before this audit.
- A clean production build of that source tree generated
  `/immopilot-de/assets/index-C335ZiXr.js` and
  `/immopilot-de/assets/index-B4yIT9O1.css`; the deployed page loaded those same hashed assets.
- The deployed document loaded its favicon and metadata from the `/immopilot-de/` base path.
- Direct entry, reload and in-app navigation succeeded for `#/`, `#/purchase-costs`,
  `#/financing`, `#/results`, `#/scenarios` and `#/comparison`.
- The repository CI covers formatting, lint, type-checking, the 80% unit-coverage thresholds, build,
  dependency audits and Chromium Playwright. The Pages workflow is gated on successful `main` CI.

The audit reran the repository quality commands against the audited tree:

| Check | Result |
| --- | --- |
| Formatting, ESLint and strict TypeScript | Pass |
| Vitest with coverage | 41 files and 309 tests pass; 90.77% statements, 85.56% branches, 90.47% functions and 91.97% lines |
| Production build | Pass; generated asset hashes match the deployed page |
| Full and production-only npm audits | Pass; zero vulnerabilities |
| Local Playwright rerun | Environment blocked: the pinned Chromium binary was absent and the browser CDN returned truncated archives; merged CI and the controlled live-browser smoke provide the browser evidence for this audit |

Matching asset names are strong build-equivalence evidence, but the application does not expose a
commit identifier. PF-005.6 must still bind the final candidate commit, CI run, Pages deployment and
post-deployment smoke record explicitly.

### Live demo scenario

The live desktop audit used a fictional German scenario at a 1,348 px content viewport:

| Input | Value |
| --- | ---: |
| Purchase price | €250,000 |
| Bundesland | Baden-Württemberg |
| Renovation and moving/setup budgets | Confirmed €0 |
| Available equity | €66,250 |
| Purchase-price down payment | €50,000 |
| Nominal interest / initial repayment | 3.50% / 2.00% |
| Fixed-interest period | 10 years |
| Annual / one-time Sondertilgung | €5,000 in month 12 / €2,500 in loan month 12 |
| Monthly net cold rent | €1,000 |
| Non-recoverable Hausgeld | €150 per month |

Observed acquisition and financing results matched the documented rules: €16,250 acquisition costs,
€266,250 total project cost, €200,000 initial loan and €916.67 contractual monthly payment. The
Sondertilgung comparison reported €89,953.68 remaining debt after 10 years, €52,500 additional
principal, €9,735.05 fixed-period interest saved, €55,030.38 projected lifetime interest saved and
150 projected payoff months saved. German and English result formatting updated when the language
changed, and the active scenario remained intact.

The rental result exposed the gross-yield basis (€12,000 / €250,000), net-yield basis (€9,840 /
€266,250), monthly pre-tax cash flow, debt reduction and cash-on-cash return. The refinancing cards
used the debt after Sondertilgung and clearly labelled future rates as stress assumptions.

### Scenario and privacy smoke

Using only the fictional audit inputs, the deployed application saved a named Version 1.1.0 scenario
locally, showed that results are recalculated, and generated a fragment-based share link only after a
privacy confirmation. The share payload excluded the scenario name and remained after `#`. Static
review found no analytics or telemetry integration and no application network request that transmits
scenario inputs.

The audit did not clear browser storage, delete the saved record, or import a file into the live site.
Those destructive/file-selection paths require final controlled evidence. Unit and component tests
cover strict parsing, migration and invalid-data rejection, while REL-004 records the missing
release-level browser import journey.

## Gate scorecard

| Gate | Status on audited commit | Evidence and blocking disposition |
| --- | --- | --- |
| 1. Scope completeness | **Fail** | REL-001, REL-002 and REL-003 block the approved entry, repayment-detail and offer-price experiences. |
| 2. Calculation correctness and transparency | **Partial** | Domain fixtures and observed demo totals agree, but required period detail is not exposed and the offer empty state is misleading. |
| 3. Scenario integrity and privacy | **Partial** | Live save/share and static validation evidence pass; REL-004 requires a browser import/corruption journey. |
| 4. German and English quality | **Partial** | Both languages work and preserve state; REL-010 records inconsistent German address, and a complete copy sweep remains in PF-005.4. |
| 5. Accessibility | **Not passed** | Semantic landmarks, labels, skip link and visible focus are present, but REL-005 blocks the gate until automated and manual evidence exists. |
| 6. Responsive and browser behavior | **Not passed** | Automated Chromium checks cover shell widths and mobile comparison scrolling; REL-006 requires full-journey and supported-browser evidence. |
| 7. Deployment and routing | **Pass for this commit** | CI/deploy gating, hashed-asset match, base-path resources, hash-route entry, navigation and reload were verified. Re-run for the final candidate. |
| 8. Legal, privacy and content | **Partial** | Non-advisory footer, local processing and share warning are present; REL-007 and REL-009 require content hardening. |
| 9. Release operations | **Fail** | Critical/major findings remain, and REL-008 records the intentionally unfinished changelog, tag and final deployment evidence. |

## Findings

Critical and major findings block release. Minor findings require a merged fix or an explicit owner
and acceptance decision.

### REL-001 — Missing audience-specific entry paths

- **Severity:** Major
- **Gate:** 1 — Scope completeness
- **Evidence:** The home page has one generic “Kaufkosten starten” / “Start purchase costs” action.
  The approved product definition requires separate “Calculate for my own home” and “Evaluate a
  rental investment” starts with mode preservation.
- **Expected:** Two understandable entry paths set the analysis mode and retain shared property and
  financing inputs.
- **Actual:** Users must discover and select the mode later on the results page.
- **Remediation:** PF-005.3 must add both entry actions, preserve the chosen mode through the shared
  workspace, and add German/English component and Playwright coverage.

### REL-002 — Required amortization detail is not visible

- **Severity:** Major
- **Gates:** 1 and 2
- **Evidence:** The domain engine calculates month rows, but `/financing` exposes only summary cards.
  No period table or equivalent accessible breakdown is rendered. The product definition requires
  interest and principal by period, interest over selected horizons, and detailed tables/charts.
- **Expected:** A readable, keyboard-accessible repayment breakdown distinguishes scheduled
  principal, interest, Sondertilgung, closing balance and the fixed-period/projection boundary.
- **Actual:** Users cannot inspect or independently reconcile the schedule behind the summaries.
- **Remediation:** PF-005.3 must expose an accessible period/annual breakdown with projection labels
  and regression tests without duplicating calculations in the UI.

### REL-003 — Offer-price empty state reports zero missing assumptions

- **Severity:** Major
- **Gates:** 1 and 2
- **Evidence:** In both languages, `/results` renders “Add 0 missing planning assumption(s)” when no
  optional offer request is configured. `calculateOfferPriceFromDraft` returns
  `not-configured` with an empty `missing` list, which the generic `SetupRequired` component presents
  as an actionable missing-count state.
- **Expected:** The page should explain which offer method can be configured and direct the user to
  the relevant inputs; partial configurations should name their actual missing fields.
- **Actual:** The approved offer-price capability appears unavailable with contradictory guidance.
- **Remediation:** PF-005.3 must add a dedicated not-configured state, field-specific guidance and
  browser coverage for yield, affordability, comparable-value and opening-offer results.

### REL-004 — JSON import lacks a release-level browser journey

- **Severity:** Major evidence gap
- **Gate:** 3 — Scenario integrity and privacy
- **Evidence:** Unit/component suites cover schema validation, migration and round trips, but
  `e2e/app.spec.ts` has no JSON import workflow. The live audit did not select a local file.
- **Expected:** Playwright proves valid Version 1.1.0 import, Version 1.0.0 migration, malformed and
  unsupported rejection, and preservation of the active workspace on failure.
- **Actual:** A core transfer/recovery path is not verified at the release boundary.
- **Remediation:** PF-005.3 must add deterministic file-upload browser fixtures and assertions for
  recalculation and non-replacement on error.

### REL-005 — Accessibility gate has no complete audit evidence

- **Severity:** Major evidence gap
- **Gate:** 5 — Accessibility
- **Evidence:** Existing component and Chromium checks exercise semantic roles, the skip link, focus
  visibility and responsive navigation. No automated accessibility scanner is configured, and there
  is no recorded full keyboard or screen-reader-oriented review of all routes and confirmations.
- **Expected:** No serious/critical automated violations plus documented keyboard, focus, error/status
  announcement and screen-reader-oriented results for the complete workflow.
- **Actual:** The gate cannot be approved reproducibly.
- **Remediation:** PF-005.4 must add automated checks, remediate failures and publish a manual audit
  matrix using fictional inputs.

### REL-006 — Supported browser and full responsive evidence is incomplete

- **Severity:** Major evidence gap
- **Gate:** 6 — Responsive and browser behavior
- **Evidence:** CI runs only Desktop Chrome. Existing browser tests cover shell behavior at 375, 768
  and 1440 px and mobile comparison scrolling, but not the complete workflow at every width. No
  Firefox or Safari smoke record exists.
- **Expected:** The complete journey passes at the three required widths and current stable Chrome,
  Firefox and Safari, including long German text and intentional table overflow.
- **Actual:** Cross-browser compatibility and several responsive result/input states remain unproved.
- **Remediation:** PF-005.4 must close responsive defects, expand automated viewport coverage and
  record the required supported-browser smoke matrix.

### REL-007 — Result modules omit source and last-updated context

- **Severity:** Major
- **Gates:** 2 and 8
- **Evidence:** Purchase costs show assumption-set and source dates, but financing, refinancing,
  owner/rental and offer sections do not follow the product definition’s result hierarchy of source
  and last-updated information. Their user-entered rates are labelled as assumptions, but the page
  does not give a consistent calculation-specification/assumption-set reference.
- **Expected:** Every result module exposes the applicable version/source date and limitations without
  implying that user-entered market assumptions are sourced facts.
- **Actual:** Provenance is inconsistent across decision outputs.
- **Remediation:** PF-005.5 must add concise, bilingual provenance and date/version treatment aligned
  with `legal-and-privacy.md` and the calculation specification.

### REL-008 — Release operations are not yet complete

- **Severity:** Major release gap
- **Gate:** 9 — Release operations
- **Evidence:** The README correctly says release readiness is in progress, but there is no Version 1
  changelog, semantic release tag, candidate-to-deployment record or rollback verification.
- **Expected:** All blockers are closed, every minor has a disposition, the exact release commit is
  tagged, and the deployed artifact is smoke-tested with rollback evidence.
- **Actual:** The repository is correctly still a release-readiness build.
- **Remediation:** PF-005.6 must produce the exact-candidate gate record; PF-005.7 must publish the
  changelog, tag the approved commit, verify Pages and record rollback evidence.

### REL-009 — Home page exposes stale implementation copy

- **Severity:** Minor
- **Gate:** 8 — Legal, privacy and content
- **Evidence:** The deployed header says “Grundlage · 0.1” / “Foundation · 0.1”, and home copy says
  interactive calculators will be built step by step although the workflows already exist.
- **Expected:** Release-readiness copy accurately describes the current feature set without claiming
  that Version 1 is released.
- **Actual:** The landing page understates and dates the implemented product.
- **Remediation:** PF-005.5 must replace the stale label and copy in both languages and cover them in
  a shell/home test.

### REL-010 — German interface mixes informal and formal address

- **Severity:** Minor
- **Gate:** 4 — German and English quality
- **Evidence:** Main workflow copy uses informal forms such as “Gib” and “Nutze”, while success and
  footer text uses “Sie”, including “Jetzt können Sie” and “Prüfen Sie”.
- **Expected:** One documented German voice is used consistently across workflow, validation, legal
  and empty-state copy.
- **Actual:** The mixed address is visible within one journey.
- **Remediation:** PF-005.4 must select the approved voice, sweep all German resources and add copy
  regression assertions for representative routes.

### REL-011 — Production JavaScript exceeds the build warning threshold

- **Severity:** Advisory
- **Gate:** None; performance follow-up
- **Evidence:** The production JavaScript bundle is 659.35 kB minified (194.16 kB gzip), which triggers
  Vite's 500 kB chunk warning. No Version 1 performance budget or observed functional failure makes
  this a release blocker.
- **Expected:** Establish a measured loading target before changing bundling solely to silence the
  warning.
- **Actual:** All routes are delivered in one main JavaScript chunk.
- **Remediation:** After Version 1, measure the deployed experience on a representative mobile
  connection and split by route only if the agreed target is missed.

## Remediation and verification plan

| Task | Required closure evidence |
| --- | --- |
| PF-005.3 | Close REL-001 through REL-004 with component/unit tests and deterministic Chromium journeys. |
| PF-005.4 | Close REL-005, REL-006 and REL-010 with automated accessibility/viewport checks and a recorded manual browser/accessibility matrix. |
| PF-005.5 | Close REL-007 and REL-009; verify bilingual legal, privacy, metadata, source-date and assumption-version content. |
| PF-005.6 | Re-run every gate against one immutable candidate commit, reproduce both canonical demo scenarios, bind CI and deployment evidence, and confirm no critical/major finding remains. |
| PF-005.7 | Close REL-008 by publishing the changelog, tagging the approved commit, verifying the deployed tag and recording the rollback target/procedure. |

Any code change after this audit invalidates affected evidence. The final PF-005.6 smoke suite must run
again against the exact candidate, and PF-005.7 must repeat the deployment smoke after tagging.
