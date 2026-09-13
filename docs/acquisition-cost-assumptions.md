# Acquisition-cost assumptions

**Task:** PD-006  
**Status:** Approved for Version 1 implementation  
**Market:** Germany  
**Last verified:** 13 September 2026

This document defines the editable acquisition-cost defaults for ImmoPilot DE. It separates statutory fee rules from planning proxies and property-specific budgets. The defaults are estimates for early affordability analysis; they are not quotations, legal advice, tax advice or investment advice.

## Decision summary

| Assumption | Version 1 default | Calculation basis | Classification | Editable |
|---|---:|---|---|---|
| Notary fees (Notarkosten) | 1.00% | Purchase price | Planning proxy based on the statutory GNotKG fee system | Yes |
| Land-register fees (Grundbuchkosten) | 0.50% | Purchase price | Planning proxy based on the statutory GNotKG fee system | Yes |
| Broker involved | No | Boolean selection | Product default because a broker is not present in every transaction | Yes |
| Buyer's broker commission (Maklerprovision) | 0.00% when no broker; 3.57% when enabled | Purchase price, including VAT | Market-informed planning default; the signed contract controls | Yes |
| Renovation budget (Renovierungsbudget) | €0 | Fixed gross amount | Property-specific user budget | Yes |
| Initial moving/setup costs (Umzugs- und Einrichtungskosten) | €0 | Fixed gross amount | Household-specific user budget | Yes |

Rates are represented as decimals in calculations: 1.00% is `0.0100`, 0.50% is `0.0050`, and 3.57% is `0.0357`. Euro inputs must accept zero and non-negative values. PD-008 will define the persisted field names and schema version.

## Assumption classes

The interface and calculation specification must preserve these distinctions:

1. **Statutory rate:** a rate directly prescribed by law, such as Grunderwerbsteuer. It may be applied as a percentage when the legal basis supports that model.
2. **Planning proxy:** a convenient percentage used to approximate a fee schedule whose actual charge depends on transaction value, services and entries. The notary and land-register defaults are proxies, not statutory flat rates.
3. **Contract-specific rate:** a value controlled by the user's agreement, such as broker commission.
4. **User-specific amount:** a budget that cannot be inferred responsibly from the purchase price alone, such as renovation or moving costs.

## 1. Notary fees

### Default

- **Rate:** 1.00% of the purchase price.
- **Input type:** editable percentage.
- **Display label:** `Notary fees / Notarkosten`.
- **VAT:** the planning proxy is a gross estimate; do not add VAT a second time.

### Basis for the default

The Bundesnotarkammer explains that German notary fees are prescribed by the Gerichts- und Notarkostengesetz (GNotKG), apply uniformly throughout Germany and depend on the value and type of transaction [S1]. Therefore, 1.00% is not a legally fixed percentage.

The Bundesnotarkammer's €160,000 apartment-purchase example lists a 2.0 notarisation fee of €762, a 0.5 execution fee of €190.50, a 0.5 support fee of €190.50, approximately €30 in copying and postage, other actual expenses, and 19% VAT [S2]. The specifically quantified items total approximately €1,395.87 including VAT, or about 0.87% of the purchase price, before unquantified expenses. Its separate €130,000 land-charge example shows that financing can create additional notary fees [S2]. A 1.00% default is therefore a reasonable first-pass estimate while remaining simple and editable.

### Limitations

- The actual amount depends on the statutory business value, documents, execution work, financing structure, powers of attorney and other services.
- The purchase price is only a proxy for the GNotKG business value and may not always be identical to it.
- Financing-related notarisation, including creation of a land charge, can move the total above the default.
- The official example excludes court and land-register fees; ImmoPilot DE calculates those separately.
- Users should replace the default with a notary estimate or known amount when available.

## 2. Land-register fees

### Default

- **Rate:** 0.50% of the purchase price.
- **Input type:** editable percentage.
- **Display label:** `Land-register fees / Grundbuchkosten`.
- **VAT:** no separate VAT uplift is applied to this proxy.

### Basis for the default

Land-register charges are court fees governed by the GNotKG rather than a single statutory percentage. The current fee schedule includes, among other items, a 1.0 fee for registering ownership (KV 14110), a 0.5 fee for a priority notice/Vormerkung (KV 14150), and fees for registering a land charge that depend on the form of the right (for example KV 14120 or KV 14121) [S3]. The euro value of a 1.0 fee comes from the value table in GNotKG Anlage 2 [S4].

The 0.50% default is a planning proxy for the common combination of ownership transfer, priority notice and—where financing is used—a land-charge entry. It is not a statutory flat rate.

### Limitations

- The actual amount depends on the relevant business values, financed amount, type and number of entries, priority notices, deletions and transaction structure.
- A cash purchase without a new land charge can cost less than a financed purchase.
- Existing rights that must be deleted or changed can create additional charges.
- Users should replace the default when a notary, court or lender provides a transaction-specific estimate.

## 3. Broker commission and buyer–seller splits

### Defaults

- **Broker toggle:** off.
- **Buyer commission when off:** 0.00%.
- **Suggested buyer commission when turned on:** 3.57% of the purchase price, including VAT.
- **Input type:** editable percentage; the actual contract always overrides the suggestion.
- **Display label:** `Buyer's broker commission / Maklerprovision Käuferseite`.

No commission should be inferred from the Bundesland. The Verbraucherzentrale states that the total commission is not fixed by law and is frequently 5.95% to 7.14% of the purchase price including VAT, depending on the region [S9]. A suggested buyer share of 3.57% is half of the upper end of that observed range. It is deliberately visible and editable, not presented as a legal tariff.

The 3.57% suggestion is gross: a 3.00% net commission plus the current 19% standard VAT rate equals 3.57% [S8]. Do not add VAT again.

### Split rules represented in the product

| Situation | Rule to communicate | Product behavior |
|---|---|---|
| No broker | No broker commission is included. | Use 0.00%. |
| Broker contracted by both sides for a consumer purchase of an apartment or single-family house | Buyer and seller must undertake to pay equal commission amounts under §656c BGB [S6]. | Prefill 3.57% for the buyer, keep it editable, and show an equal-split explanation. |
| Broker contracted by only one side for the same protected transaction | A contractual transfer to the other side is effective only if the commissioning side remains obliged to pay at least the same amount; the other side's claim becomes due only after payment and proof under §656d BGB [S7]. | If the seller alone commissioned the broker and passes part of the cost to the buyer, do not describe the buyer as owing more than 50% of the total. Otherwise use the buyer's actual contract value. |
| Land, multi-family building, commercial purchase, company buyer or another transaction outside the protected scope | The special split rules do not necessarily apply. §§656c and 656d apply only where the buyer is a consumer, and they concern apartments and single-family houses [S5, S9]. | Show a scope warning and use the entered contract value without implying a mandatory 50/50 split. |

### Limitations

- The signed broker agreement, property type, buyer status and transaction structure determine the actual charge.
- A seller-paid commission is not automatically a buyer cost and must not be added unless the buyer is contractually liable.
- The app does not decide whether a contract term is legally valid or whether a payment claim is due.
- VAT law and the agreed net/gross wording can change the gross percentage. The UI must state that its suggested 3.57% includes VAT.

## 4. Renovation budget

### Default

- **Amount:** €0.
- **Input type:** editable fixed gross amount.
- **Display label:** `Renovation budget / Renovierungsbudget`.
- **Time scope:** work planned before occupation or letting, or within the first 12 months after purchase.

### Basis for the default

There is no responsible nationwide percentage or euro-per-square-metre default for a whole-property renovation without knowing the building, condition, scope, local labour market and desired specification. The Verbraucherzentrale's façade-insulation guidance illustrates this variability: it asks users to use the area and measures from a contractor's offer and says outcomes depend on individual measure costs [S10]. Its published €160–€190/m² example applies to one specific façade-insulation system and must not be generalized to a complete renovation [S10].

For that reason, €0 is an explicit **unknown/not-yet-budgeted** starting point, not a prediction that no work is needed. The interface should prompt the user to enter a survey-based budget or contractor quotations and distinguish an untouched default from a user-confirmed zero.

### Inclusion and limitations

- Include immediate repair, modernization and energy-upgrade work the buyer expects to fund.
- Enter the gross amount before uncertain subsidies; do not silently assume a grant.
- Exclude recurring maintenance, Hausgeld, reserve contributions, moving costs and furniture.
- Quotes can omit contingencies or reveal further defects after work starts. The product should recommend, but not automatically impose, a contingency.
- ImmoPilot DE does not estimate whether work is legally required or technically sufficient.

## 5. Initial moving and setup costs

### Default

- **Amount:** €0.
- **Input type:** editable fixed gross amount.
- **Display label:** `Moving and setup costs / Umzugs- und Einrichtungskosten`.

### Basis for the default

Moving costs vary with the dwelling, locations, volume, access, distance, labour, packing, equipment and installation services. Verbraucherzentrale guidance notes that movers price either by effort and hours or by a fixed total; it recommends multiple quotations and a written scope based on the dwelling, location and goods [S11]. It does not support a meaningful national flat amount. Therefore the initial default is €0 until the user enters a household-specific budget; the UI must distinguish this untouched default from a user-confirmed zero.

### Inclusion and limitations

- May include a moving company or vehicle, packing material, temporary parking arrangements, cleaning, minor handover costs, utility/telecom activation and essential initial fittings or appliances.
- Exclude renovation work, recurring utilities, ongoing internet charges and normal monthly living expenses.
- Exclude refundable deposits from expenses; if a user wants to model them, they should be shown separately as temporary liquidity needs.
- Hourly estimates can produce overruns. The cited guidance notes that written quotations should list all services and VAT, and recommends fixed-price comparison where appropriate [S11].

## Calculation handoff for PD-007

PD-007 should use these boundaries:

```text
notary_estimate = purchase_price × notary_fee_rate
land_register_estimate = purchase_price × land_register_fee_rate
buyer_broker_commission = broker_involved ? purchase_price × buyer_broker_commission_rate : 0

closing_costs = grunderwerbsteuer
              + notary_estimate
              + land_register_estimate
              + buyer_broker_commission

post_purchase_budget = renovation_budget
                     + moving_setup_costs

total_initial_funding_need = down_payment
                           + closing_costs
                           + post_purchase_budget
```

The UI must report `closing_costs` and `post_purchase_budget` separately even if it also shows a combined total. This prevents optional household spending from being mistaken for statutory transaction costs. PD-007 will define precision, rounding and financing treatment.

## Requirements for PD-008

The versioned assumptions schema must:

- store percentage rates as decimals and euro amounts in a precision-safe monetary representation;
- record whether a broker is involved and whether the displayed commission includes VAT;
- distinguish default values from user overrides;
- distinguish a not-yet-budgeted zero from a user-confirmed zero for renovation and moving/setup costs;
- preserve a source/verification-date reference for each shipped default;
- allow zero for every optional cost and reject negative values;
- expose a reset-to-current-default action without overwriting a saved scenario silently;
- version future default changes so existing saved scenarios remain reproducible.

## Sources and verification record

| ID | Authority and source | What it supports | Source date | Verified |
|---|---|---|---|---|
| S1 | Bundesnotarkammer, [Notarkosten](https://www.notar.de/themen/notarkosten) | Nationwide statutory GNotKG basis; fees depend on transaction value and type | No page date shown | 13 Sep 2026 |
| S2 | Bundesnotarkammer, [Examples of notary costs](https://www.notar.de/themen/notarkosten/beispiele) | Published purchase-contract and land-charge fee examples; VAT and exclusions | No page date shown | 13 Sep 2026 |
| S3 | Federal Ministry of Justice / Federal Office of Justice, [GNotKG Anlage 1](https://www.gesetze-im-internet.de/gnotkg/anlage_1.html) | Fee items for ownership, Vormerkung and land-charge entries | Current official text | 13 Sep 2026 |
| S4 | Federal Ministry of Justice / Federal Office of Justice, [GNotKG Anlage 2](https://www.gesetze-im-internet.de/gnotkg/anlage_2.html) | Statutory value tables used to convert fee multipliers into euros | Current official text | 13 Sep 2026 |
| S5 | Federal Ministry of Justice / Federal Office of Justice, [§656b BGB](https://www.gesetze-im-internet.de/bgb/__656b.html) | Consumer scope of §§656c and 656d | Current official text | 13 Sep 2026 |
| S6 | Federal Ministry of Justice / Federal Office of Justice, [§656c BGB](https://www.gesetze-im-internet.de/bgb/__656c.html) | Equal commission obligations when both sides contract with the broker | Current official text | 13 Sep 2026 |
| S7 | Federal Ministry of Justice / Federal Office of Justice, [§656d BGB](https://www.gesetze-im-internet.de/bgb/__656d.html) | Conditions for transferring commission cost where only one side contracted | Current official text | 13 Sep 2026 |
| S8 | Federal Ministry of Justice / Federal Office of Justice, [§12 UStG](https://www.gesetze-im-internet.de/ustg_1980/__12.html) | Current 19% standard VAT rate | Current official text | 13 Sep 2026 |
| S9 | Verbraucherzentrale, [Maklergebühren bei Immobilien](https://www.verbraucherzentrale.de/wissen/vertraege-reklamation/kundenrechte/maklergebuehren-bei-immobilien-welche-sind-erlaubt-welche-nicht-95387) | Common total commission range, negotiability, split and scope summary | 27 Jul 2026 | 13 Sep 2026 |
| S10 | Verbraucherzentrale, [Rechenbeispiele für eine Fassadendämmung](https://www.verbraucherzentrale.de/wissen/energie/energetische-sanierung/rechenbeispiele-fuer-eine-fassadendaemmung-8192) | Measure-specific renovation costing and need for property-specific inputs | 22 Oct 2025 | 13 Sep 2026 |
| S11 | Verbraucherzentrale, [Umzugsunternehmen: So fallen Sie nicht auf Umzugs-Abzocker rein](https://www.verbraucherzentrale.de/wissen/vertraege-reklamation/kundenrechte/umzugsunternehmen-so-fallen-sie-nicht-auf-umzugsabzocker-rein-10470) | Quote methods, cost drivers, written scope and VAT-inclusive comparison | 11 Jun 2025 | 13 Sep 2026 |

## Global limitations and maintenance

- These defaults are for preliminary planning in ordinary German residential purchases. Special transactions can require additional legal, tax, technical or financing costs.
- The model does not yet include every possible expense, for example building surveys, financing brokerage, lender valuation fees, insurance, development charges, ongoing ownership costs or tax effects.
- A user override takes precedence over the shipped default but does not change the default for other scenarios.
- Verify the legal texts, VAT rate and consumer guidance before each public release and at least annually. Record every changed value in the assumptions version history defined by PD-008.
- The app must show the assumptions' effective version and last verification date near the detailed results or methodology view.
