# Representative German property examples

**Task:** PD-010  
**Status:** Approved demo-data specification for Version 1  
**Document version:** 1.0.0  
**Calculation specification:** 1.0.0  
**Assumption set:** `de-2026.09`  
**Last updated:** 13 September 2026

This document defines two deterministic scenarios for implementation, automated tests, application demos and screenshots. They are fictional examples, not current listings, market benchmarks or recommendations. No person or exact property address is represented.

The canonical machine-readable inputs are:

- [`examples/scenarios/owner-occupier.json`](../examples/scenarios/owner-occupier.json)
- [`examples/scenarios/rental-investment.json`](../examples/scenarios/rental-investment.json)

The canonical expected outputs are in [`data/fixtures/pd010-expected-results.json`](../data/fixtures/pd010-expected-results.json). If a displayed value in this document and that fixture disagree, the fixture governs after its input digest and specification version have been verified.

## 1. Shared conventions

Both examples use the rules in [`calculation-specification.md`](calculation-specification.md):

- euro inputs and outputs are stored as integer cents;
- rates are decimal values, so `0.05` means 5.00%;
- calculation boundaries use decimal round-half-up;
- monthly mortgage interest is rounded before scheduled principal is calculated;
- annual mortgage totals are sums of the monthly cent-rounded schedule;
- property and portfolio projections retain high precision until a reported money value is rounded; and
- missing values and valid zeroes are distinct states.

Both properties are fictional 65 m² apartments in Baden-Württemberg. The examples use the verified 5.00% transfer-tax rate and the source-dated 1.00% notary and 0.50% land-register planning defaults in assumption set `de-2026.09`. Both are direct purchases without a broker, so buyer broker commission is correctly zero even though the stored suggested broker rate remains 3.57%.

The 3.50% nominal mortgage rate, 2.00% initial repayment rate, rent, costs, growth rates and refinancing rates are illustrative user inputs. They are not current offers or forecasts.

## 2. Scenario A: Baden-Württemberg Eigennutzung

### 2.1 Decision represented

A household compares buying a €250,000 apartment for its own use with continuing to rent a comparable home. The purchase is broker-free, uses a 20% purchase-price down payment and has a ten-year fixed-interest period.

### 2.2 Canonical inputs

| Category | Input | Canonical value |
|---|---|---:|
| Property | Purchase price | €250,000.00 |
| Property | Bundesland | `DE-BW` |
| Property | Living area | 65 m² |
| Acquisition | Transfer-tax rate | 5.00% |
| Acquisition | Notary planning rate | 1.00% |
| Acquisition | Land-register planning rate | 0.50% |
| Acquisition | Broker involved | No |
| Acquisition | Renovation budget | Confirmed €0.00 |
| Acquisition | Moving/setup budget | Confirmed €0.00 |
| Financing | Available equity | €66,250.00 |
| Financing | Down payment | €50,000.00 |
| Financing | Financed acquisition-cost share | 0.00% |
| Financing | Nominal annual rate | 3.50% |
| Financing | Initial repayment rate | 2.00% |
| Financing | Fixed-interest period | 120 months |
| Comparison | Comparable rent in month 1 | €1,000.00 |
| Comparison | Owner costs in month 1 | €250.00 |
| Comparison | Annual rent growth | 2.00% |
| Comparison | Annual owner-cost growth | 0.00% |
| Comparison | Annual property appreciation | 2.00% |
| Comparison | Annual alternative return | 5.00% |
| Comparison | Hypothetical selling costs | 3.00% |
| Comparison | Analysis horizon | 120 months |

The two zero budgets are explicit user-confirmed zeroes. They must not be displayed as unbudgeted or missing.

### 2.3 Acquisition costs and funding

| Expected result | Value |
|---|---:|
| Grunderwerbsteuer | €12,500.00 |
| Notary planning amount | €2,500.00 |
| Land-register planning amount | €1,250.00 |
| Buyer broker commission | €0.00 |
| Transaction acquisition costs | €16,250.00 |
| Post-purchase budget | €0.00 |
| Total project cost | €266,250.00 |
| Required equity | €66,250.00 |
| Initial loan | €200,000.00 |
| Cash gap | €0.00 |
| Cash remaining | €0.00 |
| Purchase-price financing ratio | 80.00% |

Required source-of-funds check:

```text
€200,000.00 loan + €66,250.00 equity = €266,250.00 total project cost
```

### 2.4 Mortgage and amortization

| Expected result | Value |
|---|---:|
| Contractual monthly payment | €916.67 |
| Month 1 interest | €583.33 |
| Month 1 scheduled principal | €333.34 |
| Month 1 closing balance | €199,666.66 |
| First-year interest | €6,935.21 |
| First-year scheduled principal | €4,064.83 |
| Interest through month 120 | €62,189.13 |
| Scheduled principal through month 120 | €47,811.27 |
| Remaining debt after month 120 | €152,188.73 |
| Projected payoff at unchanged rate | Month 348 |
| Projected lifetime interest at unchanged rate | €118,394.80 |

The projected payoff continues the initial rate only as a labelled diagnostic projection. It is not a contractual result after the fixed-interest period.

### 2.5 Sondertilgung comparison

The canonical scenario is the no-Sondertilgung baseline used by the rent-versus-buy calculation. The demo exposes a non-persisted comparison override of €5,000 after every twelfth regular payment. Keeping the override in the expected-results fixture preserves the unchanged baseline scenario for PD-007.

| Expected result | Baseline | €5,000 annually |
|---|---:|---:|
| Contractual monthly payment | €916.67 | €916.67 |
| Interest through month 120 | €62,189.13 | €53,378.17 |
| Scheduled principal through month 120 | €47,811.27 | €56,622.23 |
| Additional principal through month 120 | €0.00 | €50,000.00 |
| Remaining debt after month 120 | €152,188.73 | €93,377.77 |
| Projected payoff month | 348 | 203 |
| Projected lifetime interest | €118,394.80 | €65,188.66 |

Expected differences:

- interest saved through the fixed period: €8,810.96;
- projected lifetime interest saved at an unchanged rate: €53,206.14; and
- projected time saved: 145 months.

### 2.6 Refinancing stress

Each scenario applies the same 2.00% future initial repayment rate to the debt after month 120. The comparison changes only the future nominal rate.

| Future nominal rate | Payment on baseline debt | Change from €916.67 | Payment after Sondertilgung | Change from €916.67 |
|---:|---:|---:|---:|---:|
| 2.00% | €507.30 | -€409.37 | €311.26 | -€605.41 |
| 4.00% | €760.94 | -€155.73 | €466.89 | -€449.78 |
| 6.00% | €1,014.59 | +€97.92 | €622.52 | -€294.15 |

These are payment stresses, not forecasts, offers or approval results.

### 2.7 Rent-versus-buy outcome

The equal-resource matched-budget method in PD-007 is applied without Sondertilgung. The renter invests the buyer's €66,250.00 required equity at time zero. Each option then invests any monthly housing-budget difference.

| Expected result at month 120 | Value |
|---|---:|
| Projected property value | €304,748.60 |
| Remaining mortgage debt | €152,188.73 |
| Buyer's alternative portfolio | €687.17 |
| Buyer's liquidation-basis net wealth | €144,104.59 |
| Renter's portfolio/net wealth | €119,489.86 |
| Buyer minus renter | +€24,614.73 |
| First break-even month | 68 |
| Break-even year | 6 |

Break-even transition checkpoints:

| Checkpoint | Buyer net wealth | Renter net wealth |
|---|---:|---:|
| End of year 5 | €89,561.83 | €92,587.24 |
| End of year 6 | €99,757.61 | €97,862.06 |

The result is specific to these illustrative inputs. It excludes tax effects and does not establish that buying generally outperforms renting.

## 3. Scenario B: Baden-Württemberg Kapitalanlage

### 3.1 Decision represented

An investor evaluates a broker-free €240,000 apartment with €1,000 monthly Nettokaltmiete, a renovation budget and a ten-year holding period. The scenario intentionally produces negative monthly pre-tax cash flow so the interface must not hide an additional monthly contribution.

### 3.2 Canonical inputs

| Category | Input | Canonical value |
|---|---|---:|
| Property | Purchase price | €240,000.00 |
| Property | Bundesland | `DE-BW` |
| Property | Living area | 65 m² |
| Acquisition | Transfer-tax rate | 5.00% |
| Acquisition | Notary planning rate | 1.00% |
| Acquisition | Land-register planning rate | 0.50% |
| Acquisition | Broker involved | No |
| Acquisition | Renovation budget | €10,000.00 |
| Acquisition | Moving/setup budget | Confirmed €0.00 |
| Financing | Available equity | €73,600.00 |
| Financing | Down payment | €48,000.00 |
| Financing | Financed acquisition-cost share | 0.00% |
| Financing | Nominal annual rate | 3.50% |
| Financing | Initial repayment rate | 2.00% |
| Financing | Fixed-interest period | 120 months |
| Income | Monthly Nettokaltmiete | €1,000.00 |
| Income | Vacancy allowance | 5.00% |
| Owner costs | Non-recoverable Hausgeld excluding reserve | €150.00/month |
| Owner costs | Maintenance outside Hausgeld | €1,200.00/year |
| Projection | Rent and owner-cost growth | 0.00% |
| Projection | Annual property appreciation | 2.00% |
| Projection | Hypothetical selling costs | 3.00% |
| Projection | Holding period | 120 months |

### 3.3 Acquisition costs and funding

| Expected result | Value |
|---|---:|
| Grunderwerbsteuer | €12,000.00 |
| Notary planning amount | €2,400.00 |
| Land-register planning amount | €1,200.00 |
| Buyer broker commission | €0.00 |
| Transaction acquisition costs | €15,600.00 |
| Post-purchase budget | €10,000.00 |
| Total project cost | €265,600.00 |
| Required equity | €73,600.00 |
| Initial loan | €192,000.00 |
| Cash gap | €0.00 |
| Purchase-price financing ratio | 80.00% |

Required source-of-funds check:

```text
€192,000.00 loan + €73,600.00 equity = €265,600.00 total project cost
```

### 3.4 Mortgage and refinancing

| Expected mortgage result | Value |
|---|---:|
| Contractual monthly payment | €880.00 |
| Month 1 interest | €560.00 |
| Month 1 scheduled principal | €320.00 |
| Month 1 closing balance | €191,680.00 |
| First-year interest | €6,657.80 |
| First-year scheduled principal | €3,902.20 |
| Interest through month 120 | €59,701.59 |
| Scheduled principal through month 120 | €45,898.41 |
| Remaining debt after month 120 | €146,101.59 |
| Projected payoff at unchanged rate | Month 348 |
| Projected lifetime interest at unchanged rate | €113,659.68 |

Refinancing stress on €146,101.59 remaining debt:

| Future nominal rate | Future payment | Change from €880.00 |
|---:|---:|---:|
| 2.00% | €487.01 | -€392.99 |
| 4.00% | €730.51 | -€149.49 |
| 6.00% | €974.01 | +€94.01 |

### 3.5 Rental-investment outcome

| Expected result | Value |
|---|---:|
| Annual net cold rent | €12,000.00 |
| Effective annual rent after vacancy | €11,400.00 |
| Annual owner costs | €3,000.00 |
| Net operating income | €8,400.00 |
| Investment cost basis | €265,600.00 |
| Gross rental yield | 5.0000% |
| Net rental yield | 3.1627% |
| Monthly mortgage payment | €880.00 |
| Monthly pre-tax cash flow before extra repayment | -€180.00 |
| Annual pre-tax cash flow before extra repayment | -€2,160.00 |
| Cash-on-cash return | -2.9348% |
| Debt reduction after ten years | €45,898.41 |
| Remaining debt after ten years | €146,101.59 |
| Projected sale price | €292,558.66 |
| Hypothetical selling costs | €8,776.76 |
| Net sale proceeds | €137,680.31 |
| Cumulative ten-year cash flow | -€21,600.00 |
| Estimated ten-year profit before tax | €42,480.31 |

The profit calculation excludes income tax, depreciation, capital-gains tax, financing deductions, early-repayment compensation and unentered costs. It is a deterministic test output, not an investment recommendation.

## 4. Machine-readable fixture contract

### 4.1 Input identity

The fixture records a SHA-256 digest of each complete scenario file:

| Scenario | SHA-256 |
|---|---|
| Owner-occupier | `48fcd1b597507a3b5f340c44defe36fb0b5d11803a4a1605bd3d6a91c124111e` |
| Rental investment | `36b9b0c5721b8f7cb59fca1147758c1432cacbdf6cfab214578b494ca57f5f62` |

A digest mismatch means the fixture cannot be assumed to describe that input file. Any calculation-affecting scenario change requires recomputation, review and a fixture-set version change.

### 4.2 Test sequence

An implementation test must:

1. parse the scenario and expected-results JSON files;
2. validate each scenario against `schemas/scenario.schema.json`;
3. verify schema, assumption-set and calculation-specification versions;
4. verify the scenario SHA-256 digest;
5. run the PD-007 calculation engine from the canonical scenario;
6. run the owner-occupier Sondertilgung comparison with only the documented override;
7. compare all expected money and integer outputs exactly;
8. compare unrounded rate outputs within the fixture's `1e-12` absolute tolerance; and
9. assert every required accounting and mortgage identity.

### 4.3 Required invariants

For every applicable case:

```text
loan + required equity = total project cost
interest + scheduled principal = regular payment
opening balance - scheduled principal - Sondertilgung = closing balance
scheduled principal + Sondertilgung + remaining debt = initial loan
net sale proceeds = sale price - selling costs - remaining debt
estimated profit = net sale proceeds + cumulative cash flow - required equity
```

All cent-denominated invariants must reconcile exactly. A one-cent difference is a failed fixture, not an accepted tolerance.

### 4.4 Schema and state requirements

- Both scenario inputs must validate against scenario schema `1.0.0`.
- Both inputs must resolve assumption set `de-2026.09`.
- Both use `confirmed-zero` only with a zero amount and `user-override` origin.
- The rental renovation amount uses `budgeted` with a positive value.
- Broker-disabled calculations must produce zero commission despite the stored suggested rate.
- No scenario contains a name, address, account identifier or other personal information.
- Scenario inputs must not contain calculated output fields; outputs belong to the fixture.

## 5. Intended consumers

| Consumer | Required use |
|---|---|
| Calculation-engine unit tests | Assert the complete expected-output fixture |
| CF-020 | Reproduce acquisition, mortgage and remaining-debt values |
| PF-009 | Load the two canonical scenarios without overwriting user work without confirmation |
| UI and end-to-end tests | Verify German labels, negative cash flow, break-even and stress states |
| Documentation and screenshots | Use the same inputs and displayed values as the tested fixtures |

## 6. Change control

Changes to a scenario's display name or locale still require updating its digest. Changes to money, rates, timing, budget status or calculation mode require all affected outputs to be recomputed. Changes to a normative PD-007 rule require a new calculation-specification version and corresponding fixture-set version.

PD-010 is complete when both scenario JSON files validate, every expected output is reproducible from PD-007, all exact-cent identities pass, and the fixture can be consumed without UI or browser dependencies.
