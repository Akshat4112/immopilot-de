# Product definition

## Purpose

ImmoPilot DE helps people evaluate residential property purchases in Germany through transparent, deterministic calculations. It combines acquisition costs, mortgage repayment, refinancing risk and long-term property decisions in one client-side application.

The application supports financial exploration and comparison. It does not recommend a mortgage, value a property professionally or replace financial, tax or legal advice.

## Approved version 1 boundary

Version 1 includes:

1. Purchase costs
2. Mortgage calculation
3. Amortization schedule
4. Sondertilgung
5. Refinancing stress test
6. Rent-versus-buy comparison
7. Rental-investment analysis
8. Offer-price calculation
9. Comparison of up to three scenarios
10. German and English interfaces
11. Local scenario persistence, sharing and export
12. Static GitHub Pages deployment

Version 1 uses no backend, user account, AI model, listing scraper, live rate feed or cloud storage.

## Target user 1: owner-occupier

### Situation

The user currently rents or is considering a particular apartment or house in Germany. They need to understand the complete cash requirement, monthly financing burden and long-term consequences of buying.

### Primary decisions

- Can I afford the complete purchase rather than only the advertised price?
- How much equity do I need?
- What monthly payment follows from the selected interest and repayment rates?
- How much debt remains after the fixed-interest period?
- How sensitive is the payment to refinancing rates?
- Does buying leave me financially better or worse than continuing to rent?
- What purchase price fits my equity and payment limit?

### Required inputs

#### Quick inputs

- Purchase price
- Bundesland
- Broker commission or no broker
- Available equity
- Mortgage interest rate
- Initial repayment rate
- Fixed-interest period
- Current monthly rent

#### Advanced inputs

- Notary and land-register percentages
- Renovation and initial costs
- Portion of acquisition costs financed
- Annual and one-time Sondertilgung
- Future refinancing rates
- Monthly ownership costs
- Maintenance reserve
- Expected rent growth
- Expected property appreciation
- Alternative investment return
- Holding period
- Selling costs
- Maximum acceptable monthly payment

### Required outputs

- Itemized acquisition costs
- Total project cost
- Cash required at purchase
- Loan amount and financing ratio
- Monthly payment
- Interest and principal by period
- Remaining debt at the end of Zinsbindung
- Interest paid over selected horizons
- Sondertilgung interest saving and revised payoff date
- Refinancing payments under multiple future rates
- Buyer and renter net wealth over time
- Break-even year when one exists
- Affordability-based purchase-price ceiling

## Target user 2: rental investor

### Situation

The user is evaluating a German residential property as a rental investment and wants to understand yield, monthly cash flow, financing risk and an appropriate offer limit.

### Primary decisions

- What are the gross and net rental yields?
- Which Hausgeld components remain an owner cost?
- How much monthly cash must I contribute after financing?
- How much equity builds through repayment?
- What is the estimated outcome after ten years?
- What purchase price satisfies my target yield or payment constraint?
- How do several purchase-price and financing scenarios compare?

### Required inputs

#### Quick inputs

- Purchase price
- Bundesland
- Acquisition costs
- Equity
- Interest and repayment rates
- Monthly Kaltmiete
- Monthly Hausgeld
- Non-recoverable Hausgeld

#### Advanced inputs

- Vacancy allowance
- Maintenance allowance
- Reserve contributions
- Rent growth
- Property appreciation
- Selling costs
- Holding period
- Target gross or net yield
- Comparable price per square metre
- Floor area
- Sondertilgung
- Refinancing assumptions

### Required outputs

- Gross and net yield with definitions
- Effective rent after vacancy
- Recoverable and non-recoverable operating costs
- Monthly pre-tax cash flow
- Interest, principal and owner contribution shown separately
- Cash-on-cash return
- Debt reduction and property equity
- Estimated ten-year cash flows and sale proceeds
- Yield-based maximum price
- Comparable-value range
- Asking-price comparison
- Opening-offer range and upper limit

Tax effects are outside the initial calculation boundary. A later version may add a configurable tax-estimate module after its rules and limitations are separately specified.

## Shared experience

### Entry

The home page provides two clear starting points:

- Calculate for my own home
- Evaluate a rental investment

The user may switch modes without losing shared property and financing inputs.

### Quick calculation

1. Select the mode.
2. Enter the essential property and financing inputs.
3. Review the main result cards.
4. Open the cost and repayment breakdowns.
5. Change a material assumption and see results update immediately.
6. Continue to advanced inputs or save the scenario.

The quick flow must produce useful results without forcing the user to understand every German financing term. Every default remains visible and editable.

### Advanced calculation

1. Start from a quick calculation or an empty advanced form.
2. Review acquisition-cost assumptions.
3. Configure equity and financing structure.
4. Add Sondertilgung and refinancing scenarios.
5. Add owner-occupier or rental-investment assumptions.
6. Review detailed tables and charts.
7. Compare up to three named scenarios.
8. save locally, create a shareable link or export the report.

### Result hierarchy

Every module follows the same order:

1. Main result
2. Component breakdown
3. Scenario or sensitivity view
4. Calculation explanation
5. Source and last-updated information
6. Limitations

## Interaction principles

- Distinguish a valid zero from missing or invalid data.
- Do not display unavailable calculations as zero.
- Recalculate immediately after valid input changes.
- Preserve the user's values when switching between related modules.
- Keep quick inputs short and place optional assumptions under advanced controls.
- Explain German terms in concise contextual help.
- Use euro and percentage formats appropriate to the selected language.
- Provide tables as alternatives to essential chart information.
- Store data locally and give the user a clear reset action.
- Require confirmation before overwriting or deleting a saved scenario.

## Calculation principles

- Calculation functions remain independent of React components.
- Money uses decimal or integer-cent arithmetic.
- Rounding occurs only at documented calculation or display boundaries.
- Principal repayment builds equity and is not treated as consumption.
- Acquisition costs remain separate from property value.
- Recoverable and non-recoverable Hausgeld remain separate.
- Every default includes a source and verification date.
- All material formulas require unit tests and independent fixtures.

## Supported scenario structure

A saved scenario contains:

- Scenario identifier and name
- Schema version
- Calculation mode
- Property inputs
- Acquisition-cost assumptions
- Financing inputs
- Sondertilgung inputs
- Refinancing inputs
- Mode-specific assumptions
- Locale
- Assumption-set version

A scenario does not contain account information, credentials or hidden personal identifiers.

## Release acceptance criteria

The product-definition milestone is complete when:

- The version 1 boundary and non-goals are explicit.
- Owner-occupier and rental-investor decisions are documented.
- Quick and advanced inputs and outputs are identified.
- Shared navigation and result hierarchy are defined.
- The calculation and privacy principles are recorded.
- No planned version 1 feature requires a backend.
