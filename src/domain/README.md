# Domain

Framework-free financial models, validation and deterministic calculations implementing PD-007.
Domain code cannot depend on React, browser APIs, localization, persistence or UI modules.

The shared primitives in `shared/` define the approved money, rate, rounding and validation
foundation. Domain calculators import its public `index.ts` API and preserve cent-exact arithmetic.
See `docs/calculation-engine-conventions.md` for the normative contract.
