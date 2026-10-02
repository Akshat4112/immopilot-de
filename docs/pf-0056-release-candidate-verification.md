# PF-005.6 release-candidate verification

- **Review date:** 2 October 2026
- **Reviewer:** Codex
- **Disposition:** **No-go for the Version 1 release**
- **Deployed baseline:** `f1d34d7d680980ec16ab97ad2d562967359e0c1c` (merged PR #57)
- **Candidate application source:** `a6f9d6a7be2e1d27026a603e5d8f27adfb9a535a`
- **Application:** <https://akshat4112.github.io/immopilot-de/>
- **Review PR:** [#58](https://github.com/Akshat4112/immopilot-de/pull/58)

This record applies [the release contract](version-1-release-contract.md). It separates evidence for
the deployed baseline from the unmerged candidate. Successful CI does not waive missing manual
browser evidence or the existing operator-detail/legal-review blockers. No release tag or declaration
is made by PF-005.6.

Documentation-only follow-up commits do not change the application asset digests. The final PR CI must
still pass on the final PR commit. After merge, the new main commit must receive its own successful CI,
Pages deployment, artifact verification and live smoke before approval can be reconsidered. A PR
commit, GitHub's temporary PR merge commit and the final main merge commit are distinct identities.

## Gate decisions

| Gate | Decision | Evidence and remaining work |
| --- | --- | --- |
| 1. Scope completeness | Pass for automated scope checks | Owner/rental starts, mortgage breakdown, offer methods, persistence and three-scenario comparison are covered by the domain, component and browser suites. No feature was added outside Version 1. |
| 2. Calculation correctness and transparency | Pass for deterministic fixture checks | All domain fixtures pass; canonical source-file SHA-256 digests match PD-010. Both demos are reproduced through the composition engine and the deployed UI. Candidate browser tests check both financial endpoints in German and English on Chromium, Firefox and WebKit. |
| 3. Scenario integrity and privacy | Pass for implemented automated checks | Existing suites cover save/load, rename, duplicate, deletion/reset, comparison, current/legacy JSON import, malformed/unsupported rejection, export/share confirmations and repayment restoration. Static inspection finds no application backend, analytics or remote reporting. The canonical rental browser check rejects non-GET requests and application errors and asserts an empty cookie jar. This is a technical processing check, not legal approval. |
| 4. German and English quality | Pass for automated checks and reviewed live endpoints | Resource, parser and formatter tests pass. The live owner and rental endpoints preserve their figures when switching language. Browser workflows include bilingual navigation and populated results; formal German-address regressions remain covered. |
| 5. Accessibility | Partial; not approved | Candidate tests scan all public routes, confirmations and populated owner/rental results, check keyboard/skip-link behavior, and require five distinct provenance landmark names in both languages. The duplicate labels from PR #57 are fixed. Final manual keyboard and screen-reader-oriented evidence must be recorded for the eventual deployed candidate. |
| 6. Responsive and supported browsers | Partial; not approved | Automated complete workflows cover 375, 768 and 1440 px on Chromium, Firefox and WebKit. The available cloud Chrome browser reproduced both deployed demos. Installed stable Chrome, Firefox and Safari manual smoke evidence is still absent; Playwright WebKit is not a branded Safari pass. |
| 7. Deployment and routing | Pass for deployed baseline; candidate pending | Baseline main CI and Pages deployment succeeded, and all four public files match a clean build byte-for-byte. The candidate adds a commit/digest manifest and prevents manual Pages dispatch from bypassing successful main CI. Candidate changes must be merged and deployed before their live identity/routing gate can pass. |
| 8. Legal, privacy and content | Fail; release blocked | Bilingual notices, dates, versions, limits and metadata are present. `legal-and-privacy.md` still requires verified operator name, contact email, postal address, any required Impressum and German legal review. Those details and approval cannot be inferred from GitHub/profile information. |
| 9. Release operations | Deferred; not approved | README remains at release readiness. Changelog, release tag, approved-deployment smoke and rollback evidence belong to PF-005.7 after blocking gates pass. REL-008 remains open. |

## Exact-commit quality evidence

The clean merged baseline passed formatting, ESLint, TypeScript, 43 files / 319 unit and component
tests, build and both npm audits. Baseline Actions evidence:

- [main CI](https://github.com/Akshat4112/immopilot-de/actions/runs/37062096643);
- [Pages deployment](https://github.com/Akshat4112/immopilot-de/actions/runs/37062546094).

Candidate local checks passed formatting, lint, TypeScript and 43 files / 320 tests. Coverage remained
90.93% statements, 85.63% branches, 90.43% functions and 92.16% lines. Production and full npm audits
both report zero vulnerabilities. The production build still emits the previously recorded advisory
bundle-size warning (REL-011); it is not silently promoted to a release blocker.

The candidate browser suite enumerates 30 project/test combinations using Playwright 1.63.0 on the
Ubuntu GitHub runner: Chromium 153.0.8010.12, Firefox 155.0 and WebKit 26.6 (pinned revisions
1243, 1543 and 2359). Local pinned-browser installation
failed because the CDN delivered a truncated Chromium archive. GitHub Actions is authoritative for the
pinned-engine execution; do not describe this environment failure as an application-test pass.

## Canonical calculation evidence

The input files retain the digests recorded in PD-010:

| Input | SHA-256 |
| --- | --- |
| `examples/scenarios/owner-occupier.json` | `48fcd1b597507a3b5f340c44defe36fb0b5d11803a4a1605bd3d6a91c124111e` |
| `examples/scenarios/rental-investment.json` | `36b9b0c5721b8f7cb59fca1147758c1432cacbdf6cfab214578b494ca57f5f62` |

The domain fixture and composition tests compare integer-cent results without accepting a one-cent
tolerance. Relevant tests include `src/domain/scenarios/compose-property-scenario.test.ts`, the
PD-010 acquisition/financing/mortgage vectors, rent-versus-buy and rental-investment fixtures, and
the additional-repayment and refinancing fixtures.

The live cloud Chrome review used the complete fictional inputs in [demo-scenarios.md](demo-scenarios.md),
including owner-cost growth of 0%, rental vacancy of 5%, rental maintenance of €1,200/year and zero
rental income/cost growth. No private property data was used. Observed baseline values matched:

| Output | Expected | Observed live |
| --- | ---: | ---: |
| Owner initial loan | €200,000.00 | €200,000.00 |
| Owner monthly payment | €916.67 | €916.67 |
| Owner fixed-period debt | €152,188.73 | €152,188.73 |
| Owner buyer net wealth | €144,104.59 | €144,104.59 |
| Owner renter net wealth | €119,489.86 | €119,489.86 |
| Buyer minus renter | €24,614.73 | €24,614.73 |
| First owner break-even | Year 6 | Year 6 |
| Rental initial loan | €192,000.00 | €192,000.00 |
| Rental monthly payment | €880.00 | €880.00 |
| Rental fixed-period debt | €146,101.59 | €146,101.59 |
| Rental monthly pre-tax cash flow | -€180.00 | -€180.00 (before and after zero extra repayments) |
| Rental ten-year net sale proceeds | €137,680.31 | €137,680.31 |
| Rental ten-year pre-tax profit | €42,480.31 | €42,480.31 |

Both live endpoint reviews switched to English without changing the scenario or amounts. Whole-euro
values intentionally omit `.00`/`,00` in the interface. The new candidate browser test asserts both
before/after cash-flow cards rather than using an ambiguous single-element locator.

## Deployed baseline identity

A detached clean worktree of the merged baseline was rebuilt with Node 24.19.0, npm 11.9.0 and the
committed lockfile. HTTP responses were 200, and the following SHA-256 hashes matched local bytes:

| Public file | SHA-256 |
| --- | --- |
| `index.html` | `85f9675cafb5420f0f0b29e56ee06eb30729b09cb16f787ea23b08cfe2e7c0d1` |
| `favicon.svg` | `19b065bcfcf98bd669e80bbd50f1f888426c4621e3eee82d4d25847af7c85e92` |
| `assets/index-YjtyW_g2.js` | `f43494d01681e291a10a189432471dcd3afb1b53b2d8d4ce8e3655f735942d8e` |
| `assets/index-hu8P88S6.css` | `8b8901cf491fc50e60402726f72b282c235fb8b56e5469d7d135d9841dccb23d` |

Candidate assets are `assets/index-BuOxAfTJ.js` and `assets/index-CFMJ0NK6.css`; they are not claimed
to be live before merge. The
manifest establishes a public artifact inventory and declared source commit, not a signed attestation;
the successful exact-SHA CI and Pages workflow links are still required.

Direct entry and reload were exercised in the cloud Chrome browser for all seven baseline routes:
`#/`, `#/purchase-costs`, `#/financing`, `#/results`, `#/scenarios`, `#/comparison` and `#/privacy`.
Each retained the `/immopilot-de/` base path, loaded its page heading, and exposed its expected German
route title. This baseline smoke does not approve the unmerged candidate's deployment.

## Candidate fixes and reproducible verification

1. Scope-specific bilingual accessible labels distinguish every provenance landmark. Integration and
   populated-result browser assertions cover all five result panels.
2. `npm run build` generates `dist/release.json` with the actual Git HEAD, dirty-worktree flag,
   application base path and SHA-256 inventory of HTML, favicon, JavaScript and CSS.
3. CI and Pages verify the generated inventory. Manual Pages starts now require a successful **push CI
   on main for that exact SHA**, just like automatic deployments; a missing match fails before upload.
4. The public verifier checks the expected commit, clean-worktree flag, safe unique paths, file presence
   and every downloaded digest. It never reads scenarios or sends financial inputs.
5. Populated rental-result axe scans found a serious contrast defect in the sale-detail text on all
   three rendering engines. Its previous colors produced 4.21:1 contrast; the summary-card detail now
   uses the semantic primary text color, giving 12.94:1 on the measured summary background. The
   populated-result scan remains enabled in both languages as the regression check.

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
npx playwright install chromium firefox webkit
npm run test:e2e
```

After a successful exact-SHA main CI and Pages deployment, verify public bytes:

```bash
npm run release:verify -- EXACT_DEPLOYED_MAIN_SHA https://akshat4112.github.io/immopilot-de/
```

The verifier was exercised against a clean candidate build and deliberately corrupted manifests. It
rejected a wrong commit, dirty-worktree flag, `../` path and mismatched asset digest; restoring the
original manifest passed again.

## Findings and next action

| Finding | Severity / disposition | Owner and closure condition |
| --- | --- | --- |
| REL-012 — duplicate provenance landmarks | Major accessibility defect; fixed in this PR | Codex; merge fix and repeat populated-result checks on deployed candidate. |
| REL-013 — manual Pages deployment bypasses CI | Major deployment-control defect; fixed in this PR | Codex; exact-main-CI guard and artifact check must be present in the merged/deployed workflow. |
| REL-014 — final manual browser/accessibility evidence missing | Major evidence gap; open | Release reviewer; record versions, OS, viewports, keyboard and screen-reader-oriented results on the eventual deployed candidate, including stable Chrome/Firefox/Safari. |
| REL-015 — operator details/legal review missing | Major existing release blocker; open | Site operator and legal reviewer; complete the requirements explicitly stated in `legal-and-privacy.md`. |
| REL-016 — new candidate not deployed | Candidate gate pending; expected before merge | Release reviewer; bind final main SHA, successful CI/deploy, manifest digest verification and live smoke. |
| REL-017 — rental sale-detail contrast | Major accessibility defect; fixed in this PR | Codex; use primary text color in summary details and require populated-result axe scans in both languages on all three engines. |
| REL-008 — release operations | Deferred to PF-005.7; open | Release owner; publish changelog/tag and deployment/rollback record only after required gates pass. |
| REL-011 — bundle size | Advisory retained | Post-Version-1 performance owner; measure before setting a loading budget or splitting routes. |

PF-005.6 has produced reviewable fixes and a verification record, but **the release gate remains
open**. Merge is not equivalent to release approval. Complete REL-014, REL-015 and REL-016 and update
this record against the final deployed SHA before advancing to a Version 1 release declaration.
