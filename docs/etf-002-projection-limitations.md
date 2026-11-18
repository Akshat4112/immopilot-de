# ETF-002 — illustrative annual tax ledger: release constraints

This engine is **not** wired to the production planner and its `liquidationValueEuro` is **not** a tax-grade estimate of household wealth. It is a hypothetical single-fund sale at each modeled year-end, with previously modeled advance tax treated as cash already paid.

## Important tax-year timing

The Vorabpauschale for a calendar year is generally deemed received in **January of the following calendar year**, not at the valuation date. The current annual projection deducts its estimated cash tax in the modeled valuation year for a simplified comparison. This is a **cash-timing approximation**, not a tax-year ledger. Consequently the same `annualRemainingAllowancesEuro` input is applied to the annual advance and hypothetical year-end sale even though those events may fall in **different tax years**. This is not suitable for reporting annual taxable income, withholding dates, or actual Sparer-Pauschbetrag consumption.

## Missing before enabling an after-tax UI

- Actual FIFO acquisition and disposal lots, including purchase dates and reinvestments
- Per-taxpayer allowance ledger with event dates, spouse treatment, other capital income and losses
- Distribution cash flows and distribution taxes; portfolio distributions are not total after-tax cash
- Actual historical assessed gross Vorabpauschalen on each disposed lot
- Fund classification verification, annual published basis rates, church tax and applicable withholding
- Independent tax-law review and reconciliation with the existing withdrawal engine

The projection intentionally requires a caller-supplied annual basis-rate series; it must not silently extrapolate future BMF rates. Use only for isolated deterministic scenarios and tests. In the UI, unsupported after-tax liquidation amounts must remain **Not calculated** until the above work is complete.

References: [InvStG §18](https://www.gesetze-im-internet.de/invstg_2018/__18.html), [§19](https://www.gesetze-im-internet.de/invstg_2018/__19.html), [§20](https://www.gesetze-im-internet.de/invstg_2018/__20.html).
