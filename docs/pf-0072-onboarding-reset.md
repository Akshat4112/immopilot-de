# PF-007.2 — First-use guidance and safe reset controls

**Implementation:** `feat/pf-0072-onboarding-reset-controls` (Version 1 release candidate)
**Dependencies:** PF-007.1 canonical fictional examples, merged in PR #79.

## Entry flow

The home page offers a non-modal, German/English three-step guide while the active workspace
has no configured purchase price, financing amounts or owner/rental analysis inputs. The user
can begin a blank owner-occupier or rental-investment scenario, or use either fictional
PD-010 example below the guide. Once working inputs are entered the guide no longer occupies
the landing page. No cookies, onboarding-dismissal key or browser-storage write are needed.

The guide explains acquisition costs, financing, interpreting results and voluntary local
saving. The existing demo controls still explicitly warn before replacing current data.

## Resets

The Saved scenarios page has a dedicated **Reset inputs and local data** section. Every action
shows the *specific deletion scope* in a confirmation alert dialog with Cancel and Confirm.
No changes occur at the first click.

| Scope | Removed | Preserved |
| --- | --- | --- |
| Purchase costs | In-memory purchase price, state, commission, renovation and moving budgets | Financing, analysis, all saved scenarios |
| Financing | In-memory equity, mortgage, rate/fixed-period and extra repayments | Purchase costs, analysis, saved scenarios |
| Analysis | In-memory owner/rental choice, rent, expenses and comparison/offer inputs | Purchase costs, financing, saved scenarios |
| Workspace | All in-memory inputs and fictional-example marker | Local saved-scenario library |
| All ImmoPilot local data | All workspace inputs and the `immopilot-de.scenarios.v1` saved-library key; pending share URL display and pending scenario actions | Browser data belonging to unrelated applications, files already exported and external/shared link copies |

Any module reset also clears the active fictional-example marker because the edited workspace
no longer equals the complete approved demo. Every calculation is freshly derived from the
resulting inputs; no calculated output cache is stored or deleted.

Deleting all local data is **not** a broad `localStorage.clear()`; it calls the existing
`clearScenarioLibrary` helper, which removes only `SCENARIO_LIBRARY_STORAGE_KEY`. If
storage deletion fails, the workspace and saved-library UI are left unchanged and an error is
displayed; the user can retry or cancel. If the page was opened from a shared-scenario URL,
the reset removes that payload from the current address bar, but cannot revoke copies held
elsewhere.

Previously downloaded JSON/PDF reports are outside the browser application's control.
Deleting data locally does not retroactively redact messages, links or backups.

## Quality gates

- Unit: scoped module isolation and demo-marker invalidation.
- Component: opt-in/cancel, precise German/English warnings, failure path, confirmed all-data
  reset and preservation of unrelated browser storage keys.
- Browser: first-use blank entry/mobile overflow; saved scenario cancellation and all-data
  deletion across Chromium, Firefox and WebKit.
- Existing save/import/share/compare flows and report tests must remain green.

**Release boundary:** PF-007.2 does not close legal/operator approval, final accessibility
verification, production smoke tests or V1 publication gates.
