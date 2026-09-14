# Mortgage payment calculator

This framework-free module implements the two explicit PD-007 mortgage payment modes.

- Initial-repayment-rate mode calculates the German annuity from the nominal annual interest rate plus the initial annual repayment rate.
- Full-repayment-term mode calculates the annuity that amortizes the loan over the selected positive whole-month term.
- Both modes convert the nominal annual rate to a monthly nominal rate by dividing by 12.
- Payment and first-month interest are rounded independently to integer cents using half-up.
- A payment that does not exceed first-month interest returns NEGATIVE_AMORTIZATION.
- A zero-loan financing result returns a cash purchase with zero payment and does not require rate inputs.
- Unavailable financing propagates, while validation failures become typed unavailable results.

The two modes remain explicit in both input and output. The calculator does not silently reinterpret an initial repayment rate as a repayment term or vice versa.
