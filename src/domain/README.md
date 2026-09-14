# Domain

Framework-free financial models, validation and deterministic calculations implementing PD-007.
Domain code cannot depend on React, browser APIs, localization, persistence or UI modules.

The shared primitives in `shared/` define the approved money, rate, rounding and validation
foundation. Domain calculators import its public `index.ts` API and preserve cent-exact arithmetic.
See `docs/calculation-engine-conventions.md` for the normative contract.

The `acquisition-costs/` module calculates German transfer tax, notary, land-register, buyer-side
broker and post-purchase budget amounts. Its discriminated result preserves the difference between
an unconfirmed budget and a confirmed zero.

The `financing/` module consumes an available acquisition result and implements selected-down-
payment and available-equity allocation. It reports required equity, loan amount, cash gaps,
remaining cash and purchase-price financing classification while enforcing the source-of-funds
identity.
