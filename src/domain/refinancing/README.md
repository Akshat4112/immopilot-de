# Refinancing

CF-008 calculates educational refinancing stress scenarios from CF-007's applicable fixed-period balance. It never reruns the original mortgage schedule or uses a projected lifetime debt as contractual refinancing principal.

## Inputs and modes

`calculateRefinancingStress` takes the CF-007 `FixedPeriodResult`, the existing contractual monthly payment in integer cents, and one or more editable future-rate scenarios. Each scenario must have a unique non-empty ID and an explicit future nominal annual rate (decimal, not percent). The application may prefill the current initial repayment rate, but the domain **requires** the future assumption; it never silently infers it.

- `initial-repayment-rate`: requires an explicit positive future initial annual repayment rate. `roundHalfUpCent(R × (futureInterestRate + futureRepaymentRate) / 12)` is the future monthly payment.
- `selected-term`: requires an explicit positive whole-month full repayment term. The fully amortizing annuity shares CF-004's zero-interest and nonzero-interest formula and half-up cent rounding.

Here `R` is the balance _after_ regular and eligible additional payments in the final month of Zinsbindung. Future monthly nominal interest is the future nominal annual rate divided by 12; future first-month interest and the payment are rounded independently to cents. A future payment that does not exceed first-month interest is unavailable (`FUTURE_PAYMENT_NOT_AMORTIZING`).

For each scenario, `monthlyPaymentChangeCents = futureMonthlyPaymentCents − currentContractualMonthlyPaymentCents`; the signed decimal `monthlyPaymentChangeRate` divides that change by the current payment. If the current payment is zero, only the percentage change is null. One comparison must use the same repayment mode and repayment rate **or** selected term in every scenario, so only the future interest rate differs. Mixed assumptions return `COMPARISON_ASSUMPTIONS_MISMATCH`.

## Availability and limitations

An unavailable CF-007 result propagates as `FIXED_PERIOD_UNAVAILABLE` without producing any debt or payment. Cash purchases and loans paid off at or before the fixed-period end return `not-applicable`; the calculator does not solicit future assumptions for these cases. Input validation returns stable `VALIDATION_ERROR` codes and fields.

The result's `assumptionKind` marks the rates as **user-selected stress assumptions, not forecasts**. These educational estimates are not mortgage offers, approvals or guarantees. Future lender eligibility, available loan terms and refinancing fees are not modeled. Post-Zinsbindung payoff projections must not be labelled contractual. PD-007 and PD-010 fixtures pin every cent-valued stress output for the German owner-occupier scenario, with and without Sondertilgung.
