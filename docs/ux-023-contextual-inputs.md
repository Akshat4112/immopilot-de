# UX-023 — Contextual inputs and progressive disclosure

## Product decision

Keep the current financial calculation engine and input IDs intact. Present **Essentials** as the default view inside the existing contextual sidebar, with a clearly labeled **All details** switch. No fields are removed from the DOM, no defaults are silently overwritten, and the active strategy always determines which calculation sections the app already displays.

### Essentials retains the decision-critical inputs

- **Housing:** home price, deposit, purchase costs, interest, monthly payment and owner costs; for existing housing, the rented/owned choice, warm rent, home market value, current loan and repayment.
- **Household:** income mode, gross and actual take-home income, health insurance, monthly premiums, care-insurance status, marriage assessment, other income.
- **Expenses:** all recurring living-cost categories, other debts, savings transfers, available liquid capital and cash reserve.
- **Investments:** initial ETF amounts for each applicable household member, monthly contributions, modeled return and TER.
- **Rentals:** property-specific price/rent/financing inputs, with the existing depreciation and renovation disclosure intact.
- **Outlook:** projection horizon remains visible.

### Advanced detail

One explicit toggle exposes refinancing assumptions, extra repayments, fine-grained payroll and insurance parameters, future income/inflation settings, tax allowances, rental tax cash timing, ETF withdrawal mechanics, crash tests, risk simulations, comparison metrics and selling-cost assumptions. Rental depreciation and renovation details retain the existing native disclosure for compact property cards.

Each of the six sidebar sections receives a native `<details>` glossary with contextual explanations: Hausgeld, Grunderwerbsteuer, Sondertilgung, AfA, Kaltmiete, WEG reserve, PKV/GKV, TER, Sparer-Pauschbetrag, Vorabpauschale and planning assumptions.

## Important invariant

**Hiding advanced controls does not disable their values.** The app continues to use their current values in projections and taxes. If an advanced field has been edited away from its HTML default, Essentials reports the number of customized advanced settings still affecting results. Users can switch to All details at any time to view/edit them.

This feature does not reset anything and uses no new browser storage keys. Recomputations continue through the original event listeners; UX-023 performs only CSS visibility and informational label updates.

## Accessibility and visual QA

- Native buttons with `aria-pressed` show the active complexity mode. Native `details/summary` provides keyboard and screen-reader-friendly glossary expansion.
- Context/status text has live announcements for changed-but-hidden assumptions.
- Basic financial values stay in the DOM, avoiding alternate or stale state copies.
- Mobile: responsive wrap of the two buttons, no horizontal form overflow; toolbar is not sticky under 870px.
- Preserve the planned single/married and all seven investment combinations.
- Verify 320, 375, 768, 1024, 1440 widths and 200% zoom; theme/print/browser checks before merge.
- The legacy standalone planner still contains predominantly English strings. Full German/English glossary localization remains separate from this task.

## Automated checks

Playwright:
1. Essential housing inputs visible and advanced refinancing hidden.
2. Editing a refinancing rate in All details is preserved when hidden again, without clearing home price.
3. ETF-only mode shows ETF savings/returns, hides advanced allowance and explains the Vorabpauschale caveat.
4. Mobile buttons work without changing any of the chosen strategy flags.

## Dependencies / delivery

UX-020 #94 → UX-021 #95 → UX-022 #96 → UX-023. Do not merge UX-023 to main before its parent PRs pass and are reviewed.

The earlier UX-022 browser test was also amended to exercise visible Household/Investments controls rather than a hidden-field script mutation; this fix is committed to its parent branch and carried into this branch.

Tracks [UX backlog #93](https://github.com/Akshat4112/immopilot-de/issues/93).
