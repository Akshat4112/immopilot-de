# Financing and required equity

This framework-free module implements the two PD-007 acquisition-funding modes.

Selected-down-payment mode uses the user-selected down payment. Available-equity mode first funds the cash-paid transaction costs and post-purchase budget, then applies remaining equity to the purchase price up to that price.

Both modes:

- finance only the selected share of transaction acquisition costs;
- keep renovation and moving/setup cash-funded;
- return loan amount, required equity, cash gap and remaining cash in integer cents;
- retain the purchase-price financing ratio as a decimal value;
- classify financing below, at or above 100% of the purchase price;
- enforce loan amount plus required equity equals total project cost;
- propagate an unavailable acquisition result;
- convert FinancialValidationError at the public boundary into a typed unavailable result.

The purchase-price financing ratio is not a lender's Beleihungsauslauf and does not represent approval or an offer.
