# Acquisition-cost calculator

This framework-free module implements the PD-007 German acquisition-cost boundary.

- Money enters and leaves as integer cents.
- Rates are decimals and every proportional line is rounded independently with decimal half-up.
- The Bundesland lookup contains the 16 rates from assumption set de-2026.09.
- Notary, land-register and buyer broker rates have editable defaults. Explicit overrides are marked in the result.
- Renovation and moving/setup remain separate from statutory transaction costs.
- A not-budgeted amount makes the post-purchase and all-in totals unavailable. A confirmed-zero amount is valid.
- Invalid inputs throw FinancialValidationError with a stable code and field.

The result always exposes the transaction-cost components. When status is available it also exposes postPurchaseBudgetCents, allAdditionalInitialOutlayCents and totalProjectCostCents. Financing, down-payment and required-equity calculations are intentionally outside this module.
