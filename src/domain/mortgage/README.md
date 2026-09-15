# Mortgage calculations

This framework-free domain implements the CF-004 payment calculator and CF-005 amortization schedule from PD-007.
CF-006 adds Sondertilgung comparisons; CF-007 exposes fixed-interest-period results.

## Payment modes

- Initial-repayment-rate mode calculates the German annuity from the nominal annual interest rate plus the initial annual repayment rate.
- Full-repayment-term mode calculates the annuity for a selected positive whole-month term.
- Both modes convert the nominal annual rate to a monthly nominal rate by dividing by 12.
- Payment and first-month interest are rounded independently to integer cents using half-up.
- A zero-loan financing result returns a cash purchase without requiring rate inputs.

## Amortization schedule

- The schedule starts from the available CF-004 principal and contractual monthly payment.
- Monthly interest is rounded half-up to cents before scheduled principal is calculated.
- Every row preserves the opening-balance, payment-allocation, and closing-balance identities exactly in cents.
- The final regular payment is reduced to interest plus the remaining principal, so the balance never becomes negative.
- A cash purchase produces an empty schedule with zero debt and interest.
- Zero-interest schedules are supported in both payment modes.
- Negative-amortizing and non-amortizing payments return distinct typed unavailable results.
- Projection stops with SCHEDULE_LIMIT_EXCEEDED if debt remains after 1,200 months.
- Results include first-year totals, fixed-interest-period totals and debt, an optional selected-month balance, payoff month, and projected lifetime interest.
- A recurring annual Sondertilgung may be assigned to any month from 1 through 12 of each loan year; month 12 is the default.
- One-time repayments use explicit positive payment months. Duplicate one-time months are rejected, while a recurring and one-time event in the same month are combined.
- Additional repayments are applied after the regular payment and capped at the post-regular-payment balance.
- The contractual monthly payment remains unchanged, so Sondertilgung shortens the projected payoff period.
- Comparison results expose fixed-period interest savings, projected lifetime interest savings, and months saved against an otherwise identical baseline.
- Cash purchases return two empty schedules and zero comparison savings. Repayment events after payoff have no effect.

Unavailable mortgage payments propagate into the schedule, while invalid schedule inputs become stable VALIDATION_ERROR results. The iterative schedule is authoritative; closed-form formulas are not used for persisted balances.

## Fixed-interest-period contract

`calculateFixedPeriod` summarizes an **existing** amortization schedule, without calculating a second one. For a period of `K` whole months it reports the balance after the end-of-month payment in month `K`, including regular principal and eligible Sondertilgung through that month. A payment in month `K + 1` does not affect the fixed-period result. The scenario schema stores `fixedInterestMonths`; convert whole years to months at the UI/input boundary.

The summary includes fixed-period interest, scheduled principal and additional principal in integer cents. Its `refinancing` union is `applicable` only when debt remains after the fixed period. Cash purchases return a null fixed period and `CASH_PURCHASE`; loans paid off before or at the period end return `PAID_OFF`. Consumers must not feed these not-applicable results to a refinancing calculator.

`calculateFixedPeriodComparison` summarizes CF-006's identical baseline and additional-repayment schedules and reports the reduction in end-of-period debt. It rejects different period endpoints with `FIXED_PERIOD_MISMATCH` and propagates unavailable upstream results. Neither function invents a balance from a failed or truncated schedule.

The selected **Zinsbindung** is a contractual fixed-interest duration, not the projected repayment duration. `projectedPayoffMonth` is explicitly marked `constant-initial-rate`: the mortgage schedule continues the initial nominal rate past Zinsbindung only as an illustrative projection. Do not label post-Zinsbindung interest, payoff or future payments as guaranteed contractual terms. CF-008 will use `refinancing.remainingDebtCents` only for applicable results, with editable future rates and repayment assumptions.
