# UX-029 — Mortgage Interest, Principal & Equity Explorer

## Goal and scope

Replace the simple yearly mortgage bar/line chart in the **Compare** tab with an auditable, interactive **mortgage + property equity explorer**. It supports either the primary/existing home loan or one of up to four selected rental-apartment loans, using the existing principal, mortgage interest, monthly payment, amortization period, refinancing rate and expected property appreciation assumptions.

The explorer shows an **independent what-if** in which the user pays **an additional annual special repayment**, on top of any existing special repayment already set in the household loan inputs. The what-if is not included in the primary financial forecast, net household cash flow, rental income/taxes, or wealth projection. It is a capital allocation thought experiment, not a claim that earlier repayment creates free wealth.

## Ledger and definitions

The same monthly loan-accounting identity as the canonical own-home simulator is used for both baseline and comparison:

```
Monthly interest accrued = opening monthly debt × current annual rate / 1200
Scheduled payment = min(monthly payment setting, opening monthly debt + monthly interest)
Principal portion of scheduled payment = max(0, scheduled payment - accrued interest)
Unpaid interest = max(0, accrued interest - scheduled payment)
Debt after scheduled payment = opening debt + accrued interest - scheduled payment
Annual special repayment (at year-end) = min(annual allocation, remaining debt)
Annual closing debt = annual opening debt + annual accrued interest
                     - annual scheduled cash payments - annual special repayment
```

This distinguishes **interest accrued**, **scheduled cash actually paid**, **principal repayment**, **regular extra repayment**, and **unpaid interest capitalized into debt**. If payments cannot cover interest, debt increases and a prominent warning appears rather than showing negative cash as negative principal. Mortgage repayment cannot exceed principal plus interest and no special repayment can exceed the debt still outstanding.

- The **home loan** inherits its fixed-rate period and entered post-fix refinancing rate; the what-if does not alter the entered monthly payment. Existing home mortgage input mappings are maintained.
- The **rental loan** inherits the selected property's nominal annual interest and monthly scheduled payment, assumed constant throughout the planning window. The what-if adds a special repayment, which is **not** reflected in the rental tax, cash-flow or AfA calculations elsewhere in Immopilot-DE.
- For both paths, **property market value** in year `y` = selected property price × `(1 + annual assumed appreciation / 100)^y`. **Signed property equity** = value minus the modeled loan balance; it can be negative.
- **Annual interest avoided by the what-if** = cumulative accrued interest on baseline loan less cumulative accrued interest on the comparison loan. This is a **gross financing benefit** before opportunity cost of the extra cash, Sondertilgung contractual limits, prepayment fees, taxes or other costs.
- The **payoff indicator** extrapolates both selected contractual interest/payment rules for up to 100 years; if the loan has not amortized, it says so. This is a mathematical illustration, not a bank offer or forecast of future refinancing.
- The what-if amount is a normal planner input saved with the existing scenario snapshot; it is **separate from** `extra` / `existingExtra` and does not modify the baseline mortgage.

## Four ways to explore

1. **Debt & equity:** yearly signed property equity, property value, baseline debt, what-if debt and what-if equity.
2. **Interest & principal:** annual bars for accrued interest, scheduled principal and regular extra repayment. Capitalized interest is reported in the table and warning, not hidden.
3. **Interest savings:** cumulative accrued baseline interest, what-if interest and interest avoided.
4. **Annual table:** exact values including opening/closing balances, accrued interest, cash paid, scheduled principal, regular extra paid, capitalized unpaid interest, net debt reduction, market value, signed equity, comparison debt/equity, what-if extra paid and interest savings.

The 5/10/20/30/full range control filters only this visualization. It does not change the underlying investment horizon or saved mortgage, and year 0 is the opening position. Chart markers and table rows can be selected by mouse, keyboard focus, Enter or Space, with a detailed textual reconciliation and exposed `data-amort-*` values for exact tests. Narrow screens default to the table.

## Correctness checks

- Mortgage schedule reconciles each year with `opening debt + accrued interest − scheduled payment − special repayments = closing debt` to cent precision.
- The baseline schedule is checked against the existing **`simulate(x)` own-home** loan balance or the chosen **`simulateRentalProperty()` rental** loan balance. The page explicitly exposes `data-mortgage-reconciled`; any discrepancy greater than €0.05 triggers a warning. This is particularly important if a rental loan cannot fully cover interest, because the legacy rental tax/cash engine uses a different simplified loan rule.
- Extra special repayments never change the original home mortgage payment, existing base annual extra repayment, core household projected net worth, or modeled rental income tax.
- Zero extra what-if must produce **identical** baseline and comparison paths.
- A negative amortization case shows capitalized interest and signed negative property equity if debt exceeds property value.
- A loan-free ETF-only strategy shows no invented repayment benefits.

## Testing

Eight Playwright browser tests validate the opening principal, annual loan identities, reconciliation to live household equity rows, baseline vs special-payment difference, persistent comparative input, negative amortization, rental loan selection and limitations, loan-free modes, chart modes, range selection, keyboard details and mobile table.

### Important financial limitations

Future lending rates are user assumptions. Lender-specific Sondertilgung limits, penalties, payment rescheduling, insurance, tax deductibility, full rental tax assessment, mortgage registration/discharge charges, property transaction fees and inflation-adjusted cash returns are **not** re-estimated here. The model should not rank extra repayments against ETFs solely using its gross interest-avoided figure; doing so requires an equal-cash-flow opportunity-cost and tax comparison.

No investment advice or binding mortgage offer is implied.

Tracks [UX roadmap #93](https://github.com/Akshat4112/immopilot-de/issues/93); follows UX-028 PR #102.
