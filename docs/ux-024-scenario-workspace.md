# UX-024 — Saved scenarios: active plan, dirty state, undo and guarded backups

## Goal
Make the existing plan workspace safe and obvious without changing the model or local scenario storage schema. Data stays **in the user's browser**; backups contain financial information and must be treated as private.

## Experience
- A compact responsive scenario toolbar shows the **active saved plan** across the planner, even when browsing other calculation tabs.
- **Save as new plan** creates an independent named copy, up to 30 saved plans.
- **Save changes** overwrites only the currently active saved plan, after explicit user action. It is disabled if nothing has changed.
- An **Unsaved edits** indicator compares the canonical current calculator snapshot against the saved plan. Changing a field does not silently update saved results.
- Switching a saved plan shows a confirmation explaining that working inputs will change. Before switching, the current snapshot (including unsaved edits) is stored temporarily in **sessionStorage**.
- **Undo last load** restores the exact pre-load working snapshot and previous active plan. It is one-step, not a general undo history; refreshing the browser alone does not remove it, but closing the tab/session may.
- **Duplicate**, **Rename**, **Delete**, and comparison of **up to three** saved plans remain available. Different starting capital or horizons generate a visible comparability warning.
- The existing JSON backup is now exported as schema **version 2**. Both v1 and v2 backups can be restored. Imports reject unsupported schema versions, >30 records, >2MB files, invalid calculator fields, non-primitive rental inputs and malformed stored financial values. A failed import does not alter existing saved plans. A valid import still asks the user before replacing current saved plans.

## Compatibility and caveats
- Preserve original storage keys `home_etf_saved_scenarios_v9` and `home_etf_rentals_analytics_v7`, existing snapshot and result objects, and original calculator input IDs.
- Two additional small browser keys are used: `home_etf_active_scenario_v10` for the selected saved plan; `home_etf_undo_load_v10` in sessionStorage for one-step load undo.
- Comparisons use **saved snapshots**, not live unsaved edits. Projection outcomes remain estimates, and comparing scenarios with different periods or upfront capital may be misleading.
- Imported data is validated before it can be applied. An imported scenario is not automatically loaded.
- Cannot guarantee local storage survives private browsing, browser eviction, device loss or user clearing site data. Use JSON backup for portability.
- The sidebar input-density modes introduced in UX-023 remain unchanged.

## Release checks
1. New plan -> change property price -> status **Unsaved edits** -> Save changes -> status **Saved**.
2. Duplicate a plan, switch between two saved plans, then undo to recover unsaved changes that existed before the switch.
3. Compare up to three plans, reject a fourth selection and warn on mismatched horizons or initial capital.
4. Import a deliberately malformed backup; no data loss. Import a valid v1 exported backup and confirm the migrated records remain loadable. Verify v2 export.
5. Manual test keyboard navigation, dark theme, 320/375/768/1024/1440px and 200% zoom. Include responsive screenshots.
6. Latest head CI, Playwright, and GitHub Pages deployment must succeed before considering a release complete.

Tracks [issue #93](https://github.com/Akshat4112/immopilot-de/issues/93).
