# ETF-001 — German ETF tax calculation (engine phase)

This PR provides independently testable **private-investor** calculations. **It does not yet alter the live Household Wealth Planner or claim tax-grade accuracy.**

- **2026 Vorabpauschale:** official basis rate **3.20%**, basic return 70% of this rate × start value, cap by positive total appreciation including distributions, subtract distributions, acquisition-year monthly proration, then fund-specific partial exemption.
- **Receipt:** 2026 advance is deemed received **4 January 2027**. Other calendar-year receipt dates are deliberately not guessed.
- **Disposal:** capital gain reduced by the **gross amounts of previously assessed Vorabpauschalen**, before applying partial exemption (§19 InvStG).
- **Categories:** equity 30%, mixed 15%, domestic real estate 60%, qualifying predominantly foreign real estate 80%, other 0%. Classification must be confirmed from fund documentation.
- **Tax:** default 25% capital gains tax plus 5.5% solidarity surcharge on the tax, subject to a caller-supplied **remaining** Sparer-Pauschbetrag. The €1,000/€2,000 annual allowance is shared across a person/couple and all income/events, **not** automatically reset per ETF or year.
- **Limitations:** No church tax, tax loss pots, Günstigerprüfung, foreign-source taxes, dividends/distribution withholding as a separate event, position-by-position FIFO, or exact multi-lot acquisition accounting. Acquisition month and values are simplified; integrate a dated, lot-level ledger before portfolio-wide tax outputs. Sale modelling needs full actual historical assessed gross advances. Future basis rates must be provided from published guidance.

Official sources:

- https://www.gesetze-im-internet.de/invstg_2018/__18.html
- https://www.gesetze-im-internet.de/invstg_2018/__19.html
- https://www.gesetze-im-internet.de/invstg_2018/__20.html
- https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Investmentsteuer/2026-01-13-basiszins-berechnung-vorabpauschale.html

Next integration task: implement a household allowance ledger and tax event dates, prove independent golden vectors, expose DE/EN tax assumptions, and reconcile both ETF-only and combined modes against the existing planner's projections.
