# UX-021 — Goal-first onboarding and strategy selection

## User journey

The Overview page now begins with four approachable, explicit goals:
- Grow ETFs
- Buy a home to live in
- Buy a property to rent out
- Combine strategies

Selecting one opens the existing **Plan my goals** dialog, now redesigned as a compact three-step wizard:

1. **Household:** Single person / Married couple
2. **Current housing:** Renter / Own with mortgage / Own outright
3. **Investment strategy:** All seven supported combinations (ETF only, own home only, rental only, ETF + home, ETF + rental, home + rental, all three)

All choices start from the current state and are held in an ephemeral draft. Back preserves selections; **Close/Escape makes no changes**. Only Finish applies the selected profile and investment strategy, reusing the existing calculation handlers; existing housing type is then applied as the current baseline. Unselected investment form values and saved scenarios remain intact. A successful ETF-only selection navigates to the Investments tab; other combinations open Properties. Users can still adjust the Household tab and save named scenarios separately.

## Non-goals
- No new tax, mortgage, rental or ETF formulas.
- No automatic data imports, account creation or server storage.
- No automatic overwrite of saved scenarios.
- No new default financial assumptions; the wizard uses existing live inputs.

## Acceptance checks
- E2E: ETF-only path requires no property purchase, switches to single household and opens Investments.
- E2E: Cancel after editing the draft preserves current profile, housing, investment amounts and all original inputs.
- E2E: Switching away from a strategy and back retains home price and existing property data.
- E2E: The seven strategy choices are present on a narrow mobile screen.
- Manual: keyboard Tab/Shift+Tab, Escape, focused control after each Next, reduced motion, both themes, 200% zoom, copy clarity, mobile scrolling and EN/DE consistency.
- Confirm changes have not affected the existing local scenario schema or calculations.

## Dependencies

UX-020 PR #94 provides the refreshed workspace shell. UX-021 is stacked on UX-020 so that the new goal cards and dialog inherit its shared design tokens. Merge UX-020 first once verified, then retarget this PR to main after CI and review.

Tracks: https://github.com/Akshat4112/immopilot-de/issues/93
