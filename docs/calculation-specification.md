# Calculation specification

**Task:** PD-007  
**Status:** Approved mathematical specification for Version 1 implementation  
**Specification version:** 1.0.0  
**Market:** Germany  
**Last updated:** 13 September 2026

This document is the mathematical source of truth for ImmoPilot DE. Calculation code, unit tests, UI explanations and exports must follow it. If implementation behavior and this document disagree, the implementation is defective until either the code or this specification is explicitly reviewed and changed.

The calculator supports planning and scenario comparison. It does not produce a lender quotation, an effective annual percentage rate, a professional valuation, or legal, tax or investment advice.

## 1. Normative language and dependencies

The words **must**, **must not**, **should** and **may** are normative.

This specification depends on:

- [Product definition](product-definition.md) for the Version 1 boundary;
- [German–English terminology standard](terminology.md) for canonical meanings and labels;
- [Grunderwerbsteuer rates](grunderwerbsteuer-rates.md) for the verified state lookup;
- [Acquisition-cost assumptions](acquisition-cost-assumptions.md) for default notary, land-register, broker, renovation and setup values.

PD-008 must encode the inputs and default versions described here without changing their meaning.

## 2. Core conventions

| Convention | Required behavior |
|---|---|
| Base currency | Euro only in Version 1. |
| Money inputs | Store as integer cents or an equivalent decimal representation; never use binary floating-point arithmetic for cent-level operations. |
| Rates | Store as decimals: 5.0% is `0.05`. |
| Time step | One calendar month. Month 1 is the first payment month. |
| Regular payment timing | End of month, after that month's interest accrues. |
| Additional-repayment timing | After the regular payment in the selected month. |
| Growth-rate conversion | Convert an effective annual growth/return rate `g` to a monthly rate using `(1 + g)^(1/12) - 1`. |
| Missing inputs | Return an unavailable result with a reason; never convert a missing value to zero. |
| Valid zero | Preserve a user-confirmed zero. Renovation and setup defaults remain marked “not yet budgeted” until confirmed. |
| Taxes | Tax effects other than the acquisition-time Grunderwerbsteuer calculation are outside Version 1. |

### 2.1 Symbols

| Symbol | Meaning |
|---|---|
| `P` | Property purchase price |
| `TB` | Grunderwerbsteuer taxable basis |
| `r_state` | Transfer-tax rate from the Bundesland lookup |
| `r_notary` | Notary planning rate |
| `r_register` | Land-register planning rate |
| `r_broker` | Buyer's gross broker-commission rate |
| `C` | Transaction acquisition/closing costs |
| `Q` | Post-purchase budget: renovation plus moving/setup |
| `D` | Down payment applied to the purchase price |
| `F` | Financed portion of transaction acquisition costs |
| `E_available` | Available equity |
| `E_required` | Required equity under the selected financing structure |
| `L` | Initial loan principal |
| `i` | Nominal annual borrowing rate / Sollzins |
| `t` | Initial annual repayment rate / anfänglicher Tilgungssatz |
| `j` | Monthly nominal borrowing rate, `i / 12` |
| `A` | Contractual regular monthly annuity before the final-payment adjustment |
| `B_m` | Mortgage balance after all payments in month `m` |
| `I_m` | Interest portion in month `m` |
| `T_m` | Scheduled principal portion in month `m` |
| `S_m` | Additional repayment / Sondertilgung in month `m` |
| `N` | Number of months in a calculation horizon |

`roundCent(x)` in the formulas means round to the nearest cent using decimal **round-half-up**.

## 3. Acquisition-cost calculation

### 3.1 Grunderwerbsteuer lookup

The selected Bundesland must map to exactly one current rate from PD-005:

| Identifier | Bundesland | Decimal rate | Display rate |
|---|---|---:|---:|
| DE-BW | Baden-Württemberg | 0.050 | 5.0% |
| DE-BY | Bayern | 0.035 | 3.5% |
| DE-BE | Berlin | 0.060 | 6.0% |
| DE-BB | Brandenburg | 0.065 | 6.5% |
| DE-HB | Bremen | 0.055 | 5.5% |
| DE-HH | Hamburg | 0.055 | 5.5% |
| DE-HE | Hessen | 0.060 | 6.0% |
| DE-MV | Mecklenburg-Vorpommern | 0.060 | 6.0% |
| DE-NI | Niedersachsen | 0.050 | 5.0% |
| DE-NW | Nordrhein-Westfalen | 0.065 | 6.5% |
| DE-RP | Rheinland-Pfalz | 0.050 | 5.0% |
| DE-SL | Saarland | 0.065 | 6.5% |
| DE-SN | Sachsen | 0.055 | 5.5% |
| DE-ST | Sachsen-Anhalt | 0.050 | 5.0% |
| DE-SH | Schleswig-Holstein | 0.065 | 6.5% |
| DE-TH | Thüringen | 0.050 | 5.0% |

Use a stable state identifier in code; localized names are display values. An unknown or missing state must make the tax and every dependent total unavailable.

Version 1 uses the purchase price as the default taxable basis:

```text
TB = P
transfer_tax = roundCent(TB × r_state)
```

The app must not automatically deduct furniture, fitted kitchens or other movable items from `TB`. A future explicit taxable-basis input requires separate legal/product review. The selected rate, source date and assumption-set version must remain visible.

### 3.2 Other proportional costs

```text
notary_costs = roundCent(P × r_notary)
land_register_costs = roundCent(P × r_register)

if broker_involved:
    buyer_broker_commission = roundCent(P × r_broker)
else:
    buyer_broker_commission = 0
```

The Version 1 defaults are 1.00% for notary costs, 0.50% for land-register costs and, when a broker is enabled, a suggested 3.57% buyer commission including VAT. They are editable and retain the classifications and limitations in PD-006. No VAT multiplier is added after applying these gross defaults.

### 3.3 Transaction costs, post-purchase budget and project cost

```text
C = transfer_tax
  + notary_costs
  + land_register_costs
  + buyer_broker_commission

Q = renovation_budget
  + moving_setup_costs

total_project_cost = P + C + Q
```

The UI must present `C` as transaction acquisition costs and `Q` as a separate post-purchase budget. It may also show `C + Q` as all additional initial outlay, but it must not imply that renovation or moving costs are statutory transaction costs.

## 4. Down payment, financing and required equity

### 4.1 Selected-down-payment mode

The financed-cost share `f` applies only to `C` and satisfies `0 ≤ f ≤ 1`:

```text
F = roundCent(C × f)
cash_funded_transaction_costs = C - F

L = P - D + F
E_required = D + cash_funded_transaction_costs + Q

cash_gap = max(0, E_required - E_available)
cash_remaining = max(0, E_available - E_required)
purchase_price_financing_ratio = L / P
```

Required source-of-funds identity:

```text
L + E_required = total_project_cost
```

`D` is the portion of the purchase price paid from equity and must satisfy `0 ≤ D ≤ P`. Renovation and moving/setup costs are cash-funded in Version 1. Financing them requires a future explicit product decision rather than silently adding them to `F`.

The purchase-price financing ratio is not a banking Beleihungsauslauf. A value above 100% means the loan exceeds the purchase price; it does not state a lender's valuation or approval.

### 4.2 Available-equity quick mode

When the quick flow starts from available equity rather than a selected down payment:

```text
cash_costs_before_down_payment = (C - F) + Q

if E_available < cash_costs_before_down_payment:
    D = 0
    cash_gap = cash_costs_before_down_payment - E_available
else:
    D = min(P, E_available - cash_costs_before_down_payment)
    cash_gap = 0

L = P - D + F
E_required = D + (C - F) + Q
cash_remaining = max(0, E_available - E_required)
```

If a gap exists, the scenario may still show the mathematical loan and gap, but it must be labelled underfunded rather than affordable.

### 4.3 Financing labels

- **100% purchase-price financing:** `L = P`. In the standard case `D = 0` and `F = 0`, transaction and post-purchase costs are paid from equity. If financed costs and a down payment offset each other, the itemized source-of-funds breakdown must remain visible.
- **Above-100% financing:** `L > P`; some transaction costs are financed.
- A colloquial “110% financing” label may be shown only when `L / P = 1.10` after rounding for display.

## 5. Mortgage payment and amortization

### 5.1 Initial-repayment-rate annuity

The primary German Version 1 mortgage mode uses the nominal borrowing rate plus the initial repayment rate:

```text
j = i / 12
A = roundCent(L × (i + t) / 12)
```

This is a constant scheduled monthly payment while the rate and payment agreement remain unchanged. It is not the effective annual percentage rate.

If `L = 0`, the purchase is a cash purchase: the monthly payment, interest and remaining debt are zero, the mortgage schedule is empty, and refinancing outputs are not applicable. A repayment-rate input is not required in that case.

### 5.2 Fully amortizing payment for a selected term

Where a module explicitly asks for a payment that amortizes principal `L` over `N` months:

```text
if i = 0:
    A_term = roundCent(L / N)
else:
    j = i / 12
    A_term = roundCent(L × j / (1 - (1 + j)^(-N)))
```

The UI must identify whether a result uses the initial-repayment-rate convention or a selected full-repayment term. It must not switch modes silently.

### 5.3 Monthly schedule algorithm

Start with `B_0 = L`. For month `m = 1, 2, ...`:

```text
I_m = roundCent(B_(m-1) × j)

planned_principal = A - I_m
if planned_principal <= 0:
    result = unavailable_negative_amortization

T_m = min(B_(m-1), planned_principal)
regular_payment_m = I_m + T_m
balance_after_regular = B_(m-1) - T_m

S_m = min(balance_after_regular, eligible_additional_repayments_m)
B_m = balance_after_regular - S_m
total_payment_m = regular_payment_m + S_m
```

All amounts in the schedule are cents. The final regular payment is reduced to `I_m + B_(m-1)` when the normal annuity would overpay. No balance may become negative.

For each month, the following identities must hold exactly in cents:

```text
regular_payment_m = I_m + T_m
B_m = B_(m-1) - T_m - S_m
total_payment_m = I_m + T_m + S_m
```

### 5.4 Interest, principal and aggregation

```text
interest_paid(1..N) = sum(I_m)
scheduled_principal_paid(1..N) = sum(T_m)
additional_principal_paid(1..N) = sum(S_m)
total_principal_paid(1..N) = sum(T_m + S_m)
```

Annual tables are sums of the monthly cent-rounded rows. They must not recompute interest from an annual average balance. Principal is debt reduction and equity building; it must be shown separately from interest and must not be described as a consumption cost.

Without additional repayments and before cent rounding, the following closed form may be used only as a diagnostic cross-check:

```text
B_n = L × (1 + j)^n - A × ((1 + j)^n - 1) / j       when j > 0
B_n = L - A × n                                      when j = 0
```

The displayed and persisted schedule must come from the iterative cent-rounded algorithm.

### 5.5 Calculated full-repayment date

Simulate monthly rows until `B_m = 0`. The payoff duration is that final month count. It is a calculated full-repayment date, not a contractual loan maturity. Version 1 must stop with an unavailable result and warning if a schedule has not repaid within 1,200 months.

## 6. Sondertilgung

### 6.1 Supported events

Version 1 supports:

- one recurring annual fixed euro amount, defaulting to month 12 of each loan year; and
- zero or more one-time fixed euro amounts assigned to explicit payment months.

The default additional repayment is €0. Contractual entitlement, annual limits, fees and lender approval are user responsibilities and are not inferred by the calculator.

### 6.2 Application order

1. Accrue and round monthly interest.
2. Apply the regular payment and scheduled principal.
3. Sum every additional repayment eligible in that month.
4. Cap the sum at the remaining balance.
5. Reduce the balance by the capped amount.

Recurring and one-time events may occur in the same month and are additive before the cap. Events after full repayment have no effect. Under the Version 1 convention, `A` remains unchanged after an additional repayment, so the calculated payoff date becomes earlier. A payment-reduction alternative requires a future explicit mode.

### 6.3 Comparison outputs

The baseline and Sondertilgung schedules must use identical inputs except for the additional repayments.

```text
interest_saved_through_fixed_period = baseline_interest_1_to_K
                                    - extra_payment_interest_1_to_K

projected_lifetime_interest_saved = baseline_projected_total_interest
                                  - extra_payment_projected_total_interest

time_saved_months = baseline_payoff_month
                  - extra_payment_payoff_month
```

Lifetime outputs are available only when both schedules share explicit post-Zinsbindung assumptions. Continuing the initial rate beyond the fixed period is permitted only as a visibly labelled constant-rate projection, not as a contractual result.

## 7. Fixed-interest period and remaining debt

Convert a selected fixed-interest period in whole years to months:

```text
K = fixed_interest_years × 12
remaining_debt_at_end_of_fixed_period = B_K
```

The schedule includes exactly `K` end-of-month regular payments and every eligible Sondertilgung through month `K`. If the loan is fully repaid earlier, remaining debt is zero and refinancing results are not applicable.

The fixed-interest period and calculated total repayment duration must remain distinct in all labels and exports.

## 8. Refinancing stress scenarios

Each refinancing scenario contains:

- the remaining debt `R = B_K`;
- a future nominal annual rate `i_refi`;
- a future initial repayment rate `t_refi`; and
- optionally, a selected full-repayment term `N_refi`.

When `t_refi` is not separately entered, the UI may prefill the current `t`, but it must show that value as an editable assumption.

### 8.1 Same-repayment-rate comparison

```text
future_monthly_payment = roundCent(R × (i_refi + t_refi) / 12)
payment_change = future_monthly_payment - A

if A > 0:
    payment_change_rate = payment_change / A
else:
    payment_change_rate = unavailable
```

### 8.2 Selected-term comparison

If `N_refi` is supplied, calculate the fully amortizing payment using the formula in section 5.2 with `R`, `i_refi` and `N_refi`.

All rate scenarios in one comparison must use the same repayment convention and assumptions other than `i_refi`. Lower, base and higher rates are user-selected scenarios, not forecasts. No refinancing fees, lending approval or future product terms are implied.

## 9. Rent-versus-buy model

### 9.1 Comparison principle

The model compares net wealth under an equal-resource, matched-budget convention:

- the renter invests at time zero the equity required by the buyer;
- each month both options receive the same housing budget;
- the option with the lower housing outflow invests the difference at the alternative-return assumption;
- the buyer's property is valued net of remaining debt and optional hypothetical selling costs.

This avoids treating principal repayment as an expense while still accounting for the buyer's full cash payment.

### 9.2 Monthly projected values

For annual property appreciation `g_property`, rent growth `g_rent`, owner-cost growth `g_owner` and alternative investment return `g_alt`, each rate must be greater than `-1`:

```text
q_property = (1 + g_property)^(1/12) - 1
q_rent = (1 + g_rent)^(1/12) - 1
q_owner = (1 + g_owner)^(1/12) - 1
q_alt = (1 + g_alt)^(1/12) - 1

property_value_m = P × (1 + q_property)^m
rent_m = roundCent(initial_monthly_rent × (1 + q_rent)^(m-1))
owner_costs_m = roundCent(initial_monthly_owner_costs × (1 + q_owner)^(m-1))
```

The rent input must represent the renter's comparable housing outflow. Costs that are identical in both options, such as household electricity under equal usage, should be excluded from both or included in both.

### 9.3 Alternative portfolios

At time zero:

```text
buyer_portfolio_0 = 0
renter_portfolio_0 = E_required
```

For each month, use the actual regular mortgage payment from the schedule; it becomes zero after payoff:

```text
buyer_housing_outflow_m = regular_payment_m + owner_costs_m
renter_housing_outflow_m = rent_m
common_budget_m = max(buyer_housing_outflow_m, renter_housing_outflow_m)

buyer_contribution_m = common_budget_m - buyer_housing_outflow_m
renter_contribution_m = common_budget_m - renter_housing_outflow_m

buyer_portfolio_m = buyer_portfolio_(m-1) × (1 + q_alt)
                    + buyer_contribution_m

renter_portfolio_m = renter_portfolio_(m-1) × (1 + q_alt)
                     + renter_contribution_m
```

Portfolio growth occurs during the month and the contribution occurs at month-end. Sondertilgung is included in buyer outflow only when the comparison explicitly assumes the same extra cash is also available to the renter; in that case it is added to `buyer_housing_outflow_m` before the common budget is calculated.

### 9.4 Net wealth and break-even

For hypothetical selling-cost rate `s`:

```text
buyer_net_wealth_m = property_value_m × (1 - s)
                   - B_m
                   + buyer_portfolio_m

renter_net_wealth_m = renter_portfolio_m
wealth_difference_m = buyer_net_wealth_m - renter_net_wealth_m
```

The liquidation-basis break-even month is the first month where `wealth_difference_m ≥ 0`. The break-even year is `ceil(month / 12)`. If no crossing occurs within the selected horizon, the result is “no break-even within the analysis period,” not zero.

The UI may additionally show a balance-sheet view without hypothetical selling costs, but it must not mix that view with the liquidation-basis break-even result. Income tax, tax deductions, rent regulation, transaction timing uncertainty and investment taxes are excluded.

## 10. Rental-investment metrics

### 10.1 Income and owner costs

```text
annual_net_cold_rent = monthly_net_cold_rent × 12
effective_annual_rent = annual_net_cold_rent × (1 - vacancy_rate)
                      - other_annual_rent_loss

annual_owner_costs = 12 × monthly_non_recoverable_hausgeld_excluding_reserve
                   + 12 × monthly_reserve_contribution
                   + annual_maintenance_allowance_outside_hausgeld
                   + other_annual_owner_costs

net_operating_income = effective_annual_rent - annual_owner_costs
```

Input categories must be mutually exclusive. If the entered non-recoverable Hausgeld already includes the reserve contribution, the reserve must not be added again. Recoverable costs are excluded from both revenue and owner costs under the assumption that the tenant reimburses them. Expected vacancy-period carrying costs belong in `other_annual_owner_costs`.

### 10.2 Yield definitions

```text
gross_rental_yield = annual_net_cold_rent / P

investment_cost_basis = P + C + Q
net_rental_yield = net_operating_income / investment_cost_basis
```

Gross yield is before vacancy, owner costs, financing and taxes. Net yield is before financing and taxes but after the explicitly modelled vacancy and owner costs. The UI must show both numerator and denominator.

### 10.3 Cash flow and cash-on-cash return

Allocate annual assumptions evenly to months for the current-year summary unless monthly values are explicitly projected:

```text
monthly_effective_rent = effective_annual_rent / 12
monthly_owner_costs = annual_owner_costs / 12

monthly_cash_flow_before_extra_m = monthly_effective_rent
                                 - monthly_owner_costs
                                 - regular_payment_m

monthly_cash_flow_after_extra_m = monthly_cash_flow_before_extra_m - S_m

annual_pre_tax_cash_flow_before_extra = sum(monthly_cash_flow_before_extra_m, months 1..12)
annual_pre_tax_cash_flow_after_extra = sum(monthly_cash_flow_after_extra_m, months 1..12)

cash_on_cash_return = annual_pre_tax_cash_flow_before_extra / E_required
```

Cash-on-cash return is unavailable when `E_required ≤ 0`. The primary metric excludes discretionary Sondertilgung so financing choices do not masquerade as operating performance; after-extra cash flow must be shown separately when applicable.

For a multi-year projection, grow rent and owner-cost inputs with the effective monthly conversion in section 9, round each projected monthly cash flow to cents, and apply vacancy and rent-loss assumptions consistently. Do not allow combined vacancy and other rent loss to produce negative effective rent.

### 10.4 Debt reduction, property equity and sale

```text
debt_reduction_1_to_N = L - B_N
property_equity_N = projected_property_value_N - B_N

projected_property_value_N = P × (1 + g_property)^(N/12)
gross_sale_price_N = projected_property_value_N
selling_costs_N = gross_sale_price_N × selling_cost_rate
net_sale_proceeds_N = gross_sale_price_N - selling_costs_N - B_N

cumulative_cash_flow_N = sum(monthly_cash_flow_after_extra_m, months 1..N)
estimated_profit_N = net_sale_proceeds_N
                   + cumulative_cash_flow_N
                   - E_required
```

The sale calculation is a scenario, not a valuation or tax calculation. It excludes capital-gains tax, early-repayment compensation and other unentered sale costs. Principal reduction must not be added again to `estimated_profit_N`; it is already reflected in the lower `B_N`.

## 11. Offer-price calculations

### 11.1 Gross-yield ceiling

For target gross yield `y_gross > 0`:

```text
gross_yield_price_ceiling = annual_net_cold_rent / y_gross
```

### 11.2 Net-yield ceiling

Let `r_cost` be the sum of purchase-price-proportional acquisition rates that apply to the buyer:

```text
r_cost = r_state + r_notary + r_register
       + (broker_involved ? r_broker : 0)

fixed_initial_costs = renovation_budget + moving_setup_costs

net_yield_price_ceiling =
    (net_operating_income / target_net_yield - fixed_initial_costs)
    / (1 + r_cost)
```

Return unavailable if the target yield is not positive or if the resulting ceiling is negative. Because actual acquisition line items are rounded individually, test nearby cent values and return the highest price that still satisfies the selected target.

### 11.3 Affordability ceiling

For a maximum monthly payment `M_max`, nominal rate `i` and initial repayment rate `t`:

```text
loan_capacity = 12 × M_max / (i + t)

payment_based_price_ceiling =
    (loan_capacity + E_available - fixed_initial_costs)
    / (1 + r_cost)
```

The cash-only feasibility ceiling under financed-cost share `f` is:

```text
if r_cost × (1 - f) > 0:
    cash_based_price_ceiling =
        (E_available - fixed_initial_costs)
        / (r_cost × (1 - f))
else if E_available >= fixed_initial_costs:
    cash_based_price_ceiling = unbounded_by_cash_costs
else:
    cash_based_price_ceiling = unavailable_underfunded

affordability_price_ceiling = max(0, min(
    payment_based_price_ceiling,
    cash_based_price_ceiling when bounded
))
```

This ceiling assumes all available equity may be used. It is a scenario limit, not lender approval. When acquisition line items round to cents, the implementation must verify the analytical result by testing nearby cent values and return the highest purchase price that satisfies both constraints.

### 11.4 Comparable range and negotiation outputs

```text
comparable_value_low = living_area × comparable_price_per_m2_low
comparable_value_high = living_area × comparable_price_per_m2_high

offer_difference = purchase_offer - asking_price
offer_difference_rate = offer_difference / asking_price
```

An opening-offer range may be calculated only from user-selected negotiation discounts. With reference price `R_offer`, larger discount `d_low` and smaller discount `d_high`, where `0 ≤ d_high ≤ d_low < 1`:

```text
opening_offer_low = R_offer × (1 - d_low)
opening_offer_high = R_offer × (1 - d_high)
```

The app must not invent a negotiation discount or present the comparable range as a professional Verkehrswertgutachten.

## 12. Precision and rounding rules

1. Parse localized input text into canonical decimal values before calculation.
2. Round every acquisition-cost line item separately to cents, then sum the rounded line items.
3. Round the contractual monthly annuity once to cents.
4. Round mortgage interest every month to cents before calculating scheduled principal.
5. Keep all mortgage balances, regular payments and Sondertilgung amounts in exact cents.
6. Aggregate annual mortgage values by summing monthly rows.
7. Keep property values and alternative-portfolio balances at high decimal precision during projection and round only reported monetary outputs.
8. Round projected monthly rent and owner-cost cash flows to cents before adding them to a portfolio or cash-flow total.
9. Calculate ratios from unrounded underlying monetary totals where those totals are not schedule cents; round only for display.
10. Use decimal round-half-up for calculation boundaries. Locale controls formatting, not arithmetic.
11. JSON exports must preserve canonical decimal rates and cent-exact money values; formatted strings are presentation only.

Recommended display precision:

| Output | Display |
|---|---|
| Euro totals and monthly amounts | Whole euros by default; two decimals in detailed tables |
| Rates and yields | Two decimal places by default; allow more in methodology/export |
| Financing ratio | Two decimal places |
| Duration | Years and months |
| Schedule balance, interest and principal | Two decimal places |

## 13. Validation and unavailable-result rules

| Input or condition | Rule |
|---|---|
| Purchase price | Required and greater than zero. |
| Bundesland | Required for transfer tax; must match a versioned lookup identifier. |
| Taxable basis and money inputs | Non-negative, finite and within the application's safe integer/decimal range. |
| Cost, commission and financed-cost rates | `0 ≤ rate ≤ 1`; unusually high but valid values may trigger a warning. |
| Broker disabled | Calculated buyer commission is zero even if a stale rate remains stored. |
| Available equity | Non-negative. |
| Down payment | `0 ≤ D ≤ P`. |
| Nominal borrowing rate | `0 ≤ i < 1`. |
| Initial repayment rate | `0 < t ≤ 1` for the initial-repayment payment mode. |
| Selected terms and fixed-interest period | Positive whole months; year inputs convert to whole months. |
| Sondertilgung | Non-negative amount and a valid positive payment month. |
| Vacancy and selling-cost rates | `0 ≤ rate ≤ 1`. |
| Other rent loss | Must not exceed rent remaining after the vacancy allowance. |
| Growth and alternative-return rates | Greater than `-1`; values outside configured warning bands require confirmation. |
| Target yield | Greater than zero. |
| Living area | Greater than zero when a per-square-metre result is requested. |
| Asking price | Greater than zero when a percentage difference is requested. |
| Negative amortization | Return unavailable; do not emit an increasing balance as a normal repayment schedule. |
| Division by zero | Return unavailable with a concept-specific reason. |
| No break-even or no payoff in horizon | Return an explicit “not within horizon” state, not zero. |

Dependent totals must be unavailable when a required component is unavailable. Validation messages must identify the input to correct.

## 14. Golden test vectors

All expected monetary values below use this specification's cent-rounding rules. These fixtures are normative for unit tests.

### 14.1 Transfer tax on €100,000

| Bundesland | Expected tax |
|---|---:|
| Baden-Württemberg | €5,000.00 |
| Bayern | €3,500.00 |
| Berlin | €6,000.00 |
| Brandenburg | €6,500.00 |
| Bremen | €5,500.00 |
| Hamburg | €5,500.00 |
| Hessen | €6,000.00 |
| Mecklenburg-Vorpommern | €6,000.00 |
| Niedersachsen | €5,000.00 |
| Nordrhein-Westfalen | €6,500.00 |
| Rheinland-Pfalz | €5,000.00 |
| Saarland | €6,500.00 |
| Sachsen | €5,500.00 |
| Sachsen-Anhalt | €5,000.00 |
| Schleswig-Holstein | €6,500.00 |
| Thüringen | €5,000.00 |

### 14.2 Acquisition vector A: no broker, no financed costs

Inputs:

```json
{
  "purchasePrice": 25000000,
  "state": "DE-BW",
  "notaryRate": 0.01,
  "landRegisterRate": 0.005,
  "brokerInvolved": false,
  "renovationBudget": 2000000,
  "movingSetupCosts": 300000,
  "financedAcquisitionCostShare": 0,
  "downPayment": 5000000,
  "availableEquity": 10000000
}
```

Money values in JSON are cents. Expected results:

| Result | Expected |
|---|---:|
| Transfer tax | €12,500.00 |
| Notary costs | €2,500.00 |
| Land-register costs | €1,250.00 |
| Buyer broker commission | €0.00 |
| Transaction acquisition costs `C` | €16,250.00 |
| Post-purchase budget `Q` | €23,000.00 |
| Total project cost | €289,250.00 |
| Financed acquisition costs `F` | €0.00 |
| Required equity | €89,250.00 |
| Loan amount | €200,000.00 |
| Cash remaining | €10,750.00 |
| Purchase-price financing ratio | 80.00% |

### 14.3 Acquisition vector B: broker and partially financed costs

Inputs: €300,000 purchase price in Nordrhein-Westfalen; 1.00% notary; 0.50% land register; broker enabled at 3.57% gross; €10,000 renovation; €2,000 setup; 25% of transaction costs financed; €25,000 down payment; €70,000 available equity.

| Result | Expected |
|---|---:|
| Transfer tax | €19,500.00 |
| Notary costs | €3,000.00 |
| Land-register costs | €1,500.00 |
| Buyer broker commission | €10,710.00 |
| Transaction acquisition costs `C` | €34,710.00 |
| Financed acquisition costs `F` | €8,677.50 |
| Post-purchase budget `Q` | €12,000.00 |
| Total project cost | €346,710.00 |
| Required equity | €63,032.50 |
| Loan amount | €283,677.50 |
| Cash remaining | €6,967.50 |
| Purchase-price financing ratio | 94.56% |

### 14.4 Mortgage, amortization and refinancing vector

Inputs: `L = €200,000`, `i = 3.50%`, `t = 2.00%`, fixed-interest period 10 years, no additional repayment.

| Result | Expected |
|---|---:|
| Contractual monthly payment `A` | €916.67 |
| Month 1 interest | €583.33 |
| Month 1 scheduled principal | €333.34 |
| Month 1 closing balance | €199,666.66 |
| Interest paid through month 120 | €62,189.13 |
| Scheduled principal through month 120 | €47,811.27 |
| Remaining debt after month 120 | €152,188.73 |
| Projected full repayment at unchanged rate | 348 months / 29 years |
| Projected lifetime interest at unchanged rate | €118,394.80 |

Refinancing the €152,188.73 balance with the same 2.00% initial repayment assumption:

| Future nominal rate | Expected future monthly payment | Change from €916.67 |
|---:|---:|---:|
| 2.00% | €507.30 | -€409.37 |
| 4.00% | €760.94 | -€155.73 |
| 6.00% | €1,014.59 | +€97.92 |

### 14.5 Sondertilgung vector

Use the mortgage in section 14.4 and apply €5,000 after every 12th regular payment.

| Result | Baseline | With Sondertilgung |
|---|---:|---:|
| Interest through month 120 | €62,189.13 | €53,378.17 |
| Remaining debt after month 120 | €152,188.73 | €93,377.77 |
| Additional principal through month 120 | €0.00 | €50,000.00 |
| Projected payoff month at unchanged rate | 348 | 203 |
| Projected lifetime interest at unchanged rate | €118,394.80 | €65,188.66 |

Expected fixed-period interest saving: **€8,810.96**.  
Expected projected lifetime interest saving: **€53,206.14**.  
Expected projected time saving: **145 months**.

### 14.6 Rental-investment vector

Inputs:

- Purchase price €240,000 in Baden-Württemberg; 1.00% notary; 0.50% land register; no broker.
- Renovation €10,000; no other setup cost.
- Down payment €48,000; no transaction costs financed; required equity €73,600.
- Loan €192,000 at 3.50% nominal interest and 2.00% initial repayment.
- Monthly Nettokaltmiete €1,000; vacancy 5%; no separate rent loss.
- Monthly non-recoverable owner costs €150 and annual maintenance outside Hausgeld €1,200.
- Property appreciation 2.00% per year; selling costs 3.00%; holding period 10 years.
- No growth in rent or owner costs and no Sondertilgung.

| Result | Expected |
|---|---:|
| Annual net cold rent | €12,000.00 |
| Effective annual rent | €11,400.00 |
| Annual owner costs | €3,000.00 |
| Net operating income | €8,400.00 |
| Gross rental yield | 5.00% |
| Net rental yield on €265,600 project cost | 3.1627% |
| Monthly mortgage payment | €880.00 |
| Monthly pre-tax cash flow before extra | -€180.00 |
| Annual pre-tax cash flow before extra | -€2,160.00 |
| Cash-on-cash return | -2.9348% |
| First-year interest | €6,657.80 |
| First-year scheduled principal | €3,902.20 |
| Remaining debt after 10 years | €146,101.59 |
| Projected sale price after 10 years | €292,558.66 |
| Selling costs | €8,776.76 |
| Net sale proceeds | €137,680.31 |
| Cumulative 10-year cash flow | -€21,600.00 |
| Estimated 10-year profit before tax | €42,480.31 |

### 14.7 Rent-versus-buy vector

Inputs:

- Buyer: €250,000 purchase in Baden-Württemberg, no broker, no renovation/setup budget, €50,000 down payment, €200,000 loan, and €66,250 required equity.
- Mortgage: 3.50% nominal interest, 2.00% initial repayment, no Sondertilgung.
- Initial buyer owner costs: €250/month with 0% growth.
- Renter: comparable initial rent €1,000/month with 2.00% annual growth.
- Property appreciation: 2.00% annually.
- Alternative investment return: 5.00% annually.
- Hypothetical selling costs: 3.00%.
- Analysis horizon: 120 months.

Apply the exact monthly order in section 9. Expected results at month 120:

| Result | Expected |
|---|---:|
| Projected property value | €304,748.60 |
| Remaining mortgage debt | €152,188.73 |
| Buyer's alternative portfolio | €687.17 |
| Buyer's liquidation-basis net wealth | €144,104.59 |
| Renter's alternative portfolio/net wealth | €119,489.86 |
| Buyer minus renter | +€24,614.73 |
| First break-even month | 68 |
| Break-even year | 6 |

At the end of year 5, expected buyer and renter net wealth are €89,561.83 and €92,587.24. At the end of year 6, they are €99,757.61 and €97,862.06. These checkpoints guard the break-even transition.

## 15. Implementation acceptance criteria

PD-007 is correctly implemented when:

- pure calculation functions have no dependency on React, locale formatting or browser storage;
- every formula and ordering rule above has a unit test;
- all golden vectors pass at the stated cent/rate precision;
- all 16 Bundesland lookup tests pass;
- schedule identities hold for every generated month;
- zero-interest, early-payoff, no-broker, cash-purchase, 100%-financing and above-100%-financing cases are covered;
- invalid or incomplete inputs produce typed unavailable results rather than `NaN`, infinity or misleading zeroes;
- rent-versus-buy tests prove that principal is not counted twice;
- investment tests prove that reserve, maintenance and non-recoverable Hausgeld inputs are not double-counted;
- source dates and assumption versions are carried into calculation metadata and exports;
- a change to any normative formula or rounding boundary requires a specification-version change and updated fixtures.
