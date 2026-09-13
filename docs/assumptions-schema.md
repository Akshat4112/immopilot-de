# Versioned assumptions schema

**Task:** PD-008  
**Status:** Ready for implementation  
**Schema version:** `1.0.0`  
**Assumption-set version:** `de-2026.09`  
**Calculation specification version:** `1.0.0`  
**Last verified:** 13 September 2026

This document defines the versioned data contract between the German-market assumptions, saved user scenarios and the calculations in [PD-007](calculation-specification.md). The contract is designed for deterministic results: a saved scenario records the values that were actually used, their origin and the exact assumption and calculation versions.

The data is planning support, not a quote, lending decision, tax opinion or legal advice. Statutory rates and planning proxies remain editable because the correct value can depend on the transaction, contract and fee-generating acts.

## 1. Deliverables

| File | Purpose |
|---|---|
| [`schemas/assumptions.schema.json`](../schemas/assumptions.schema.json) | Strict JSON Schema for immutable, source-backed assumption sets |
| [`schemas/scenario.schema.json`](../schemas/scenario.schema.json) | Strict JSON Schema for complete saved calculator scenarios |
| [`data/assumptions/de-2026.09.json`](../data/assumptions/de-2026.09.json) | German assumptions verified in September 2026 |
| [`examples/scenarios/owner-occupier.json`](../examples/scenarios/owner-occupier.json) | Complete owner-occupier and rent-versus-buy payload |
| [`examples/scenarios/rental-investment.json`](../examples/scenarios/rental-investment.json) | Complete rental-investment payload |
| [`data/fixtures/pd007-v1.json`](../data/fixtures/pd007-v1.json) | Machine-readable PD-007 worked examples and expected results |

Both schemas use JSON Schema Draft 2020-12, reject unknown properties and place reusable types in `$defs`.

## 2. Naming and representation rules

Field names are stable lower camel case English identifiers. UI labels may be German or English, but must map to the same stored field. A field name may only be changed in a new major schema version with an explicit migration.

| Concept | Contract rule | Example |
|---|---|---|
| Euro money | Integer cents; suffix `Cents` | `25000000` means €250,000.00 |
| Percentage rate | Decimal number, not percentage points | `0.065` means 6.50% |
| Whole periods | Integer months; suffix `Months` | `120` means ten years |
| Calendar date | RFC 3339 full date | `2026-09-13` |
| Timestamp | RFC 3339 date-time in UTC when produced by the app | `2026-09-13T00:00:00Z` |
| State | ISO 3166-2 identifier | `DE-NW` |
| Language | BCP 47 locale | `de-DE` or `en-GB` |
| Currency and jurisdiction | Fixed literals | `EUR` and `DE` |

Money integers are capped at JavaScript's safe-integer limit (`9,007,199,254,740,991` cents). Calculations use the rounding sequence and half-up rule defined in PD-007; stored inputs must not be pre-rounded beyond their declared unit.

Do not encode absent information as an empty string, `NaN`, `Infinity`, a formatted euro string or a negative amount. Where a result can legitimately be negative, such as cash flow, that signed value belongs in the calculated output or fixture rather than an unsigned scenario money field.

## 3. Assumption-set contract

An assumption set is a published, immutable snapshot. Its top-level identity is the tuple:

```text
(schemaVersion, assumptionSetVersion, calculationSpecificationVersion)
```

The set includes:

- acquisition defaults for notary, land register, broker, renovation and moving/setup;
- the state transfer-tax lookup;
- classification and VAT treatment for each percentage default;
- source IDs attached to every default; and
- a source register containing publisher, title, HTTPS URL, authority type, source date, verification date and optional limitations.

The `editable: true` flag means the UI may let a user replace the value. It does not make the published assumption set mutable. An edit is copied into a scenario with `origin: "user-override"`.

### 3.1 Acquisition defaults in `de-2026.09`

| Field | Default | Classification | VAT treatment | Runtime behavior |
|---|---:|---|---|---|
| `notaryRate.value` | `0.01` | `planning-proxy` | Included in default | Multiply by purchase price, then round to cents |
| `landRegisterRate.value` | `0.005` | `planning-proxy` | Not applicable | Multiply by purchase price, then round to cents |
| `broker.involved` | `false` | — | — | Commission is zero until enabled |
| `broker.buyerCommissionRate.value` | `0.0357` | `contract-specific-rate` | Included in default | Apply only when `involved` is true |
| `renovationBudget` | `0`, `not-budgeted` | `user-specific-amount` | — | Show an incomplete-budget warning |
| `movingSetupCosts` | `0`, `not-budgeted` | `user-specific-amount` | — | Show an incomplete-budget warning |

The broker rate is a convenience input, not a nationwide statutory commission. The signed brokerage contract controls the actual rate and buyer–seller split. The assumptions and limitations are sourced in [PD-006](acquisition-cost-assumptions.md).

### 3.2 Bundesland identifiers and transfer-tax rates

The state IDs are ISO 3166-2 codes and are stable even when display language changes.

| ID | Bundesland | Rate in `de-2026.09` |
|---|---|---:|
| `DE-BW` | Baden-Württemberg | `0.05` |
| `DE-BY` | Bayern | `0.035` |
| `DE-BE` | Berlin | `0.06` |
| `DE-BB` | Brandenburg | `0.065` |
| `DE-HB` | Bremen | `0.055` |
| `DE-HH` | Hamburg | `0.055` |
| `DE-HE` | Hessen | `0.06` |
| `DE-MV` | Mecklenburg-Vorpommern | `0.06` |
| `DE-NI` | Niedersachsen | `0.05` |
| `DE-NW` | Nordrhein-Westfalen | `0.065` |
| `DE-RP` | Rheinland-Pfalz | `0.05` |
| `DE-SL` | Saarland | `0.065` |
| `DE-SN` | Sachsen | `0.055` |
| `DE-ST` | Sachsen-Anhalt | `0.05` |
| `DE-SH` | Schleswig-Holstein | `0.065` |
| `DE-TH` | Thüringen | `0.05` |

The schema requires exactly 16 state rows and restricts every row to these identifiers. Semantic validation must additionally prove that every identifier occurs exactly once. Rates, effective dates and authorities are documented in [PD-005](grunderwerbsteuer-rates.md).

## 4. Scenario contract

A saved scenario is self-contained. It stores both version references and the effective values used for calculation, so opening a historical scenario does not silently substitute newer defaults.

### 4.1 Default versus override

Every acquisition rate is a `trackedRate`:

```json
{
  "value": 0.01,
  "origin": "assumption-set",
  "sourceId": "bnotk-notary-costs"
}
```

When the user edits it, the stored value becomes:

```json
{
  "value": 0.012,
  "origin": "user-override",
  "sourceId": null
}
```

For `origin: "assumption-set"`, `sourceId` is required and cannot be null. A user override may retain a source ID if the user deliberately adopted another source, but the app must not claim that an edited value came from the default source.

Resetting a field means copying the value and source from the scenario's referenced assumption set and changing `origin` back to `assumption-set`. It does not mean using whichever set is newest.

### 4.2 Renovation and setup states

Zero is not enough to express whether the user reviewed a budget. `trackedBudget` therefore carries both `amountCents` and `budgetStatus`.

| `budgetStatus` | Required amount | Required origin | Meaning and UI behavior |
|---|---:|---|---|
| `not-budgeted` | `0` | `assumption-set` | Placeholder only; warn that the project budget is incomplete; source required |
| `confirmed-zero` | `0` | `user-override` | User explicitly decided that no amount is needed; no incomplete-budget warning |
| `budgeted` | At least `1` | Either | A positive amount is included in post-purchase costs |

A user must never reach `confirmed-zero` merely by loading the default. It requires an explicit interaction. Changing a positive budget to zero requires the user to choose either “not budgeted” or “confirmed zero”; the application must not infer the state.

### 4.3 Scenario modes

`mode` is a discriminator:

- `owner-occupier` requires `ownerOccupier` and rejects `rentalInvestment`;
- `rental-investment` requires `rentalInvestment` and rejects `ownerOccupier`.

Common acquisition and financing inputs remain identical across the modes. `offerAnalysis` is optional in both. Complete payloads are provided in the `examples/scenarios` directory and intentionally reproduce the PD-007 rent-versus-buy and rental-investment vectors.

## 5. Versioning policy

### 5.1 `schemaVersion`

`schemaVersion` uses semantic versioning.

| Change | Version impact | Examples |
|---|---|---|
| Patch | Clarification that does not change which JSON instances validate | Description or documentation correction |
| Minor | Backward-compatible addition | New optional property or new optional schema document |
| Major | Existing valid data can become invalid or meaning can change | Rename, type change, new required field, enum removal, unit change |

The schema files at their stable URLs describe the current major. A production release should also publish immutable versioned copies, for example `schemas/v1/assumptions.schema.json`, before the first application release.

### 5.2 `assumptionSetVersion`

Assumption sets use `de-YYYY.MM` and an optional positive revision suffix, for example `de-2026.09.1`.

- Publish a new monthly version when law, rates, sources or planning defaults are re-verified in a later month.
- Publish a revision when correcting the same month's snapshot.
- Never modify a published file in place after an application release. Keep prior sets addressable.
- A newer set is not automatically “better” for a historical calculation; the scenario's referenced version controls reproducibility.

### 5.3 `calculationSpecificationVersion`

This semantic version identifies the PD-007 rules used by the engine. Any formula, ordering or rounding change that can change a result requires a new calculation-specification version and updated fixtures.

## 6. Backward-compatible migration rules

Migrations operate on copies and must be pure, deterministic functions from one declared schema version to the next.

1. Parse JSON without calculation and retain the original payload for audit/export.
2. Read and validate `documentType`, `schemaVersion`, `assumptionSetVersion` and `calculationSpecificationVersion` before transforming fields.
3. Apply one adjacent migration at a time; for example, `1.0.0 → 1.1.0 → 2.0.0`. Do not skip an intermediate migration.
4. Preserve cent amounts exactly. Never convert cents through binary floating-point euros.
5. Preserve rate decimals exactly as parsed for migration; only the calculation engine performs PD-007 rounding.
6. Preserve every `user-override`. Never replace it with a default during migration.
7. Resolve an assumption-derived value from the scenario's recorded assumption set, not from the latest set.
8. Do not turn `not-budgeted` into `confirmed-zero`, or the reverse. A migration cannot invent user confirmation.
9. Do not rewrite source URLs or source IDs in a historical assumption set. A superseding set may reference newer sources.
10. If a new required value cannot be derived without user judgment, stop with `migration-input-required`; do not guess.
11. Reject an unknown major version with `unsupported-schema-version`. Preserve the file and offer export; do not partially calculate it.
12. Validate the migrated payload before saving it, record the migration path, and update `updatedAt` while leaving `createdAt` unchanged.

Minor-version readers must ignore no properties: schemas deliberately use `additionalProperties: false`. Supporting a later minor version therefore requires loading its schema and migration, rather than silently discarding data.

## 7. Validation

### 7.1 JSON Schema validation

Example with Ajv CLI 5:

```bash
npx --yes ajv-cli@5 validate --spec=draft2020 \
  -s schemas/assumptions.schema.json \
  -d data/assumptions/de-2026.09.json

npx --yes ajv-cli@5 validate --spec=draft2020 \
  -s schemas/scenario.schema.json \
  -d 'examples/scenarios/*.json'
```

Validation must enable format checks for `date`, `date-time` and `uri`. Both schemas reject unknown properties, invalid enum values, non-integer money, out-of-range rates and inconsistent budget states. JSON Schema conditionals also enforce the mode-specific payload and the source requirement for assumption-derived values.

### 7.2 Semantic validation

Some cross-document and arithmetic rules are intentionally outside JSON Schema. A build or test suite must additionally verify:

- the transfer-tax array contains every allowed state ID exactly once;
- every `sourceId` and `sourceIds` entry resolves to exactly one source in the referenced assumption set;
- source IDs themselves are unique;
- `effectiveFrom`, `sourceDate` and `verifiedOn` are real dates with no impossible ordering;
- an assumption-derived scenario rate equals the relevant value in its referenced set;
- the transfer-tax rate matches the selected `stateId` unless its origin is `user-override`;
- `downPaymentCents ≤ purchasePriceCents`;
- financed acquisition costs do not exceed total transaction acquisition costs;
- combined vacancy and other rent loss cannot make effective rent negative;
- low/high comparable prices and larger/smaller offer discounts are ordered correctly;
- one-time repayment months are unique, or their values are explicitly aggregated before calculation; and
- all calculation and assumption version references are supported and available.

Schema validity is necessary but does not mean the scenario is affordable, commercially sensible or legally correct. Those are separate warnings or user judgments.

## 8. PD-007 fixtures

`data/fixtures/pd007-v1.json` is the calculation engine's acceptance fixture set. It uses cents for money, decimals for rates and half-up rounding. The following IDs map directly to PD-007 sections 14.1–14.7:

| Fixture ID | Coverage |
|---|---|
| `transfer-tax-lookup` | All 16 state lookups on a €100,000 price |
| `acquisition-a-no-broker` | Acquisition costs, budgets, equity and loan with no broker |
| `acquisition-b-broker-and-financed-costs` | Broker commission and partially financed acquisition costs |
| `mortgage-base` | Payment, month-one allocation, fixed-period totals and payoff |
| `refinancing-stress` | 2%, 4% and 6% follow-on rate scenarios |
| `annual-additional-repayment` | Annual Sondertilgung, savings and earlier payoff |
| `rental-investment` | Yield, cash flow, debt, sale proceeds and profit |
| `rent-versus-buy` | Competing portfolios, net wealth and break-even checkpoints |

Expected results are calculated outputs and may therefore be signed. Implementations should compare integer-money results exactly. Rates that are not rounded display values should be compared with a documented numeric tolerance, recommended at `1e-12`.

Any intentional PD-007 behavior change must update `calculationSpecificationVersion`, add or revise fixtures and explain changed expected values in the pull request. Never edit a fixture merely to make a failing implementation pass without reconciling it to the specification.

## 9. Implementation requirements

- Load the selected assumption set before constructing a new scenario.
- Copy default values and their source IDs into the scenario; calculations operate on the scenario, not live defaults.
- Treat the published assumption-set JSON as read-only.
- Preserve origin and budget status through form edits, URL state, import/export and local persistence.
- Validate on import, before calculation and before export.
- Display which assumption-set version and verification date produced the defaults.
- Warn on `not-budgeted`, unknown source IDs, unsupported versions and unavailable referenced sets.
- Keep personally identifying borrower data out of scenario payloads; Version 1 needs property and financial inputs, not names or contact details.

## 10. Acceptance criteria

PD-008 is complete when:

- both schemas pass Draft 2020-12 meta-validation;
- the September 2026 assumption set validates against `assumptions.schema.json`;
- both complete examples validate against `scenario.schema.json`;
- semantic checks resolve all sources and prove exactly one row per Bundesland;
- all eight fixture groups reproduce the PD-007 expected results; and
- future schema, assumption and calculation changes follow the versioning and migration policy above.
