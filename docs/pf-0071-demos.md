# PF-007.1 — Selectable fictional property demos

**Status:** Implementation candidate; release approval remains separate.
**Source:** [PD-010 canonical examples](demo-scenarios.md), assumption set `de-2026.09`.

## User journey

The homepage offers two optional examples **separate from** the blank owner-occupier and rental-investment entry paths:

- **Own home:** Fictional Baden-Württemberg apartment for €250,000, €66,250 equity, €200,000 loan and the matched-budget rent-versus-buy analysis.
- **Rental investment:** Fictional Baden-Württemberg apartment for €240,000, €10,000 renovation, €192,000 loan, €1,000 monthly net cold rent, and negative €180 monthly pre-tax cash flow.

Selecting a demo first asks users to acknowledge that loading it replaces **current unsaved inputs**. Cancel leaves the workspace unchanged. Confirm loads the validated inputs into the existing in-memory scenario workspace and opens Results. A visible fictional-example notice remains on every route; **Reset example** clears only the working inputs and returns to Purchase costs.

Neither loading nor resetting a demo reads, writes or deletes the saved-scenario library. Saving is only possible via the existing explicit Save scenario action. Loading a saved scenario clears the active-demo badge; ordinary edits to demo inputs retain the fictional-data notice until reset or replacement.

## Contract and limitations

- Reuse the unchanged canonical JSON files under `examples/scenarios/`. The adapter checks document identity/schema/assumption/specification versions and passes the transformed draft through `scenarioInputsSchema.parse`, the same validation schema as saved/imported scenarios.
- Canonical cent amounts and decimal rates become typed editable inputs; no financial calculation results or private identifiers are embedded in the workspace.
- Default statutory and planning acquisition rates use the same source-backed assumption-set defaults as the application, not falsely marked user rate overrides. Canonical example regressions protect their financial outputs.
- The comparable-offer form requires an explicit user offer. The demo sets it to the documented asking price as a neutral **UI-only** starting input; no extra investment strategy or valuation assumption is inferred.
- The demos do not assert current interest rates, market rents, property listings, lender approval, tax treatment or investment advice. The scenarios are fixed illustrations, not market feeds.
- PF-007.2 will separately own full first-run onboarding and comprehensive module reset controls.

## Verification

`src/features/demos/demoScenarios.test.ts` checks canonical euro/rate mapping, budget semantics, exact mortgage figures, both analysis modes and fresh input isolation. `HomePage.test.tsx` verifies consent/cancel, preserved saved-browser bytes and DE/EN controls. `App.test.tsx` checks persistent fictional labeling and localized reset. `e2e/demo-scenarios.spec.ts` exercises the real entry/confirmation, results, locale, reset, local-storage boundary and narrow-viewport rental experience in Chromium, Firefox and WebKit.

Do not mark Version 1 released from this PR: the separate RC-006/RC-007 and operator/legal gates remain open.
