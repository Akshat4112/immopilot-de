# UX-031 — ETF tax transparency (first safe increment)

This change adds a visual ETF ledger under **Visual Insights** while deliberately withholding inaccurate after-tax liquidation figures. It is a **partial implementation** of roadmap UX-031, not acceptance of the completed German tax model.

## Data provenance
- **Market value:** `simulate(x).rows[year].portfolio`, the canonical modeled ETF balance.
- **Contributions since opening:** `x.start + sum(sim.rows[1..year].newETF)`, cumulative deposits; *not* remaining cost basis after sales.
- **Withdrawal proceeds / modeled tax:** `sim.rows[year].withdrawn` and `tax`, both cumulative under the existing simplified withdrawal engine.
- **Display:** annual table, year selection, two-series SVG, chart/table toggle, mobile table-first, DE locale currency, semantic text disclosures, and machine-readable unrounded annual attributes.
- **No financial changes:** no alteration to investments, scenario storage, withdrawal computations, mortgage or rental tax.

## Deliberately unavailable
- **Vorabpauschale:** needs tax-year-specific Basiszins, fund start/end share values, distribution and fund classification, as well as a payment year calendar.
- **After-tax full liquidation:** needs remaining FIFO purchase lots, realized sales, dividend/distribution tax, prior Vorabpauschale amounts to offset, remaining Sparer-Pauschbetrag shared with other capital income, church-tax elections, and applicable tax-year rules.
- The app does not guess Basiszins or silently subtract fictional advance tax; these fields explicitly say **Not modeled** / **Not calculated**. In particular the gap between cumulative contributions and market value is **not** labelled as a taxable gain.

## Release checklist and dependency
1. Validate ETF-001/ETF-002 with golden vectors (partial exemption, Vorabpauschale cap, zero/negative years, actual basis rates, allowances and credit on disposal).
2. Add buy/sell lot accounting, separate spouses / aggregation of allowances, fee/distribution distinctions, and year-specific reference data.
3. Only then enable a liquidatable net value, with provenance, legislation and rule year.
4. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e` and manual mobile / keyboard / dark / print review on the latest branch head.

**Tax references to verify before enabling:** InvStG §§ 16, 18 and 20; EStG § 20; BMF Basiszins announcements for each tax year.

This staged implementation tracks issue #93 UX-031. **Do not mark UX-031 finished** on the tracker or merge without verification; no CI was run by this connector session.
