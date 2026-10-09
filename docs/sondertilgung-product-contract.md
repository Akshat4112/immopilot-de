# Sondertilgung product contract

**Status:** Approved implementation contract for PF-004  
**Contract version:** 1.0.0  
**Established by:** PF-004.1

## Purpose

PF-004 exposes the existing framework-free Sondertilgung engine in the shared scenario workflow.
This contract fixes the Version 1 input, timing, comparison, persistence and presentation decisions
that PF-004.2 through PF-004.12 must implement.

The calculation rules in `calculation-specification.md` remain normative. This document defines how
the application collects those inputs, selects the resulting schedule and communicates the outputs.
It does not introduce a new repayment formula.

## Version 1 boundary

Version 1 supports:

- one recurring fixed euro amount paid once in every loan year;
- a selectable recurring payment month from 1 through 12, defaulting to month 12;
- zero or more one-time fixed euro amounts assigned to positive whole loan months;
- an otherwise identical baseline-versus-Sondertilgung comparison; and
- an unchanged contractual monthly annuity after a Sondertilgung.

Version 1 does not model contractual entitlement, lender approval, percentage-based allowances,
fees, minimum amounts, notice periods, calendar dates, payment reductions or automatic payment
recalculation. Users must confirm those conditions with their lender. A future payment-reduction
mode requires a separate contract and must not be inferred from the existing inputs.

## Input contract

Sondertilgung belongs to the shared financing draft because it changes the amortization schedule
without changing acquisition costs or the initial loan amount.

| Input | Draft representation | Default | Required rule |
| --- | --- | --- | --- |
| Annual amount | Locale-formatted euro input string | Empty, calculated as zero | Non-negative amount |
| Annual payment month | Whole-number input string | `12` | Integer from 1 through 12 when an annual amount is present |
| One-time repayments | Ordered input rows | Empty list | Each complete row has an amount and a positive whole loan month |
| One-time amount | Locale-formatted euro input string | Empty in a new row | Non-negative amount |
| One-time payment month | Whole-number input string | Empty in a new row | Integer from 1 through 1,200 |

The workspace retains the user's locale-formatted input strings. The calculation adapter converts
amounts to integer cents and months to integers before calling the domain engine. It must not parse
formatted output strings or store calculated schedules.

An incomplete one-time row is invalid rather than silently ignored. One-time months must be unique.
The interface sorts completed rows by month after editing or loading. A recurring and a one-time
repayment may occur in the same month and remain separate inputs because the engine adds them before
applying the balance cap.

The 1,200-month one-time input limit matches the supported amortization horizon. The interface does
not invent a lender-specific euro or percentage cap. All amount inputs must still satisfy the
application's safe integer-money boundary and the existing JSON and share-link payload limits.

## Timing and calculation rules

Loan month 1 is the first monthly payment period. The recurring month repeats within each loan year:
month 12 means loan months 12, 24, 36 and so on; month 3 means loan months 3, 15, 27 and so on.

For each eligible month, the engine:

1. accrues and rounds monthly interest;
2. applies the regular payment and scheduled principal;
3. adds the eligible recurring and one-time repayments;
4. caps the additional principal at the remaining balance; and
5. reduces the closing balance by the capped amount.

The contractual monthly payment remains unchanged. Repayments after payoff have no effect. If the
regular payment and the eligible Sondertilgung repay the loan in the same month, the final amounts
are capped so the closing balance is exactly zero.

The baseline and Sondertilgung schedules use identical purchase, financing, rate, repayment and
fixed-interest inputs. The additional-repayment plan is the only difference.

## Selected schedule and downstream calculations

When the user has a valid non-zero Sondertilgung plan, the Sondertilgung schedule becomes the
selected debt schedule for dependent results. The baseline remains visible only for comparison.
Removing the plan restores the baseline schedule without changing unrelated inputs.

| Consumer | Required treatment |
| --- | --- |
| Financing summary | Keep the contractual monthly payment unchanged. Show additional principal separately. |
| Fixed-interest result | Use the selected schedule's balance after exactly the selected Zinsbindung months. |
| Refinancing | Use the selected schedule's remaining debt. If debt is zero at or before the fixed-period end, mark refinancing not applicable. |
| Rent versus buy | Use the selected debt path. Include Sondertilgung in the buyer's matched monthly budget so the renter is compared with the same available cash resources. Label this basis. |
| Rental investment | Keep gross yield, net yield and primary pre-tax cash flow before extra repayment unchanged. Show cash flow after Sondertilgung separately and use the selected debt in equity and sale results. |
| Offer price | Yield and comparable-value calculations remain unchanged. Affordability based on the contractual monthly payment does not treat discretionary Sondertilgung as a required monthly payment. |
| Saved-property comparison | Recalculate every scenario independently. Compare additional principal, fixed-period interest saving, fixed-period debt reduction and projected payoff effects only on matching bases. |

A cash purchase has no loan to repay. Sondertilgung controls are disabled and results are marked not
applicable. Existing draft values may be retained while the user is in cash-purchase mode so a later
switch back to loan financing does not destroy input, but they must not affect any calculation.

## Result contract

The PF-004 result view shows these values when both schedules are available:

- additional principal through the fixed-interest period;
- interest saved through the fixed-interest period;
- reduction in remaining debt at the end of the fixed-interest period;
- projected lifetime interest saved; and
- projected time saved, displayed as years and months.

Fixed-period results are contractual-period calculations. Lifetime interest and payoff results
continue the initial nominal rate beyond Zinsbindung and must carry the label **constant-rate
projection** / **Projektion bei konstantem Sollzins**. They are not a lender quotation, guaranteed
saving or contractual maturity.

If either schedule is unavailable, dependent comparison values are unavailable with the relevant
reason. The UI must not replace them with zero. Valid zero savings remain zero. When the loan is paid
off at or before Zinsbindung, remaining debt is zero and refinancing is not applicable.

## Scenario schema and migration handoff

PF-004.2 must add a language-neutral `additionalRepayments` group to the financing inputs. The stored
group contains only the annual amount, annual month and one-time amount/month rows. It must not
contain schedules, savings, remaining debt, payoff dates or other derived values.

This additive change advances the scenario document version from `1.0.0` to `1.1.0`. Local-library,
JSON-import and share-link readers must explicitly migrate `1.0.0` inputs to the following defaults:

```json
{
  "additionalRepayments": {
    "annualAdditionalRepayment": "",
    "annualAdditionalRepaymentMonth": "12",
    "oneTimeAdditionalRepayments": []
  }
}
```

The storage key remains `immopilot-de.scenarios.v1` because the document stays in the Version 1
compatibility family. New saves, exports and links use `1.1.0`. An unsupported version or malformed
repayment group must be rejected without replacing the current workspace. Rename, duplicate, reset,
import, export and sharing must preserve the new inputs and continue to recalculate all results.

## Language and guidance

The German interface keeps **Sondertilgung** as the canonical term. The English interface uses
**additional repayment**. Labels and explanations use the approved keys in `terminology.md`.

Contextual guidance must state:

- when the annual repayment is applied;
- that the contractual monthly payment is unchanged;
- that lender limits, fees and approval are not verified;
- that projections beyond Zinsbindung assume the initial rate remains constant; and
- how Sondertilgung is treated in rent-versus-buy and rental cash-flow results.

## PF-004 implementation sequence

| Task | Contract handoff |
| --- | --- |
| PF-004.2 | Add Version 1.1.0 inputs, migration and strict external-payload validation. |
| PF-004.3 | Build recurring amount and loan-year-month controls. |
| PF-004.4 | Build add, edit, remove, sort and validation behavior for one-time rows. |
| PF-004.5 | Calculate the baseline and selected schedules only through the domain engine. |
| PF-004.6 | Present the comparison metrics and constant-rate projection labels. |
| PF-004.7 | Feed selected fixed-period debt into refinancing. |
| PF-004.8 | Apply the documented owner-occupier and rental-investment treatment. |
| PF-004.9 | Add comparable Sondertilgung metrics and basis checks to the comparison workspace. |
| PF-004.10 | Complete German and English copy, help and lender-limit warnings. |
| PF-004.11 | Add unit and component regression coverage for every rule in this contract. |
| PF-004.12 | Verify save, reload, share, import and comparison journeys in Playwright. |

## PF-004.1 acceptance criteria

PF-004.1 is complete when:

- annual and one-time inputs, defaults and supported ranges are unambiguous;
- application order, unchanged-payment behavior and early payoff match the domain engine;
- baseline, selected schedule and every downstream consumer have a defined basis;
- fixed-period results and constant-rate projections are clearly distinguished;
- Version 1.0.0 migration and Version 1.1.0 persistence behavior are defined;
- German and English terminology is approved; and
- PF-004.2 through PF-004.12 can be implemented without another product decision.
