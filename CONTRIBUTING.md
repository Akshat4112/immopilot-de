# Contributing to ImmoPilot DE

ImmoPilot DE is a client-side, bilingual (German/English) German property-finance calculator. **Version 1 is not released.** Contributions must preserve deterministic calculations, local-only user data, accessible workflows and explicit source provenance. This guide implements tracker task QA-019; it does **not** waive legal, security, accessibility or release approvals.

## Prerequisites and local setup

Use the versions declared in `.nvmrc` and `package.json` (Node 24, npm 11), with a clean lockfile install:

```sh
nvm use
npm ci
npx playwright install chromium firefox webkit
npm run dev
```

Never regenerate `package-lock.json` casually or install unreviewed dependencies. Do not commit `node_modules/`, `dist/`, generated reports, local scenario data or browser artifacts.

## Branches, commits and pull requests

1. Start from the latest `main`. Use one branch per tracker task, e.g. `feat/pf-xxxx-short-description`, `fix/qa-xxxx-short-description`, or `docs/qa-019-contributing-guide`. Avoid mixing unrelated tasks.
2. Read the canonical implementation tracker and linked product/financial specifications. Record the task ID, acceptance criteria, dependencies and release gates before editing. A blocked dependency is not permission to skip it.
3. Make the smallest coherent change. Include both German and English text for user-facing changes, including error, empty and accessibility states. Do not silently change financial assumptions or existing persisted-data schemas.
4. Add or update unit/component and browser regression tests appropriate to the behavior. Document explicit unsupported cases and manual evidence still required.
5. Open a PR against `main` with task ID, scope, acceptance-criteria mapping, risk/privacy assessment, test commands, evidence links, exact head SHA and outstanding gates. Use a draft PR while checks are pending.
6. Review the final diff and required GitHub checks **on the latest head and merge candidate**. Merge only after formatting, lint, types, coverage, build, artifact verification, dependency audits and three-browser Playwright are green, the branch is mergeable and no blocking review remains. Recheck after pushing fixes; a green run for an older commit is insufficient.
7. After merging, verify the merge SHA and update the **same canonical Library tracker** with exact status, PR, SHA and evidence. Never overwrite a newer workbook version. Record blockers honestly.

Do not auto-approve legal text, financial source changes, security exceptions, accessibility sign-off or release/deployment gates. Version 1 deployment requires the separately documented release-readiness contract.

## Required checks

Run these before requesting review:

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run release:verify -- "$(git rev-parse HEAD)"
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
npm run test:e2e
```

The release verification command must be executed on a clean, exact candidate commit after building; working-tree changes can invalidate the artifact identity. CI repeats these checks. Playwright runs Chromium, Firefox and WebKit; inspect failure traces and screenshots, not just aggregate test counts. Test runs are not a substitute for manual keyboard, screen-reader, contrast, print/PDF and mobile review where a task or release gate requires them.

## Calculation and schema changes

Read `docs/calculation-specification.md`, `docs/calculation-engine-conventions.md`, `docs/assumptions-schema.md`, and `docs/terminology.md` before changing any financial rule.

- Specify the exact formula, units, timing convention, rounding point and treatment of missing/invalid/cash values. Use `decimal.js` and integer cents where the existing contract requires them; avoid floating-point money calculations.
- Preserve canonical fixtures and add boundary/golden-vector regressions (zero interest, early payoff, partial final periods, Sondertilgung caps, refinancing boundaries, negative cash flow, long schedules and locale-sensitive inputs as relevant).
- Distinguish fixed-interest-period facts from projections and lender commitments. Never present assumptions as verified quotations or financial advice.
- If a persisted input schema changes, define versioned migration, compatibility, invalid-input recovery and data-preservation tests. Do not silently delete or upload user scenarios.
- Have an independent reviewer check formula/spec alignment and both language labels before merging material calculation changes.

## Updating rates, legal references and financial sources

1. Identify the canonical assumption file and documentation (start with `docs/grunderwerbsteuer-rates.md`, `docs/acquisition-cost-assumptions.md`, `docs/assumptions-schema.md` and the bundled source metadata). Search for every consumer of the value.
2. Prefer authoritative German state, statute or regulator sources. Record source title, publisher, direct URL, document/publication date, **date verified**, effective date and jurisdiction. Distinguish unknown publication dates from verification dates.
3. Confirm the rule is effective for the intended date; do not confuse an announcement, future law or proposed rate with current law. Obtain operator/legal approval when required. If a source cannot be verified, keep the task blocked rather than inventing a date or rate.
4. Update the versioned assumptions and provenance together with user-facing explanations in German and English. Keep source-backed defaults distinguishable from editable planning estimates and user overrides.
5. Add regression tests for affected Bundesländer, dates, override paths, calculations, import/migration, reporting and provenance. Update golden fixtures only after independently checking the expected values.
6. Document the old/new value, legal basis, effective date, impact, approval, test evidence and any release/manual follow-up in the PR and tracker. Never silently alter historical snapshots or imply a source was freshly checked when it was not.

## Privacy, accessibility and security

Version 1 is browser-local. Do not add remote scenario processing, analytics, tracking, cookies or external dependencies without explicit product/privacy review. Protect saved data, import/export, share URLs, reset and print/PDF flows; do not leak property names into filenames, logs or network requests. Use semantic labels, keyboard focus management, responsive layouts and tested German/English strings. Review dependency advisories and document any security exception rather than weakening audit thresholds.

## Release boundaries

See `docs/version-1-release-contract.md`, `docs/version-1-release-audit.md` and `docs/pf-0056-release-candidate-verification.md`. CI success means the code checks passed, **not** that legal/operator approval, manual accessibility, real-device behavior, browser print/PDF review or a Version 1 release sign-off has occurred.
