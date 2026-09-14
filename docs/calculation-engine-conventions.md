# Calculation-engine conventions

Status: normative for the Version 1 calculation engine  
Foundation version: 1.0.0  
Established by: CF-001  
Calculation specification: PD-007 version 1.0.0

## Purpose

The shared financial primitives in `src/domain/shared/` are the only approved foundation for
cent-level arithmetic, canonical rates, decimal rounding and input validation. Feature and domain
calculators must consume the public `index.ts` API instead of implementing local rounding or
validation rules.

## Representation

| Concept | Representation | Rule |
| --- | --- | --- |
| Money | Branded `MoneyCents` safe integer | One euro is 100 cents; formatted strings never enter calculations |
| Rate | Branded decimal.js `Rate` | `0.05` means 5%; binary floating-point rate arithmetic is prohibited |
| Decimal work | 40-digit `FinancialDecimal` context | Intermediate projections retain precision until a specified boundary |
| Rounding | Decimal round-half-up | Acquisition lines, annuities, monthly interest and projected monthly cash flows round separately |
| Errors | `FinancialValidationError` | Stable code and field identify the input or operation to correct |

Signed `MoneyCents` values support cash-flow and difference outputs. Inputs that PD-007 defines as
non-negative must pass through `nonNegativeMoneyCents`; a signed constructor must not be used to
bypass an input rule.

## Public utilities

- `moneyCents`, `nonNegativeMoneyCents`, `eurosToCents` and `centsToEuros` establish money
  boundaries.
- `addMoney`, `subtractMoney`, `sumMoney`, `minMoney`, `maxMoney` and `multiplyMoney`
  preserve cent-exact results and detect safe-integer overflow.
- `rate`, `proportionRate`, `nominalAnnualRate`, `initialRepaymentRate` and `growthRate`
  enforce the distinct PD-007 ranges.
- `percentageToRate`, `rateToPercentage`, `addRates` and
  `annualEffectiveToMonthlyRate` provide canonical rate conversion.
- `decimal`, `roundHalfUp`, `roundHalfUpToInteger` and `safeDivide` provide deterministic
  decimal operations.

## Validation errors

| Code | Meaning |
| --- | --- |
| `REQUIRED` | A required value is missing |
| `INVALID_TYPE` | A JavaScript value has the wrong primitive type |
| `INVALID_DECIMAL` | Text or another value cannot be parsed as a decimal |
| `NOT_FINITE` | The value is `NaN` or infinite |
| `NOT_INTEGER` | A cent or whole-period value contains a fraction |
| `UNSAFE_INTEGER` | An input integer is outside JavaScript's exact safe range |
| `OUT_OF_RANGE` | A valid number violates its concept-specific bounds |
| `DIVISION_BY_ZERO` | A denominator is zero |
| `ARITHMETIC_OVERFLOW` | A computed integer would leave the exact safe range |

Validation errors are domain errors, not translated UI messages. Calculators catch them at their
public boundary and convert them to typed unavailable results with the same stable code and field.
No calculator may return `NaN`, infinity or a misleading zero after validation failure.

## Rounding boundaries

1. Parse localized UI input before it reaches the domain.
2. Perform arithmetic with `FinancialDecimal`.
3. Apply `multiplyMoney` or `roundHalfUpToInteger` only at a PD-007 cent boundary.
4. Sum already-rounded acquisition lines and monthly schedule rows as `MoneyCents`.
5. Keep ratios and projection balances as decimals until the specification requires reporting.
6. Format money and rates only after calculation.

For example, a €300,000 purchase with a 3.57% buyer commission produces exactly 1,071,000 cents.
The €200,000 PD-007 mortgage at 3.50% interest plus 2.00% initial repayment produces a contractual
payment of 91,667 cents after one half-up boundary.

## Testing requirements

Every calculator must add focused boundary tests and reuse `data/fixtures/pd007-v1.json` where its
formula is represented. CF-001 directly validates the fixture metadata, acquisition multiplication,
financed-cost share and contractual-annuity rounding. Later tasks remain responsible for complete
fixture vectors and all formula ordering rules.
