# Single-property results workspace

PF-002 turns the in-memory purchase-cost and financing drafts into one property-analysis route.
It does not store calculated values or reproduce financial formulas. `calculateScenarioDashboard`
coordinates the public CF calculator APIs for the fixed period, refinancing stress, rent-versus-buy,
rental investment, and offer price.

The results page only enables an optional analysis when its visible planning assumptions are complete.
Future refinancing rates are explicitly user-selected stress assumptions, not forecasts or financing
offers. Values stay in Zustand memory for the active browser session; persistence and multi-property
comparison are deliberately outside PF-002.
