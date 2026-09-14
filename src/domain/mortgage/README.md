# Mortgage calculations

This framework-free domain implements the CF-004 payment calculator and CF-005 amortization schedule from PD-007.

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
- Additional principal is explicitly zero in CF-005; Sondertilgung is applied by the following domain task.

Unavailable mortgage payments propagate into the schedule, while invalid schedule inputs become stable VALIDATION_ERROR results. The iterative schedule is authoritative; closed-form formulas are not used for persisted balances.
